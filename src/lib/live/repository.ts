import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isAcceptingResponse,
  isLiveQuestionKind,
  MAX_LIVE_QUESTIONS,
  quizDeadline,
  rankLeaderboard,
  readResponseValue,
  scoreQuizResponse,
  summarizeResults,
  type LiveQuestion,
  type LiveQuestionDraft,
  type LiveResponseValue,
  type LiveSnapshot,
} from "@/lib/live/activities";

/** A request that is valid but conflicts with the live state (closed, answered). */
export class LiveConflictError extends Error {}
/** The referenced question is not in this room. */
export class LiveNotFoundError extends Error {}

interface SessionRow {
  question_id: string | null;
  is_accepting: boolean;
  show_results: boolean;
  opened_at: string | null;
}

interface StoredSession {
  questionId: string | null;
  isAccepting: boolean;
  showResults: boolean;
  openedAt: string | null;
}

const QUESTION_COLUMNS =
  "id, kind, prompt, options, correct_option, time_limit_seconds, position";

function mapQuestion(row: Record<string, unknown>): LiveQuestion {
  if (!isLiveQuestionKind(row.kind)) throw new Error("LIVE_QUESTION_INVALID");
  return {
    id: String(row.id),
    kind: row.kind,
    prompt: String(row.prompt),
    options: Array.isArray(row.options) ? row.options.map(String) : [],
    correctOption:
      typeof row.correct_option === "number" ? row.correct_option : null,
    timeLimitSeconds:
      typeof row.time_limit_seconds === "number"
        ? row.time_limit_seconds
        : null,
    position: Number(row.position),
  };
}

async function loadQuestions(
  admin: SupabaseClient,
  roomId: string,
): Promise<LiveQuestion[]> {
  const { data, error } = await admin
    .from("live_questions")
    .select(QUESTION_COLUMNS)
    .eq("room_id", roomId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("LIVE_QUESTIONS_LOAD_FAILED");
  return (data ?? []).map((row) => mapQuestion(row));
}

async function loadSession(
  admin: SupabaseClient,
  roomId: string,
): Promise<StoredSession> {
  const { data, error } = await admin
    .from("live_sessions")
    .select("question_id, is_accepting, show_results, opened_at")
    .eq("room_id", roomId)
    .maybeSingle<SessionRow>();
  if (error) throw new Error("LIVE_SESSION_LOAD_FAILED");
  return {
    questionId: data?.question_id ?? null,
    isAccepting: data?.is_accepting ?? false,
    showResults: data?.show_results ?? false,
    openedAt: data?.opened_at ?? null,
  };
}

async function saveSession(
  admin: SupabaseClient,
  roomId: string,
  patch: Partial<SessionRow>,
): Promise<void> {
  const { error } = await admin
    .from("live_sessions")
    .upsert(
      { room_id: roomId, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "room_id" },
    );
  if (error) throw new Error("LIVE_SESSION_SAVE_FAILED");
}

async function loadLeaderboard(
  admin: SupabaseClient,
  roomId: string,
  quizIds: string[],
  userId: string,
): Promise<LiveSnapshot["leaderboard"]> {
  if (quizIds.length === 0) return null;
  const { data, error } = await admin
    .from("live_responses")
    .select("user_id, points")
    .eq("room_id", roomId)
    .in("question_id", quizIds);
  if (error) throw new Error("LIVE_LEADERBOARD_LOAD_FAILED");

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    const id = String(row.user_id);
    totals.set(id, (totals.get(id) ?? 0) + Number(row.points));
  }
  const userIds = [...totals.keys()];
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    for (const profile of profiles ?? []) {
      names.set(String(profile.id), String(profile.display_name));
    }
  }
  return rankLeaderboard(
    userIds.map((id) => ({
      userId: id,
      name: names.get(id) ?? "Participant",
      points: totals.get(id) ?? 0,
    })),
    userId,
  );
}

export async function buildLiveSnapshot(
  admin: SupabaseClient,
  options: { roomId: string; userId: string; canHost: boolean; now?: Date },
): Promise<LiveSnapshot> {
  const { roomId, userId, canHost } = options;
  const [questions, session] = await Promise.all([
    loadQuestions(admin, roomId),
    loadSession(admin, roomId),
  ]);
  const current =
    questions.find((question) => question.id === session.questionId) ?? null;
  const base: LiveSnapshot = {
    canHost,
    questions: canHost ? questions : [],
    session: {
      questionId: current?.id ?? null,
      isAccepting: Boolean(current) && session.isAccepting,
      showResults: Boolean(current) && session.showResults,
      closesAt: current ? quizDeadline(current, session.openedAt) : null,
    },
    current: null,
    myResponse: null,
    myPoints: null,
    responseCount: 0,
    results: null,
    leaderboard: null,
  };
  if (!current) return base;

  const { data, error } = await admin
    .from("live_responses")
    .select("user_id, value, points")
    .eq("question_id", current.id)
    .order("submitted_at", { ascending: true });
  if (error) throw new Error("LIVE_RESPONSES_LOAD_FAILED");

  const rows = data ?? [];
  const mine = rows.find((row) => row.user_id === userId);
  const canSeeResults = canHost || session.showResults;
  const values = rows.map((row) => row.value as LiveResponseValue);

  return {
    ...base,
    current: canSeeResults ? current : { ...current, correctOption: null },
    myResponse: mine ? (mine.value as LiveResponseValue) : null,
    myPoints: mine && current.kind === "quiz" ? Number(mine.points) : null,
    responseCount: rows.length,
    results: canSeeResults ? summarizeResults(current, values) : null,
    leaderboard:
      session.showResults && current.kind === "quiz"
        ? await loadLeaderboard(
            admin,
            roomId,
            questions.filter((q) => q.kind === "quiz").map((q) => q.id),
            userId,
          )
        : null,
  };
}

export async function createLiveQuestion(
  admin: SupabaseClient,
  roomId: string,
  userId: string,
  draft: LiveQuestionDraft,
): Promise<void> {
  const questions = await loadQuestions(admin, roomId);
  if (questions.length >= MAX_LIVE_QUESTIONS) {
    throw new LiveConflictError(
      `A room can hold ${MAX_LIVE_QUESTIONS} live questions. Delete one first.`,
    );
  }
  const position =
    questions.reduce((highest, q) => Math.max(highest, q.position), -1) + 1;
  const { error } = await admin.from("live_questions").insert({
    room_id: roomId,
    created_by: userId,
    kind: draft.kind,
    prompt: draft.prompt,
    options: draft.options,
    correct_option: draft.correctOption,
    time_limit_seconds: draft.timeLimitSeconds,
    position,
  });
  if (error) throw new Error("LIVE_QUESTION_CREATE_FAILED");
}

export async function deleteLiveQuestion(
  admin: SupabaseClient,
  roomId: string,
  questionId: string,
): Promise<void> {
  const { data, error } = await admin
    .from("live_questions")
    .delete()
    .eq("id", questionId)
    .eq("room_id", roomId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("LIVE_QUESTION_DELETE_FAILED");
  if (!data) throw new LiveNotFoundError();
}

export async function presentLiveQuestion(
  admin: SupabaseClient,
  roomId: string,
  questionId: string | null,
): Promise<void> {
  if (questionId) {
    const { data, error } = await admin
      .from("live_questions")
      .select("id")
      .eq("id", questionId)
      .eq("room_id", roomId)
      .maybeSingle();
    if (error) throw new Error("LIVE_QUESTION_LOAD_FAILED");
    if (!data) throw new LiveNotFoundError();
  }
  await saveSession(admin, roomId, {
    question_id: questionId,
    is_accepting: false,
    show_results: false,
    opened_at: null,
  });
}

export async function setLiveAccepting(
  admin: SupabaseClient,
  roomId: string,
  value: boolean,
): Promise<void> {
  const session = await loadSession(admin, roomId);
  if (!session.questionId) {
    throw new LiveConflictError("Present a question first.");
  }
  await saveSession(
    admin,
    roomId,
    value
      ? { is_accepting: true, opened_at: new Date().toISOString() }
      : { is_accepting: false },
  );
}

export async function setLiveResultsVisible(
  admin: SupabaseClient,
  roomId: string,
  value: boolean,
): Promise<void> {
  const session = await loadSession(admin, roomId);
  if (!session.questionId) {
    throw new LiveConflictError("Present a question first.");
  }
  await saveSession(admin, roomId, { show_results: value });
}

export async function resetLiveResults(
  admin: SupabaseClient,
  roomId: string,
): Promise<void> {
  const { error } = await admin
    .from("live_responses")
    .delete()
    .eq("room_id", roomId);
  if (error) throw new Error("LIVE_RESULTS_RESET_FAILED");
}

export async function submitLiveResponse(
  admin: SupabaseClient,
  options: {
    roomId: string;
    userId: string;
    questionId: string;
    value: unknown;
  },
): Promise<void> {
  const { roomId, userId, questionId } = options;
  const now = new Date();
  const [session, questionResult] = await Promise.all([
    loadSession(admin, roomId),
    admin
      .from("live_questions")
      .select(QUESTION_COLUMNS)
      .eq("id", questionId)
      .eq("room_id", roomId)
      .maybeSingle(),
  ]);
  if (questionResult.error) throw new Error("LIVE_QUESTION_LOAD_FAILED");
  if (!questionResult.data) throw new LiveNotFoundError();

  const question = mapQuestion(questionResult.data);
  if (
    session.questionId !== question.id ||
    !isAcceptingResponse(question, session, now)
  ) {
    throw new LiveConflictError("Voting is closed for this question.");
  }
  const value = readResponseValue(question, options.value);
  const points =
    question.kind === "quiz" && session.openedAt
      ? scoreQuizResponse(question, value, session.openedAt, now)
      : 0;

  const { error } = await admin.from("live_responses").insert({
    question_id: question.id,
    room_id: roomId,
    user_id: userId,
    value,
    points,
    submitted_at: now.toISOString(),
  });
  if (error?.code === "23505") {
    throw new LiveConflictError("You already answered this question.");
  }
  if (error) throw new Error("LIVE_RESPONSE_SAVE_FAILED");
}

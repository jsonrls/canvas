import "server-only";

import { randomInt, randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  canShareResults,
  hasSecretAnswer,
  isAcceptingResponse,
  isLiveQuestionKind,
  isSameSet,
  listQaItems,
  LiveInputError,
  liveOpenError,
  liveRevealError,
  MAX_LIVE_QUESTIONS,
  publicQuestion,
  QA_LIMIT_PER_PERSON,
  quizDeadline,
  rankAll,
  rankLeaderboard,
  readLayout,
  readQaText,
  readResponseValue,
  scoreQuizResponse,
  summarizeResults,
  type LiveQuestion,
  type LiveQuestionDraft,
  type LiveResponseValue,
  type LiveSettings,
  type LiveSnapshot,
  type QaItemRow,
  type QaStatus,
} from "@/lib/live/activities";
import type { LiveScope } from "@/lib/live/scope";
import { hasJpegSignature } from "@/lib/room-banners/server";

const LIVE_IMAGE_BUCKET = "live-images";
const LIVE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

/** A request that is valid but conflicts with the live state (closed, answered). */
export class LiveConflictError extends Error {}
/** The referenced question is not in this scope. */
export class LiveNotFoundError extends Error {}

interface SessionRow {
  question_id: string | null;
  is_accepting: boolean;
  show_results: boolean;
  opened_at: string | null;
  guest_code?: string | null;
}

interface StoredSession {
  questionId: string | null;
  isAccepting: boolean;
  showResults: boolean;
  openedAt: string | null;
  /** Main rooms only: the code in the guest link, or null when guests are off. */
  guestCode: string | null;
}

/** Who wrote a row: members by user id, guests (main rooms only) by guest id. */
function participantColumn(
  isGuest: boolean | undefined,
): "guest_id" | "user_id" {
  return isGuest ? "guest_id" : "user_id";
}

const QUESTION_COLUMNS =
  "id, kind, prompt, options, correct_option, time_limit_seconds, position, settings";

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
    settings: (row.settings ?? {}) as LiveSettings,
  };
}

async function loadQuestions(
  admin: SupabaseClient,
  scope: LiveScope,
): Promise<LiveQuestion[]> {
  const { data, error } = await admin
    .from(scope.tables.questions)
    .select(QUESTION_COLUMNS)
    .eq(scope.column, scope.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error("LIVE_QUESTIONS_LOAD_FAILED");
  return (data ?? []).map((row) => mapQuestion(row));
}

async function loadSession(
  admin: SupabaseClient,
  scope: LiveScope,
): Promise<StoredSession> {
  // Only scopes that admit guests have a guest_code column.
  const columns = `question_id, is_accepting, show_results, opened_at${
    scope.tables.guests ? ", guest_code" : ""
  }`;
  const { data, error } = await admin
    .from(scope.tables.sessions)
    .select(columns)
    .eq(scope.column, scope.id)
    .maybeSingle<SessionRow>();
  if (error) throw new Error("LIVE_SESSION_LOAD_FAILED");
  return {
    questionId: data?.question_id ?? null,
    isAccepting: data?.is_accepting ?? false,
    showResults: data?.show_results ?? false,
    openedAt: data?.opened_at ?? null,
    guestCode: data?.guest_code ?? null,
  };
}

async function saveSession(
  admin: SupabaseClient,
  scope: LiveScope,
  patch: Partial<SessionRow>,
): Promise<void> {
  const { error } = await admin.from(scope.tables.sessions).upsert(
    {
      [scope.column]: scope.id,
      ...patch,
      updated_at: new Date().toISOString(),
    },
    { onConflict: scope.column },
  );
  if (error) throw new Error("LIVE_SESSION_SAVE_FAILED");
}

interface ResponseRow {
  question_id: string;
  participant_id: string;
  value: LiveResponseValue;
  points: number;
}

const PAGE_SIZE = 1000;

/** Every answer in a room. The API returns at most 1,000 rows per request. */
async function loadRoomResponses(
  admin: SupabaseClient,
  scope: LiveScope,
  questionIds: string[],
): Promise<ResponseRow[]> {
  const rows: ResponseRow[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from(scope.tables.responses)
      .select("question_id, participant_id, value, points")
      .eq(scope.column, scope.id)
      .in("question_id", questionIds)
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<ResponseRow[]>();
    if (error) throw new Error("LIVE_RESPONSES_LOAD_FAILED");
    rows.push(...(data ?? []));
    if ((data ?? []).length < PAGE_SIZE) return rows;
  }
}

async function loadScores(
  admin: SupabaseClient,
  scope: LiveScope,
  quizIds: string[],
): Promise<{ userId: string; name: string; points: number }[]> {
  if (quizIds.length === 0) return [];
  const totals = new Map<string, number>();
  for (const row of await loadRoomResponses(admin, scope, quizIds)) {
    totals.set(
      row.participant_id,
      (totals.get(row.participant_id) ?? 0) + row.points,
    );
  }
  const userIds = [...totals.keys()];
  const names = new Map<string, string>();
  if (userIds.length > 0) {
    const [{ data: profiles }, { data: guests }] = await Promise.all([
      admin.from("profiles").select("id, display_name").in("id", userIds),
      scope.tables.guests
        ? admin
            .from(scope.tables.guests)
            .select("id, display_name")
            .eq("room_id", scope.id)
            .in("id", userIds)
        : Promise.resolve({ data: [] }),
    ]);
    for (const person of [...(profiles ?? []), ...(guests ?? [])]) {
      names.set(String(person.id), String(person.display_name));
    }
  }
  return userIds.map((id) => ({
    userId: id,
    name: names.get(id) ?? "Participant",
    points: totals.get(id) ?? 0,
  }));
}

function quizIdsOf(questions: LiveQuestion[]): string[] {
  return questions.filter((q) => q.kind === "quiz").map((q) => q.id);
}

/** Everything the host's spreadsheet needs. Callers check the host role. */
export async function loadLiveExport(
  admin: SupabaseClient,
  scope: LiveScope,
  userId: string,
) {
  const questions = await loadQuestions(admin, scope);
  const responses = new Map<string, LiveResponseValue[]>();
  if (questions.length > 0) {
    const rows = await loadRoomResponses(
      admin,
      scope,
      questions.map((question) => question.id),
    );
    for (const row of rows) {
      const values = responses.get(row.question_id) ?? [];
      values.push(row.value);
      responses.set(row.question_id, values);
    }
  }
  const qa = new Map(
    await Promise.all(
      questions
        .filter((question) => question.kind === "qa")
        .map(
          async (question) =>
            [
              question.id,
              listQaItems(await loadQaItems(admin, scope, question.id), {
                canHost: true,
                userId,
              }),
            ] as const,
        ),
    ),
  );
  const leaderboard = rankAll(
    await loadScores(admin, scope, quizIdsOf(questions)),
  );
  return { leaderboard, qa, questions, responses };
}

interface QaItemResult {
  id: string;
  body: string;
  status: QaStatus;
  participant_id: string;
  created_at: string;
  votes: { participant_id: string }[];
}

async function loadQaItems(
  admin: SupabaseClient,
  scope: LiveScope,
  questionId: string,
): Promise<QaItemRow[]> {
  const { data, error } = await admin
    .from(scope.tables.qaItems)
    .select(
      `id, body, status, participant_id, created_at, votes:${scope.tables.qaVotes}(participant_id)`,
    )
    .eq("question_id", questionId)
    .returns<QaItemResult[]>();
  if (error) throw new Error("LIVE_QA_LOAD_FAILED");
  return (data ?? []).map((row) => ({
    id: row.id,
    body: row.body,
    status: row.status,
    userId: row.participant_id,
    createdAt: row.created_at,
    voterIds: row.votes.map((vote) => vote.participant_id),
  }));
}

/** Best effort: a leftover file must not undo the change that orphaned it. */
async function removeLiveImage(
  admin: SupabaseClient,
  path: string,
): Promise<void> {
  const { error } = await admin.storage.from(LIVE_IMAGE_BUCKET).remove([path]);
  if (error) console.error("Live image cleanup failed", { code: error.name });
}

/** Where a room and its breakouts keep images. Read before deleting the room. */
export async function listLiveImageFolders(
  client: SupabaseClient,
  roomId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("breakout_rooms")
    .select("id")
    .eq("room_id", roomId);
  if (error) console.error("Live image folders unavailable");
  return [roomId, ...(data ?? []).map((row) => String(row.id))];
}

export async function removeLiveImages(
  admin: SupabaseClient,
  folders: string[],
): Promise<void> {
  const files = admin.storage.from(LIVE_IMAGE_BUCKET);
  for (const folder of folders) {
    const { data } = await files.list(folder, {
      limit: MAX_LIVE_QUESTIONS * 2,
    });
    if (data && data.length > 0) {
      await files.remove(data.map((file) => `${folder}/${file.name}`));
    }
  }
}

/** The image of a pin question. Students only get the presented one. */
export async function loadLiveImage(
  admin: SupabaseClient,
  options: { scope: LiveScope; questionId: string; canHost: boolean },
): Promise<Blob> {
  const { scope, questionId, canHost } = options;
  if (!canHost) {
    const session = await loadSession(admin, scope);
    if (session.questionId !== questionId) throw new LiveNotFoundError();
  }
  const { data, error } = await admin
    .from(scope.tables.questions)
    .select("image_path")
    .eq("id", questionId)
    .eq(scope.column, scope.id)
    .maybeSingle();
  if (error) throw new Error("LIVE_QUESTION_LOAD_FAILED");
  if (typeof data?.image_path !== "string") throw new LiveNotFoundError();
  const file = await admin.storage
    .from(LIVE_IMAGE_BUCKET)
    .download(data.image_path);
  if (file.error || !file.data) throw new Error("LIVE_IMAGE_LOAD_FAILED");
  return file.data;
}

/**
 * What one participant sees. `userId` is a guest id for guests; both kinds are
 * matched through participant_id.
 */
export async function buildLiveSnapshot(
  admin: SupabaseClient,
  options: { scope: LiveScope; userId: string; canHost: boolean; now?: Date },
): Promise<LiveSnapshot> {
  const { scope, userId, canHost } = options;
  const [questions, session] = await Promise.all([
    loadQuestions(admin, scope),
    loadSession(admin, scope),
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
      hasOpened: Boolean(current) && session.openedAt !== null,
      closesAt: current ? quizDeadline(current, session.openedAt) : null,
    },
    current: null,
    myResponse: null,
    myPoints: null,
    responseCount: 0,
    results: null,
    leaderboard: null,
    qa: null,
    guestCode: canHost ? session.guestCode : null,
  };
  if (!current) return base;

  if (current.kind === "qa") {
    const rows = await loadQaItems(admin, scope, current.id);
    return {
      ...base,
      current,
      responseCount: rows.length,
      qa: listQaItems(rows, { canHost, userId }),
    };
  }

  const { data, error } = await admin
    .from(scope.tables.responses)
    .select("participant_id, value, points")
    .eq("question_id", current.id)
    .order("submitted_at", { ascending: true });
  if (error) throw new Error("LIVE_RESPONSES_LOAD_FAILED");

  const rows = data ?? [];
  const mine = rows.find((row) => row.participant_id === userId);
  const canSeeResults =
    canHost || (session.showResults && canShareResults(current.kind));
  const values = rows.map((row) => row.value as LiveResponseValue);

  return {
    ...base,
    current: publicQuestion(current, canSeeResults),
    myResponse: mine ? (mine.value as LiveResponseValue) : null,
    myPoints: mine && current.kind === "quiz" ? Number(mine.points) : null,
    responseCount: rows.length,
    results: canSeeResults ? summarizeResults(current, values) : null,
    leaderboard:
      session.showResults && current.kind === "quiz"
        ? rankLeaderboard(
            await loadScores(admin, scope, quizIdsOf(questions)),
            userId,
          )
        : null,
  };
}

export async function createLiveQuestion(
  admin: SupabaseClient,
  scope: LiveScope,
  userId: string,
  draft: LiveQuestionDraft,
  image: File | null,
): Promise<void> {
  if (draft.kind === "pin") {
    if (
      !image ||
      image.type !== "image/jpeg" ||
      image.size > LIVE_IMAGE_MAX_BYTES ||
      !(await hasJpegSignature(image))
    ) {
      throw new LiveInputError("Add a JPEG image smaller than 2 MB.");
    }
  }
  const questions = await loadQuestions(admin, scope);
  if (questions.length >= MAX_LIVE_QUESTIONS) {
    throw new LiveConflictError(
      `A room can hold ${MAX_LIVE_QUESTIONS} live questions. Delete one first.`,
    );
  }
  const position =
    questions.reduce((highest, q) => Math.max(highest, q.position), -1) + 1;
  const imagePath =
    draft.kind === "pin" && image ? `${scope.id}/${randomUUID()}.jpg` : null;
  if (imagePath && image) {
    const { error: uploadError } = await admin.storage
      .from(LIVE_IMAGE_BUCKET)
      .upload(imagePath, image, { contentType: "image/jpeg" });
    if (uploadError) throw new Error("LIVE_IMAGE_UPLOAD_FAILED");
  }
  const { error } = await admin.from(scope.tables.questions).insert({
    [scope.column]: scope.id,
    created_by: userId,
    kind: draft.kind,
    prompt: draft.prompt,
    options: draft.options,
    correct_option: draft.correctOption,
    time_limit_seconds: draft.timeLimitSeconds,
    position,
    settings: draft.settings,
    image_path: imagePath,
  });
  if (error) {
    if (imagePath) await removeLiveImage(admin, imagePath);
    throw new Error("LIVE_QUESTION_CREATE_FAILED");
  }
}

export async function deleteLiveQuestion(
  admin: SupabaseClient,
  scope: LiveScope,
  questionId: string,
): Promise<void> {
  const { data, error } = await admin
    .from(scope.tables.questions)
    .delete()
    .eq("id", questionId)
    .eq(scope.column, scope.id)
    .select("id, image_path")
    .maybeSingle();
  if (error) throw new Error("LIVE_QUESTION_DELETE_FAILED");
  if (!data) throw new LiveNotFoundError();
  if (typeof data.image_path === "string") {
    await removeLiveImage(admin, data.image_path);
  }
}

/** Puts the room's questions in the given order, which must name each once. */
export async function reorderLiveQuestions(
  admin: SupabaseClient,
  scope: LiveScope,
  questionIds: string[],
): Promise<void> {
  const questions = await loadQuestions(admin, scope);
  const current = questions.map((question) => question.id);
  if (!isSameSet(current, questionIds)) {
    throw new LiveConflictError("The questions changed. Try moving it again.");
  }
  const positions = new Map(questions.map((q) => [q.id, q.position]));
  const results = await Promise.all(
    questionIds.flatMap((id, position) =>
      positions.get(id) === position
        ? []
        : [
            admin
              .from(scope.tables.questions)
              .update({ position })
              .eq("id", id)
              .eq(scope.column, scope.id),
          ],
    ),
  );
  if (results.some(({ error }) => error)) {
    throw new Error("LIVE_QUESTIONS_REORDER_FAILED");
  }
}

export async function presentLiveQuestion(
  admin: SupabaseClient,
  scope: LiveScope,
  questionId: string | null,
): Promise<void> {
  if (questionId) {
    const { data, error } = await admin
      .from(scope.tables.questions)
      .select("id")
      .eq("id", questionId)
      .eq(scope.column, scope.id)
      .maybeSingle();
    if (error) throw new Error("LIVE_QUESTION_LOAD_FAILED");
    if (!data) throw new LiveNotFoundError();
  }
  await saveSession(admin, scope, {
    question_id: questionId,
    is_accepting: false,
    show_results: false,
    opened_at: null,
  });
}

async function loadPresented(admin: SupabaseClient, scope: LiveScope) {
  const session = await loadSession(admin, scope);
  if (!session.questionId) {
    throw new LiveConflictError("Present a question first.");
  }
  const [questionResult, countResult] = await Promise.all([
    admin
      .from(scope.tables.questions)
      .select(QUESTION_COLUMNS)
      .eq("id", session.questionId)
      .eq(scope.column, scope.id)
      .maybeSingle(),
    admin
      .from(scope.tables.responses)
      .select("id", { count: "exact" })
      .eq("question_id", session.questionId)
      .limit(1),
  ]);
  if (questionResult.error) throw new Error("LIVE_QUESTION_LOAD_FAILED");
  if (countResult.error) throw new Error("LIVE_RESPONSES_LOAD_FAILED");
  if (!questionResult.data) throw new LiveNotFoundError();
  return {
    question: mapQuestion(questionResult.data),
    run: {
      hasOpened: session.openedAt !== null,
      responseCount: countResult.count ?? 0,
    },
    session,
  };
}

export async function setLiveAccepting(
  admin: SupabaseClient,
  scope: LiveScope,
  value: boolean,
): Promise<void> {
  const { question, run, session } = await loadPresented(admin, scope);
  if (!value) {
    await saveSession(admin, scope, { is_accepting: false });
    return;
  }
  // A second click from a stale screen must not restart the quiz clock.
  if (session.isAccepting) return;
  const blocked = liveOpenError(question, run);
  if (blocked) throw new LiveConflictError(blocked);
  await saveSession(admin, scope, {
    is_accepting: true,
    opened_at: new Date().toISOString(),
  });
}

export async function setLiveResultsVisible(
  admin: SupabaseClient,
  scope: LiveScope,
  value: boolean,
): Promise<void> {
  const { question, run } = await loadPresented(admin, scope);
  if (!value) {
    await saveSession(admin, scope, { show_results: false });
    return;
  }
  const blocked = liveRevealError(question, run);
  if (blocked) throw new LiveConflictError(blocked);
  await saveSession(
    admin,
    scope,
    hasSecretAnswer(question)
      ? { show_results: true, is_accepting: false }
      : { show_results: true },
  );
}

export async function setLiveLayout(
  admin: SupabaseClient,
  scope: LiveScope,
  questionId: string,
  layout: unknown,
): Promise<void> {
  const { data, error } = await admin
    .from(scope.tables.questions)
    .select(QUESTION_COLUMNS)
    .eq("id", questionId)
    .eq(scope.column, scope.id)
    .maybeSingle();
  if (error) throw new Error("LIVE_QUESTION_LOAD_FAILED");
  if (!data) throw new LiveNotFoundError();
  const { kind, settings } = mapQuestion(data);
  const { error: saveError } = await admin
    .from(scope.tables.questions)
    .update({ settings: { ...settings, layout: readLayout(kind, layout) } })
    .eq("id", questionId)
    .eq(scope.column, scope.id);
  if (saveError) throw new Error("LIVE_QUESTION_SAVE_FAILED");
}

export async function resetLiveResults(
  admin: SupabaseClient,
  scope: LiveScope,
): Promise<void> {
  const { error } = await admin
    .from(scope.tables.responses)
    .delete()
    .eq(scope.column, scope.id);
  if (error) throw new Error("LIVE_RESULTS_RESET_FAILED");
  const { error: qaError } = await admin
    .from(scope.tables.qaItems)
    .delete()
    .eq(scope.column, scope.id);
  if (qaError) throw new Error("LIVE_RESULTS_RESET_FAILED");
  await saveSession(admin, scope, {
    is_accepting: false,
    show_results: false,
    opened_at: null,
  });
}

export async function submitLiveResponse(
  admin: SupabaseClient,
  options: {
    scope: LiveScope;
    userId: string;
    isGuest?: boolean;
    questionId: string;
    value: unknown;
  },
): Promise<void> {
  const { scope, userId, questionId } = options;
  const now = new Date();
  const [session, questionResult] = await Promise.all([
    loadSession(admin, scope),
    admin
      .from(scope.tables.questions)
      .select(QUESTION_COLUMNS)
      .eq("id", questionId)
      .eq(scope.column, scope.id)
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

  const { error } = await admin.from(scope.tables.responses).insert({
    question_id: question.id,
    [scope.column]: scope.id,
    [participantColumn(options.isGuest)]: userId,
    value,
    points,
    submitted_at: now.toISOString(),
  });
  if (error?.code === "23505") {
    throw new LiveConflictError("You already answered this question.");
  }
  if (error) throw new Error("LIVE_RESPONSE_SAVE_FAILED");
}

async function requireOpenQa(
  admin: SupabaseClient,
  scope: LiveScope,
  questionId: string,
): Promise<LiveQuestion> {
  const { question, session } = await loadPresented(admin, scope);
  if (
    question.id !== questionId ||
    question.kind !== "qa" ||
    !session.isAccepting
  ) {
    throw new LiveConflictError("Q&A is closed.");
  }
  return question;
}

export async function askLiveQuestion(
  admin: SupabaseClient,
  options: {
    scope: LiveScope;
    userId: string;
    isGuest?: boolean;
    questionId: string;
    text: unknown;
  },
): Promise<void> {
  const { scope, userId, questionId } = options;
  const body = readQaText(options.text);
  const question = await requireOpenQa(admin, scope, questionId);
  const { data, error: countError } = await admin
    .from(scope.tables.qaItems)
    .select("id")
    .eq("question_id", questionId)
    .eq("participant_id", userId);
  if (countError) throw new Error("LIVE_QA_LOAD_FAILED");
  if ((data ?? []).length >= QA_LIMIT_PER_PERSON) {
    throw new LiveConflictError(
      `You can ask up to ${QA_LIMIT_PER_PERSON} questions here.`,
    );
  }
  const { error } = await admin.from(scope.tables.qaItems).insert({
    question_id: questionId,
    [scope.column]: scope.id,
    [participantColumn(options.isGuest)]: userId,
    body,
    status: question.settings.moderated ? "pending" : "visible",
  });
  if (error) throw new Error("LIVE_QA_SAVE_FAILED");
}

export async function voteLiveQuestion(
  admin: SupabaseClient,
  options: {
    scope: LiveScope;
    userId: string;
    isGuest?: boolean;
    itemId: string;
    value: boolean;
  },
): Promise<void> {
  const { scope, userId, itemId, value } = options;
  const { data, error } = await admin
    .from(scope.tables.qaItems)
    .select("question_id, status, participant_id")
    .eq("id", itemId)
    .eq(scope.column, scope.id)
    .maybeSingle();
  if (error) throw new Error("LIVE_QA_LOAD_FAILED");
  if (!data || data.status !== "visible") throw new LiveNotFoundError();
  if (data.participant_id === userId) {
    throw new LiveConflictError("You can't vote for your own question.");
  }
  await requireOpenQa(admin, scope, String(data.question_id));
  const votes = admin.from(scope.tables.qaVotes);
  const { error: voteError } = value
    ? await votes.insert({
        item_id: itemId,
        [participantColumn(options.isGuest)]: userId,
      })
    : await votes.delete().eq("item_id", itemId).eq("participant_id", userId);
  // 23505: already voted, for example from a second tab.
  if (voteError && voteError.code !== "23505") {
    throw new Error("LIVE_QA_SAVE_FAILED");
  }
}

export async function setLiveQaStatus(
  admin: SupabaseClient,
  scope: LiveScope,
  itemId: string,
  status: QaStatus,
): Promise<void> {
  const { data, error } = await admin
    .from(scope.tables.qaItems)
    .update({ status })
    .eq("id", itemId)
    .eq(scope.column, scope.id)
    .select("id")
    .maybeSingle();
  if (error) throw new Error("LIVE_QA_SAVE_FAILED");
  if (!data) throw new LiveNotFoundError();
}

const GUEST_CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/**
 * A guest link code: the room slug, then 10 random lowercase letters or
 * digits. The slug makes the link readable; the suffix keeps it unguessable.
 */
export const GUEST_CODE_PATTERN = /^[a-z0-9-]{1,64}-[a-z0-9]{10}$/;

export function createGuestCode(roomSlug: string): string {
  let suffix = "";
  for (let index = 0; index < 10; index += 1) {
    suffix += GUEST_CODE_ALPHABET[randomInt(GUEST_CODE_ALPHABET.length)];
  }
  return `${roomSlug}-${suffix}`;
}

/**
 * Turns the main room's guest link on or off. Turning it on again makes a new
 * code, so links and QR codes shared before stop working.
 */
export async function setLiveGuestAccess(
  admin: SupabaseClient,
  scope: LiveScope,
  value: boolean,
): Promise<void> {
  if (!scope.tables.guests) {
    throw new LiveInputError("Guest links are only available in main rooms.");
  }
  const session = await loadSession(admin, scope);
  // A second click from a stale screen must not replace a shared code.
  if (value === (session.guestCode !== null)) return;
  if (!value) {
    await saveSession(admin, scope, { guest_code: null });
    return;
  }
  const { data, error } = await admin
    .from("rooms")
    .select("slug")
    .eq("id", scope.id)
    .maybeSingle();
  if (error) throw new Error("LIVE_ROOM_LOAD_FAILED");
  if (typeof data?.slug !== "string") throw new LiveNotFoundError();
  await saveSession(admin, scope, { guest_code: createGuestCode(data.slug) });
}

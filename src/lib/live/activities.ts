// Pure rules for teacher-led live activities: input validation, quiz scoring,
// and the aggregated results students are allowed to see.

export const LIVE_QUESTION_KINDS = [
  "poll",
  "word_cloud",
  "open_ended",
  "scale",
  "quiz",
] as const;

export type LiveQuestionKind = (typeof LIVE_QUESTION_KINDS)[number];

export const LIVE_KIND_LABELS: Record<LiveQuestionKind, string> = {
  poll: "Multiple choice",
  word_cloud: "Word cloud",
  open_ended: "Open ended",
  scale: "Scale (1–5)",
  quiz: "Quiz",
};

export const MAX_LIVE_QUESTIONS = 50;
export const SCALE_MAX = 5;
export const OPTIONS_MIN = 2;
export const OPTIONS_MAX = 6;
export const WORDS_MAX = 3;
export const QUIZ_LIMIT_DEFAULT = 30;
const PROMPT_MIN = 3;
const PROMPT_MAX = 200;
const OPTION_MAX_LENGTH = 80;
const QUIZ_LIMIT_MIN = 5;
const QUIZ_LIMIT_MAX = 120;
const WORD_MAX_LENGTH = 25;
const TEXT_MAX_LENGTH = 280;
const WORD_CLOUD_LIMIT = 40;
const TEXT_LIST_LIMIT = 50;
const LEADERBOARD_SIZE = 10;

export interface LiveQuestionDraft {
  kind: LiveQuestionKind;
  prompt: string;
  options: string[];
  correctOption: number | null;
  timeLimitSeconds: number | null;
}

export interface LiveQuestion extends LiveQuestionDraft {
  id: string;
  position: number;
}

export type LiveResponseValue =
  | { option: number }
  | { words: string[] }
  | { text: string }
  | { rating: number };

export type LiveResults =
  | { type: "choice"; counts: number[]; total: number }
  | {
      type: "words";
      words: Array<{ text: string; count: number }>;
      total: number;
    }
  | { type: "texts"; texts: string[]; total: number }
  | {
      type: "scale";
      counts: number[];
      average: number | null;
      total: number;
    };

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  isMe: boolean;
}

export interface Leaderboard {
  top: LeaderboardEntry[];
  me: LeaderboardEntry | null;
}

export interface LiveSessionState {
  questionId: string | null;
  isAccepting: boolean;
  showResults: boolean;
  closesAt: string | null;
}

export interface LiveSnapshot {
  canHost: boolean;
  questions: LiveQuestion[];
  session: LiveSessionState;
  current: LiveQuestion | null;
  myResponse: LiveResponseValue | null;
  myPoints: number | null;
  responseCount: number;
  results: LiveResults | null;
  leaderboard: Leaderboard | null;
}

export type LiveAction =
  | { action: "create_question"; draft: LiveQuestionDraft }
  | { action: "delete_question"; questionId: string }
  | { action: "present"; questionId: string | null }
  | { action: "set_accepting"; value: boolean }
  | { action: "set_results"; value: boolean }
  | { action: "reset_results" }
  | { action: "respond"; questionId: string; value: LiveResponseValue };

export class LiveInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LiveInputError";
  }
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new LiveInputError("The live activity request is invalid.");
  }
  return input as Record<string, unknown>;
}

function readTrimmed(
  value: unknown,
  label: string,
  min: number,
  max: number,
): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (text.length < min || text.length > max) {
    throw new LiveInputError(`${label} must be ${min}–${max} characters.`);
  }
  return text;
}

function readInteger(
  value: unknown,
  min: number,
  max: number,
  message: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new LiveInputError(message);
  }
  return value;
}

export function isLiveQuestionKind(value: unknown): value is LiveQuestionKind {
  return LIVE_QUESTION_KINDS.includes(value as LiveQuestionKind);
}

export function hasChoices(kind: LiveQuestionKind): boolean {
  return kind === "poll" || kind === "quiz";
}

export function readQuestionDraft(input: unknown): LiveQuestionDraft {
  const record = asRecord(input);
  if (!isLiveQuestionKind(record.kind)) {
    throw new LiveInputError("Choose a question type.");
  }
  const kind = record.kind;
  const prompt = readTrimmed(
    record.prompt,
    "The question",
    PROMPT_MIN,
    PROMPT_MAX,
  );

  if (!hasChoices(kind)) {
    return {
      kind,
      prompt,
      options: [],
      correctOption: null,
      timeLimitSeconds: null,
    };
  }

  const rawOptions = Array.isArray(record.options) ? record.options : [];
  if (rawOptions.length < OPTIONS_MIN || rawOptions.length > OPTIONS_MAX) {
    throw new LiveInputError(`Add ${OPTIONS_MIN}–${OPTIONS_MAX} options.`);
  }
  const options = rawOptions.map((option) =>
    readTrimmed(option, "Each option", 1, OPTION_MAX_LENGTH),
  );
  if (
    new Set(options.map((option) => option.toLowerCase())).size !==
    options.length
  ) {
    throw new LiveInputError("Each option must be different.");
  }

  if (kind === "poll") {
    return {
      kind,
      prompt,
      options,
      correctOption: null,
      timeLimitSeconds: null,
    };
  }

  const correctOption = readInteger(
    record.correctOption,
    0,
    options.length - 1,
    "Mark the correct answer.",
  );
  const timeLimitSeconds =
    record.timeLimitSeconds === undefined || record.timeLimitSeconds === null
      ? QUIZ_LIMIT_DEFAULT
      : readInteger(
          record.timeLimitSeconds,
          QUIZ_LIMIT_MIN,
          QUIZ_LIMIT_MAX,
          `The time limit must be ${QUIZ_LIMIT_MIN}–${QUIZ_LIMIT_MAX} seconds.`,
        );
  return { kind, prompt, options, correctOption, timeLimitSeconds };
}

export function readResponseValue(
  question: LiveQuestionDraft,
  input: unknown,
): LiveResponseValue {
  const record = asRecord(input);

  switch (question.kind) {
    case "poll":
    case "quiz":
      return {
        option: readInteger(
          record.option,
          0,
          question.options.length - 1,
          "Choose an option.",
        ),
      };
    case "word_cloud": {
      const raw = Array.isArray(record.words) ? record.words : [];
      if (raw.length > WORDS_MAX) {
        throw new LiveInputError(`Send up to ${WORDS_MAX} words.`);
      }
      const words = [
        ...new Set(
          raw.map((word) =>
            typeof word === "string" ? word.trim().toLowerCase() : "",
          ),
        ),
      ].filter(Boolean);
      if (words.length === 0) {
        throw new LiveInputError("Type at least one word.");
      }
      if (words.some((word) => word.length > WORD_MAX_LENGTH)) {
        throw new LiveInputError(
          `Words must be ${WORD_MAX_LENGTH} characters or fewer.`,
        );
      }
      return { words };
    }
    case "open_ended":
      return {
        text: readTrimmed(record.text, "Your answer", 1, TEXT_MAX_LENGTH),
      };
    case "scale":
      return {
        rating: readInteger(
          record.rating,
          1,
          SCALE_MAX,
          `Choose a rating from 1 to ${SCALE_MAX}.`,
        ),
      };
  }
}

export function quizDeadline(
  question: LiveQuestionDraft,
  openedAt: string | null,
): string | null {
  if (
    question.kind !== "quiz" ||
    !openedAt ||
    question.timeLimitSeconds === null
  ) {
    return null;
  }
  const opened = Date.parse(openedAt);
  if (Number.isNaN(opened)) return null;
  return new Date(opened + question.timeLimitSeconds * 1000).toISOString();
}

export function isAcceptingResponse(
  question: LiveQuestionDraft,
  session: { isAccepting: boolean; openedAt: string | null },
  now: Date,
): boolean {
  if (!session.isAccepting) return false;
  const deadline = quizDeadline(question, session.openedAt);
  return deadline === null || now.getTime() <= Date.parse(deadline);
}

export function scoreQuizResponse(
  question: LiveQuestionDraft,
  value: LiveResponseValue,
  openedAt: string,
  submittedAt: Date,
): number {
  if (
    question.kind !== "quiz" ||
    !("option" in value) ||
    value.option !== question.correctOption ||
    question.timeLimitSeconds === null
  ) {
    return 0;
  }
  const elapsedSeconds = Math.max(
    0,
    (submittedAt.getTime() - Date.parse(openedAt)) / 1000,
  );
  const speed = Math.max(0, 1 - elapsedSeconds / question.timeLimitSeconds);
  return 500 + Math.round(500 * speed);
}

/** Values must be ordered oldest first; text lists show the newest first. */
export function summarizeResults(
  question: LiveQuestionDraft,
  values: LiveResponseValue[],
): LiveResults {
  const total = values.length;

  switch (question.kind) {
    case "poll":
    case "quiz": {
      const counts = question.options.map(() => 0);
      for (const value of values) {
        if ("option" in value && counts[value.option] !== undefined) {
          counts[value.option] += 1;
        }
      }
      return { type: "choice", counts, total };
    }
    case "word_cloud": {
      const tally = new Map<string, number>();
      for (const value of values) {
        if (!("words" in value)) continue;
        for (const word of value.words) {
          tally.set(word, (tally.get(word) ?? 0) + 1);
        }
      }
      const words = [...tally.entries()]
        .map(([text, count]) => ({ text, count }))
        .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
        .slice(0, WORD_CLOUD_LIMIT);
      return { type: "words", words, total };
    }
    case "open_ended": {
      const texts = values
        .flatMap((value) => ("text" in value ? [value.text] : []))
        .reverse()
        .slice(0, TEXT_LIST_LIMIT);
      return { type: "texts", texts, total };
    }
    case "scale": {
      const counts = Array.from({ length: SCALE_MAX }, () => 0);
      let sum = 0;
      for (const value of values) {
        if (!("rating" in value)) continue;
        counts[value.rating - 1] += 1;
        sum += value.rating;
      }
      const average = total === 0 ? null : Math.round((sum / total) * 10) / 10;
      return { type: "scale", counts, average, total };
    }
  }
}

export function rankLeaderboard(
  rows: Array<{ userId: string; name: string; points: number }>,
  currentUserId: string,
): Leaderboard {
  const sorted = [...rows].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );
  let previousPoints: number | null = null;
  let previousRank = 0;
  const ranked = sorted.map((row, index) => {
    const rank = row.points === previousPoints ? previousRank : index + 1;
    previousPoints = row.points;
    previousRank = rank;
    return {
      rank,
      name: row.name,
      points: row.points,
      isMe: row.userId === currentUserId,
    };
  });
  return {
    top: ranked.slice(0, LEADERBOARD_SIZE),
    me: ranked.find((entry) => entry.isMe) ?? null,
  };
}

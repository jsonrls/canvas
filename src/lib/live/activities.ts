// Pure rules for teacher-led live activities: input validation, quiz scoring,
// and the aggregated results students are allowed to see.

export const LIVE_QUESTION_KINDS = [
  "poll",
  "word_cloud",
  "open_ended",
  "scale",
  "quiz",
  "ranking",
  "points",
  "grid",
  "number",
  "form",
  "pin",
  "qa",
] as const;

export type LiveQuestionKind = (typeof LIVE_QUESTION_KINDS)[number];

export const LIVE_KIND_LABELS: Record<LiveQuestionKind, string> = {
  poll: "Multiple choice",
  word_cloud: "Word cloud",
  open_ended: "Open ended",
  scale: "Scales (1–5)",
  quiz: "Quiz",
  ranking: "Ranking",
  points: "100 points",
  grid: "2×2 grid",
  number: "Guess the number",
  form: "Quick form",
  pin: "Pin on image",
  qa: "Live Q&A",
};

export const MAX_LIVE_QUESTIONS = 50;
export const SCALE_MAX = 5;
export const POINTS_TOTAL = 100;
export const GRID_MAX = 10;
export const QA_LIMIT_PER_PERSON = 10;

/** Types that carry a list, what the list is called, and how long it may be. */
export const LIVE_OPTION_RULES: Partial<
  Record<
    LiveQuestionKind,
    { noun: string; plural: string; min: number; max: number }
  >
> = {
  poll: { noun: "Option", plural: "Options", min: 2, max: 6 },
  quiz: { noun: "Option", plural: "Options", min: 2, max: 6 },
  ranking: { noun: "Item", plural: "Items", min: 2, max: 6 },
  points: { noun: "Item", plural: "Items", min: 2, max: 6 },
  grid: { noun: "Item", plural: "Items", min: 1, max: 6 },
  form: { noun: "Field", plural: "Fields", min: 1, max: 6 },
  scale: { noun: "Statement", plural: "Statements", min: 0, max: 6 },
};
export const WORDS_MAX = 3;
export const QUIZ_LIMIT_DEFAULT = 30;
const PROMPT_MIN = 3;
const PROMPT_MAX = 200;
const OPTION_MAX_LENGTH = 80;
const QUIZ_LIMIT_MIN = 5;
const QUIZ_LIMIT_MAX = 120;
const WORD_MAX_LENGTH = 25;
const TEXT_MAX_LENGTH = 280;
const AXIS_MAX_LENGTH = 40;
const FIELD_MAX_LENGTH = 200;
const NUMBER_LIMIT = 1_000_000;
const NUMBER_BUCKETS = 10;
const FORM_ROW_LIMIT = 200;
const PIN_LIMIT = 500;
const WORD_CLOUD_LIMIT = 40;
const TEXT_LIST_LIMIT = 50;
const LEADERBOARD_SIZE = 10;

export const LIVE_LAYOUT_LABELS = {
  columns: "Columns",
  donut: "Donut",
  pie: "Pie",
  dots: "Dots",
  bubbles: "Bubbles",
  grid: "Flowing grid",
} as const;

export type LiveLayout = keyof typeof LIVE_LAYOUT_LABELS;

/** Types whose results can be drawn in several ways; the first is the default. */
export const LIVE_LAYOUTS: Partial<
  Record<LiveQuestionKind, readonly LiveLayout[]>
> = {
  poll: ["columns", "donut", "pie", "dots"],
  quiz: ["columns", "donut", "pie", "dots"],
  open_ended: ["bubbles", "grid"],
};

export const FORM_FIELD_LABELS = {
  text: "Short text",
  email: "Email",
  date: "Date",
  choice: "Pick one",
} as const;

export type FormFieldType = keyof typeof FORM_FIELD_LABELS;

export interface FormField {
  type: FormFieldType;
  required: boolean;
  /** For "choice" only. */
  choices?: string[];
}

/** A rectangle on an image, in percent of its width and height. */
export interface LiveArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LiveSettings {
  /** Guess the number. `answer` is secret until results are shown. */
  min?: number;
  max?: number;
  answer?: number;
  /** 2×2 grid axis names. */
  xLabel?: string;
  yLabel?: string;
  /** Q&A questions wait for a host before others see them. */
  moderated?: boolean;
  /** How results are drawn; see LIVE_LAYOUTS. */
  layout?: LiveLayout;
  /** Quick form: one entry per field. Absent means all short text. */
  fields?: FormField[];
  /** Pin on image: the correct area, secret until results are shown. */
  area?: LiveArea;
}

export interface LiveQuestionDraft {
  kind: LiveQuestionKind;
  prompt: string;
  options: string[];
  correctOption: number | null;
  timeLimitSeconds: number | null;
  settings: LiveSettings;
}

export interface LiveQuestion extends LiveQuestionDraft {
  id: string;
  position: number;
}

export interface LivePoint {
  x: number;
  y: number;
}

export type LiveResponseValue =
  | { option: number }
  | { words: string[] }
  | { text: string }
  // Single ratings saved before scales had several statements.
  | { rating: number }
  | { ratings: number[] }
  | { order: number[] }
  | { points: number[] }
  | { positions: LivePoint[] }
  | { number: number }
  | { fields: string[] }
  | { pin: LivePoint };

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
      rows: Array<{
        label: string | null;
        counts: number[];
        average: number | null;
      }>;
      total: number;
    }
  | {
      type: "ranking";
      rows: Array<{ option: number; average: number }>;
      total: number;
    }
  | { type: "points"; averages: number[]; total: number }
  | { type: "grid"; averages: LivePoint[]; total: number }
  | {
      type: "number";
      buckets: Array<{ from: number; to: number; count: number }>;
      average: number | null;
      exact: number;
      total: number;
    }
  | { type: "form"; rows: string[][]; total: number }
  | {
      type: "pin";
      pins: LivePoint[];
      /** Pins inside the correct area, or null when there is none. */
      inArea: number | null;
      total: number;
    };

export const QA_STATUSES = [
  "visible",
  "pending",
  "answered",
  "hidden",
] as const;
export type QaStatus = (typeof QA_STATUSES)[number];

export interface QaItemRow {
  id: string;
  body: string;
  status: QaStatus;
  userId: string;
  voterIds: string[];
  createdAt: string;
}

export interface QaItem {
  id: string;
  body: string;
  status: QaStatus;
  votes: number;
  votedByMe: boolean;
  isMine: boolean;
}

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
  hasOpened: boolean;
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
  qa: QaItem[] | null;
  /** Hosts of a main room: the guest link code, or null when guests are off. */
  guestCode: string | null;
}

export type LiveAction =
  | { action: "create_question"; draft: LiveQuestionDraft }
  | { action: "delete_question"; questionId: string }
  | { action: "reorder_questions"; questionIds: string[] }
  | { action: "present"; questionId: string | null }
  | { action: "set_accepting"; value: boolean }
  | { action: "set_results"; value: boolean }
  | { action: "reset_results" }
  | { action: "set_layout"; questionId: string; layout: LiveLayout }
  | { action: "respond"; questionId: string; value: LiveResponseValue }
  | { action: "qa_ask"; questionId: string; text: string }
  | { action: "qa_vote"; itemId: string; value: boolean }
  | { action: "qa_set_status"; itemId: string; status: QaStatus }
  | { action: "set_guest_access"; value: boolean }
  /** Guest link only: the name a guest answers under. */
  | { action: "join"; name: string };

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

/** Questions whose correct answer is secret until the host shows results. */
export function hasSecretAnswer({
  kind,
  settings,
}: Pick<LiveQuestionDraft, "kind" | "settings">): boolean {
  return (
    kind === "quiz" ||
    kind === "number" ||
    (kind === "pin" && settings.area !== undefined)
  );
}

/** Quick forms collect personal details, so only hosts ever see them. */
export function canShareResults(kind: LiveQuestionKind): boolean {
  return kind !== "form";
}

/** A copy of the list with one entry moved to another place. */
export function moveItem<Item>(list: Item[], from: number, to: number): Item[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** True when both lists hold the same entries, each once, in any order. */
export function isSameSet(a: string[], b: string[]): boolean {
  const seen = new Set(a);
  return (
    a.length === b.length &&
    seen.size === a.length &&
    new Set(b).size === b.length &&
    b.every((entry) => seen.has(entry))
  );
}

/** Full screen draws these answers as they arrive; the rest wait for the host. */
export function showsLiveResults(
  question: Pick<LiveQuestionDraft, "kind" | "settings">,
): boolean {
  return (
    question.kind !== "qa" &&
    canShareResults(question.kind) &&
    !hasSecretAnswer(question)
  );
}

export function layoutOf({
  kind,
  settings,
}: LiveQuestionDraft): LiveLayout | null {
  const layouts = LIVE_LAYOUTS[kind];
  if (!layouts) return null;
  return settings.layout && layouts.includes(settings.layout)
    ? settings.layout
    : layouts[0];
}

export function readLayout(kind: LiveQuestionKind, input: unknown): LiveLayout {
  const layout = LIVE_LAYOUTS[kind]?.find((name) => name === input);
  if (!layout) throw new LiveInputError("Choose how to show the results.");
  return layout;
}

export function publicQuestion(
  question: LiveQuestion,
  canSeeAnswer: boolean,
): LiveQuestion {
  if (canSeeAnswer) return question;
  const settings = { ...question.settings };
  delete settings.answer;
  delete settings.area;
  return { ...question, correctOption: null, settings };
}

function readOptions(kind: LiveQuestionKind, input: unknown): string[] {
  const rule = LIVE_OPTION_RULES[kind];
  if (!rule) return [];
  const raw = Array.isArray(input) ? input : [];
  if (raw.length < rule.min || raw.length > rule.max) {
    throw new LiveInputError(
      `Add ${rule.min}–${rule.max} ${rule.plural.toLowerCase()}.`,
    );
  }
  const options = raw.map((option) =>
    readTrimmed(
      option,
      `Each ${rule.noun.toLowerCase()}`,
      1,
      OPTION_MAX_LENGTH,
    ),
  );
  if (
    new Set(options.map((option) => option.toLowerCase())).size !==
    options.length
  ) {
    throw new LiveInputError(
      `Each ${rule.noun.toLowerCase()} must be different.`,
    );
  }
  return options;
}

const SETTINGS_MAX_BYTES = 900;
const CHOICES_MIN = 2;
const CHOICES_MAX = 5;
const CHOICE_MAX_LENGTH = 30;
const AREA_MIN = 5;

function readFormField(input: unknown): FormField {
  const record = asRecord(input);
  const type = Object.keys(FORM_FIELD_LABELS).find(
    (name) => name === record.type,
  ) as FormFieldType | undefined;
  if (!type) throw new LiveInputError("Choose a type for each field.");
  const required = record.required === true;
  if (type !== "choice") return { type, required };
  const raw = Array.isArray(record.choices) ? record.choices : [];
  if (raw.length < CHOICES_MIN || raw.length > CHOICES_MAX) {
    throw new LiveInputError(
      `Give a "Pick one" field ${CHOICES_MIN}–${CHOICES_MAX} choices.`,
    );
  }
  const choices = raw.map((choice) =>
    readTrimmed(choice, "Each choice", 1, CHOICE_MAX_LENGTH),
  );
  if (new Set(choices.map((c) => c.toLowerCase())).size !== choices.length) {
    throw new LiveInputError("Each choice must be different.");
  }
  return { type, required, choices };
}

function readArea(input: unknown): LiveArea {
  const record = asRecord(input);
  const message = "Draw the correct area inside the image.";
  const read = (value: unknown, min: number): number => {
    if (typeof value !== "number" || !(value >= min && value <= 100)) {
      throw new LiveInputError(message);
    }
    return roundToTenth(value);
  };
  const area = {
    x: read(record.x, 0),
    y: read(record.y, 0),
    width: read(record.width, AREA_MIN),
    height: read(record.height, AREA_MIN),
  };
  if (area.x + area.width > 100.05 || area.y + area.height > 100.05) {
    throw new LiveInputError(message);
  }
  return area;
}

function readSettings(
  kind: LiveQuestionKind,
  input: unknown,
  optionCount: number,
): LiveSettings {
  const given =
    input !== null && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  if (kind === "form" && given.fields !== undefined) {
    if (!Array.isArray(given.fields) || given.fields.length !== optionCount) {
      throw new LiveInputError("Choose a type for each field.");
    }
    return { fields: given.fields.map(readFormField) };
  }
  if (kind === "pin" && given.area !== undefined && given.area !== null) {
    return { area: readArea(given.area) };
  }
  if (kind === "grid") {
    const record = asRecord(input);
    return {
      xLabel: readTrimmed(
        record.xLabel,
        "The horizontal axis name",
        1,
        AXIS_MAX_LENGTH,
      ),
      yLabel: readTrimmed(
        record.yLabel,
        "The vertical axis name",
        1,
        AXIS_MAX_LENGTH,
      ),
    };
  }
  if (kind === "number") {
    const record = asRecord(input);
    const range = "Use whole numbers, with the lowest below the highest.";
    const min = readInteger(record.min, -NUMBER_LIMIT, NUMBER_LIMIT, range);
    const max = readInteger(record.max, min + 1, NUMBER_LIMIT, range);
    return {
      min,
      max,
      answer: readInteger(
        record.answer,
        min,
        max,
        "The correct number must be inside the range.",
      ),
    };
  }
  if (kind === "qa") {
    return {
      moderated:
        input !== null &&
        typeof input === "object" &&
        (input as LiveSettings).moderated === true,
    };
  }
  return {};
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
  const options = readOptions(kind, record.options);
  const settings = readSettings(kind, record.settings, options.length);
  // The database caps settings at 1 KB.
  const bytes = new TextEncoder().encode(JSON.stringify(settings)).length;
  if (bytes > SETTINGS_MAX_BYTES) {
    throw new LiveInputError("Use fewer or shorter choices in this form.");
  }

  if (kind !== "quiz") {
    return {
      kind,
      prompt,
      options,
      correctOption: null,
      timeLimitSeconds: null,
      settings,
    };
  }

  return {
    kind,
    prompt,
    options,
    correctOption: readInteger(
      record.correctOption,
      0,
      options.length - 1,
      "Mark the correct answer.",
    ),
    timeLimitSeconds:
      record.timeLimitSeconds === undefined || record.timeLimitSeconds === null
        ? QUIZ_LIMIT_DEFAULT
        : readInteger(
            record.timeLimitSeconds,
            QUIZ_LIMIT_MIN,
            QUIZ_LIMIT_MAX,
            `The time limit must be ${QUIZ_LIMIT_MIN}–${QUIZ_LIMIT_MAX} seconds.`,
          ),
    settings,
  };
}

/** The type of every form field; forms made before types are all text. */
export function formFields(question: LiveQuestionDraft): FormField[] {
  return question.options.map(
    (_, index) =>
      question.settings.fields?.[index] ?? { type: "text", required: false },
  );
}

function readFieldValue(label: string, field: FormField, text: string): string {
  if (!text) {
    if (field.required) throw new LiveInputError(`${label} is required.`);
    return "";
  }
  if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    throw new LiveInputError(`Enter a valid email for ${label}.`);
  }
  if (
    field.type === "date" &&
    !(
      /^\d{4}-\d{2}-\d{2}$/.test(text) &&
      // Rejects days that do not exist, such as 30 February.
      new Date(`${text}T00:00:00Z`).toISOString().startsWith(text)
    )
  ) {
    throw new LiveInputError(`Enter a date for ${label}.`);
  }
  if (field.type === "choice" && !field.choices?.includes(text)) {
    throw new LiveInputError(`Choose one of the options for ${label}.`);
  }
  return text;
}

/** A list with exactly one entry per item, or an input error. */
function readList(input: unknown, length: number, message: string): unknown[] {
  if (!Array.isArray(input) || input.length !== length) {
    throw new LiveInputError(message);
  }
  return input;
}

function readPercent(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new LiveInputError("Place your pin on the image.");
  }
  return roundToTenth(value);
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number | null {
  return values.length === 0
    ? null
    : roundToTenth(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      );
}

/** Statements on a scale; a scale without any rates the question itself. */
export function scaleStatements(
  question: LiveQuestionDraft,
): (string | null)[] {
  return question.options.length > 0 ? question.options : [null];
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
        ratings: readList(
          record.ratings,
          scaleStatements(question).length,
          "Rate every statement.",
        ).map((rating) =>
          readInteger(
            rating,
            1,
            SCALE_MAX,
            `Choose a rating from 1 to ${SCALE_MAX}.`,
          ),
        ),
      };
    case "ranking": {
      const message = "Rank every item once.";
      const order = readList(
        record.order,
        question.options.length,
        message,
      ).map((option) =>
        readInteger(option, 0, question.options.length - 1, message),
      );
      if (new Set(order).size !== order.length) {
        throw new LiveInputError(message);
      }
      return { order };
    }
    case "points": {
      const message = `Share exactly ${POINTS_TOTAL} points in whole numbers.`;
      const points = readList(
        record.points,
        question.options.length,
        message,
      ).map((value) => readInteger(value, 0, POINTS_TOTAL, message));
      if (points.reduce((sum, value) => sum + value, 0) !== POINTS_TOTAL) {
        throw new LiveInputError(message);
      }
      return { points };
    }
    case "grid": {
      const message = "Place every item on the grid.";
      return {
        positions: readList(
          record.positions,
          question.options.length,
          message,
        ).map((value) => {
          const point = asRecord(value);
          return {
            x: readInteger(point.x, 0, GRID_MAX, message),
            y: readInteger(point.y, 0, GRID_MAX, message),
          };
        }),
      };
    }
    case "number": {
      const { min = 0, max = 0 } = question.settings;
      return {
        number: readInteger(
          record.number,
          min,
          max,
          `Enter a whole number from ${min} to ${max}.`,
        ),
      };
    }
    case "form": {
      const types = formFields(question);
      const fields = readList(
        record.fields,
        question.options.length,
        "Fill in the form.",
      ).map((value, index) => {
        if (typeof value !== "string") {
          throw new LiveInputError("Fill in the form.");
        }
        return readFieldValue(
          question.options[index],
          types[index],
          readTrimmed(value, "Each answer", 0, FIELD_MAX_LENGTH),
        );
      });
      if (!fields.some(Boolean)) {
        throw new LiveInputError("Fill in at least one field.");
      }
      return { fields };
    }
    case "pin": {
      const point = asRecord(record.pin);
      return { pin: { x: readPercent(point.x), y: readPercent(point.y) } };
    }
    case "qa":
      throw new LiveInputError("Send Q&A questions with the question box.");
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
  session: {
    isAccepting: boolean;
    openedAt: string | null;
    showResults: boolean;
  },
  now: Date,
): boolean {
  if (!session.isAccepting) return false;
  // Showing results reveals the answer key, so answering stops there.
  if (hasSecretAnswer(question) && session.showResults) return false;
  const deadline = quizDeadline(question, session.openedAt);
  return deadline === null || now.getTime() <= Date.parse(deadline);
}

interface LiveRunState {
  /** Voting has been opened since this question was presented. */
  hasOpened: boolean;
  responseCount: number;
}

/**
 * Why voting cannot open, or null. A question with a secret answer runs once per reset: reopening it
 * would restart the clock and let people answer after the key was shown.
 * shortcut: a run with no answers is forgotten once another question is
 * presented; store a revealed_at per question if that matters.
 */
export function liveOpenError(
  question: LiveQuestionDraft,
  { hasOpened, responseCount }: LiveRunState,
): string | null {
  return hasSecretAnswer(question) && (hasOpened || responseCount > 0)
    ? "This question has already run. Reset all results to run it again."
    : null;
}

/** Why results cannot be shown, or null. */
export function liveRevealError(
  question: LiveQuestionDraft,
  { hasOpened, responseCount }: LiveRunState,
): string | null {
  if (question.kind === "qa") {
    return "Everyone sees Q&A questions while this slide is presented.";
  }
  if (!canShareResults(question.kind)) {
    return "Form answers are visible to hosts only.";
  }
  return hasSecretAnswer(question) && !hasOpened && responseCount === 0
    ? "Open voting first. Showing results reveals the correct answer."
    : null;
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
      const answers = values.flatMap((value) =>
        "ratings" in value
          ? [value.ratings]
          : "rating" in value
            ? [[value.rating]]
            : [],
      );
      const rows = scaleStatements(question).map((label, row) => {
        const ratings = answers.flatMap((answer) => answer[row] ?? []);
        const counts = Array.from(
          { length: SCALE_MAX },
          (_, index) => ratings.filter((rating) => rating === index + 1).length,
        );
        return { label, counts, average: average(ratings) };
      });
      return { type: "scale", rows, total };
    }
    case "ranking": {
      const orders = values.flatMap((value) =>
        "order" in value ? [value.order] : [],
      );
      const rows = question.options
        .map((_, option) => ({
          option,
          average:
            average(orders.map((order) => order.indexOf(option) + 1)) ?? 0,
        }))
        .sort((a, b) => a.average - b.average || a.option - b.option);
      return { type: "ranking", rows, total };
    }
    case "points": {
      const shares = values.flatMap((value) =>
        "points" in value ? [value.points] : [],
      );
      const averages = question.options.map(
        (_, option) => average(shares.map((share) => share[option] ?? 0)) ?? 0,
      );
      return { type: "points", averages, total };
    }
    case "grid": {
      const placements = values.flatMap((value) =>
        "positions" in value ? [value.positions] : [],
      );
      const averages = question.options.map((_, option) => {
        const points = placements.flatMap((list) => list[option] ?? []);
        return {
          x: average(points.map((point) => point.x)) ?? 0,
          y: average(points.map((point) => point.y)) ?? 0,
        };
      });
      return { type: "grid", averages, total };
    }
    case "number": {
      const guesses = values.flatMap((value) =>
        "number" in value ? [value.number] : [],
      );
      const { min = 0, max = 0, answer } = question.settings;
      const width = Math.ceil((max - min + 1) / NUMBER_BUCKETS);
      const buckets = [];
      for (let from = min; from <= max; from += width) {
        const to = Math.min(max, from + width - 1);
        buckets.push({
          from,
          to,
          count: guesses.filter((guess) => guess >= from && guess <= to).length,
        });
      }
      return {
        type: "number",
        buckets,
        average: average(guesses),
        exact: guesses.filter((guess) => guess === answer).length,
        total,
      };
    }
    case "form": {
      const rows = values
        .flatMap((value) => ("fields" in value ? [value.fields] : []))
        .reverse()
        .slice(0, FORM_ROW_LIMIT);
      return { type: "form", rows, total };
    }
    case "pin": {
      const all = values.flatMap((value) =>
        "pin" in value ? [value.pin] : [],
      );
      const { area } = question.settings;
      return {
        type: "pin",
        pins: all.slice(-PIN_LIMIT),
        inArea: area
          ? all.filter(
              ({ x, y }) =>
                x >= area.x &&
                x <= area.x + area.width &&
                y >= area.y &&
                y <= area.y + area.height,
            ).length
          : null,
        total,
      };
    }
    case "qa":
      // Q&A has its own list; see listQaItems.
      return { type: "texts", texts: [], total };
  }
}

interface ScoreRow {
  userId: string;
  name: string;
  points: number;
}

/** Everyone in order of points; equal points share a rank. */
export function rankAll<Row extends ScoreRow>(
  rows: Row[],
): (Row & { rank: number })[] {
  const sorted = [...rows].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );
  let previousPoints: number | null = null;
  let previousRank = 0;
  return sorted.map((row, index) => {
    const rank = row.points === previousPoints ? previousRank : index + 1;
    previousPoints = row.points;
    previousRank = rank;
    return { ...row, rank };
  });
}

export function rankLeaderboard(
  rows: ScoreRow[],
  currentUserId: string,
): Leaderboard {
  const ranked = rankAll(rows).map(({ name, points, rank, userId }) => ({
    rank,
    name,
    points,
    isMe: userId === currentUserId,
  }));
  return {
    top: ranked.slice(0, LEADERBOARD_SIZE),
    me: ranked.find((entry) => entry.isMe) ?? null,
  };
}

export function readQaText(input: unknown): string {
  return readTrimmed(input, "Your question", 1, TEXT_MAX_LENGTH);
}

export function isQaStatus(value: unknown): value is QaStatus {
  return QA_STATUSES.includes(value as QaStatus);
}

/** Q&A items this person may see, without authors or voters. */
export function listQaItems(
  rows: QaItemRow[],
  { canHost, userId }: { canHost: boolean; userId: string },
): QaItem[] {
  return rows
    .filter(
      (row) =>
        canHost ||
        row.status === "visible" ||
        row.status === "answered" ||
        (row.status === "pending" && row.userId === userId),
    )
    .sort(
      (a, b) =>
        QA_STATUSES.indexOf(a.status) - QA_STATUSES.indexOf(b.status) ||
        b.voterIds.length - a.voterIds.length ||
        a.createdAt.localeCompare(b.createdAt),
    )
    .map((row) => ({
      id: row.id,
      body: row.body,
      status: row.status,
      votes: row.voterIds.length,
      votedByMe: row.voterIds.includes(userId),
      isMine: row.userId === userId,
    }));
}

/**
 * What a shared screen may show: a host's snapshot without secret answers,
 * results not shown yet, form answers, or questions awaiting approval. The
 * host can hide live results from the screen.
 */
export function projectorView(
  snapshot: LiveSnapshot,
  isHidden = false,
): LiveSnapshot {
  const { current, qa, results, session } = snapshot;
  const canSee =
    current !== null &&
    (showsLiveResults(current)
      ? !isHidden
      : session.showResults && canShareResults(current.kind));
  return {
    ...snapshot,
    current: current && publicQuestion(current, canSee),
    results: canSee ? results : null,
    qa:
      qa?.filter(
        (item) => item.status === "visible" || item.status === "answered",
      ) ?? null,
  };
}

/** The top open question for a shared screen. Expects listQaItems order. */
export function spotlightOf(items: QaItem[]): {
  item: QaItem | null;
  /** Open questions behind the one shown. */
  waiting: number;
  answered: number;
} {
  const open = items.filter((item) => item.status === "visible");
  return {
    item: open[0] ?? null,
    waiting: Math.max(0, open.length - 1),
    answered: items.filter((item) => item.status === "answered").length,
  };
}

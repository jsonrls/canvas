import assert from "node:assert/strict";

import {
  canShareResults,
  formFields,
  hasSecretAnswer,
  isAcceptingResponse,
  layoutOf,
  liveOpenError,
  listQaItems,
  liveRevealError,
  isSameSet,
  moveItem,
  projectorView,
  showsLiveResults,
  publicQuestion,
  readLayout,
  readQaText,
  LiveInputError,
  quizDeadline,
  rankAll,
  rankLeaderboard,
  readQuestionDraft,
  readResponseValue,
  scoreQuizResponse,
  spotlightOf,
  summarizeResults,
  type LiveQuestionDraft,
  type LiveSnapshot,
} from "../src/lib/live/activities";
import { buildResultSheets } from "../src/lib/live/export";
import {
  guestCookiePath,
  hashGuestToken,
  LiveGuestLinkError,
  readGuestCode,
  readGuestName,
} from "../src/lib/live/guests";
import {
  fitArea,
  gridPercent,
  gridValue,
  hillPath,
  ordinal,
} from "../src/lib/live/shapes";
import { createGuestCode } from "../src/lib/live/repository";
import { answerColor, packWords } from "../src/lib/live/word-cloud";
import { backoffDelay, IDLE_AFTER_MS, livePollDelay } from "../src/lib/polling";
import { writeXlsx } from "../src/lib/xlsx";

// Polling: fast only for an open question; slow when idle or failing.
{
  const base = { isActive: true, hasQuestion: true, idleMs: 0, failures: 0 };
  assert.equal(livePollDelay(base), 2_000);
  assert.equal(livePollDelay({ ...base, idleMs: IDLE_AFTER_MS }), 2_000);
  assert.equal(livePollDelay({ ...base, hasQuestion: false }), 5_000);
  assert.equal(livePollDelay({ ...base, isActive: false }), 10_000);
  assert.equal(
    livePollDelay({ ...base, isActive: false, idleMs: IDLE_AFTER_MS }),
    60_000,
  );
  assert.equal(livePollDelay({ ...base, failures: 3 }), 16_000);
  assert.equal(backoffDelay(2_000, 50), 60_000);
}

// Drafts: trimming, limits, kind-specific normalisation.
assert.deepEqual(
  readQuestionDraft({
    kind: "poll",
    prompt: "  Which organelle makes ATP?  ",
    options: [" Mitochondria ", "Ribosome"],
  }),
  {
    kind: "poll",
    prompt: "Which organelle makes ATP?",
    options: ["Mitochondria", "Ribosome"],
    correctOption: null,
    timeLimitSeconds: null,
    settings: {},
  },
);
assert.throws(
  () => readQuestionDraft({ kind: "poll", prompt: "Hi", options: ["a", "b"] }),
  LiveInputError,
);
assert.throws(
  () =>
    readQuestionDraft({
      kind: "poll",
      prompt: "Pick one",
      options: ["1", "2", "3", "4", "5", "6", "7"],
    }),
  LiveInputError,
);
assert.throws(
  () =>
    readQuestionDraft({
      kind: "poll",
      prompt: "Pick one",
      options: ["Cell", " cell"],
    }),
  LiveInputError,
);
assert.throws(
  () =>
    readQuestionDraft({ kind: "poll", prompt: "Pick one", options: ["Only"] }),
  LiveInputError,
);
assert.throws(
  () => readQuestionDraft({ kind: "survey", prompt: "Pick one" }),
  LiveInputError,
);
assert.deepEqual(
  readQuestionDraft({
    kind: "word_cloud",
    prompt: "One word for today",
    options: ["x"],
    correctOption: 1,
  }),
  {
    kind: "word_cloud",
    prompt: "One word for today",
    options: [],
    correctOption: null,
    timeLimitSeconds: null,
    settings: {},
  },
);
assert.throws(
  () =>
    readQuestionDraft({ kind: "quiz", prompt: "2 + 2?", options: ["3", "4"] }),
  LiveInputError,
);
const quiz = readQuestionDraft({
  kind: "quiz",
  prompt: "2 + 2?",
  options: ["3", "4"],
  correctOption: 1,
});
assert.equal(quiz.timeLimitSeconds, 30);
assert.throws(
  () =>
    readQuestionDraft({
      kind: "quiz",
      prompt: "2 + 2?",
      options: ["3", "4"],
      correctOption: 2,
    }),
  LiveInputError,
);
assert.throws(
  () =>
    readQuestionDraft({
      kind: "quiz",
      prompt: "2 + 2?",
      options: ["3", "4"],
      correctOption: 1,
      timeLimitSeconds: 4,
    }),
  LiveInputError,
);

// Responses per kind.
const poll: LiveQuestionDraft = readQuestionDraft({
  kind: "poll",
  prompt: "Pick one",
  options: ["A", "B", "C"],
});
assert.deepEqual(readResponseValue(poll, { option: 2 }), { option: 2 });
assert.throws(() => readResponseValue(poll, { option: 3 }), LiveInputError);
assert.throws(() => readResponseValue(poll, { option: 1.5 }), LiveInputError);
const cloud = readQuestionDraft({ kind: "word_cloud", prompt: "One word" });
assert.deepEqual(readResponseValue(cloud, { words: [" Cell", "cell", ""] }), {
  words: ["cell"],
});
assert.throws(
  () => readResponseValue(cloud, { words: ["", " "] }),
  LiveInputError,
);
assert.throws(
  () => readResponseValue(cloud, { words: ["a", "b", "c", "d"] }),
  LiveInputError,
);
assert.throws(
  () => readResponseValue(cloud, { words: ["x".repeat(26)] }),
  LiveInputError,
);
const open = readQuestionDraft({
  kind: "open_ended",
  prompt: "Any questions?",
});
assert.deepEqual(readResponseValue(open, { text: "  Why?  " }), {
  text: "Why?",
});
assert.throws(() => readResponseValue(open, { text: " " }), LiveInputError);
assert.throws(
  () => readResponseValue(open, { text: "x".repeat(281) }),
  LiveInputError,
);
const scale = readQuestionDraft({
  kind: "scale",
  prompt: "How confident are you?",
});
assert.deepEqual(readResponseValue(scale, { ratings: [5] }), { ratings: [5] });
assert.throws(() => readResponseValue(scale, { ratings: [0] }), LiveInputError);
assert.throws(() => readResponseValue(scale, { ratings: [6] }), LiveInputError);

// Quiz scoring and deadlines.
const openedAt = "2026-11-24T10:00:00.000Z";
assert.equal(
  scoreQuizResponse(quiz, { option: 1 }, openedAt, new Date(openedAt)),
  1000,
);
assert.equal(
  scoreQuizResponse(
    quiz,
    { option: 1 },
    openedAt,
    new Date("2026-11-24T10:00:30.000Z"),
  ),
  500,
);
assert.equal(
  scoreQuizResponse(
    quiz,
    { option: 1 },
    openedAt,
    new Date("2026-11-24T10:00:15.000Z"),
  ),
  750,
);
assert.equal(
  scoreQuizResponse(quiz, { option: 0 }, openedAt, new Date(openedAt)),
  0,
);
assert.equal(quizDeadline(quiz, openedAt), "2026-11-24T10:00:30.000Z");
assert.equal(quizDeadline(poll, openedAt), null);
assert.equal(quizDeadline(quiz, null), null);
assert.equal(
  isAcceptingResponse(
    quiz,
    { isAccepting: true, openedAt, showResults: false },
    new Date("2026-11-24T10:00:29.000Z"),
  ),
  true,
);
assert.equal(
  isAcceptingResponse(
    quiz,
    { isAccepting: true, openedAt, showResults: false },
    new Date("2026-11-24T10:00:31.000Z"),
  ),
  false,
);
assert.equal(
  isAcceptingResponse(
    poll,
    { isAccepting: true, openedAt, showResults: false },
    new Date("2026-11-25T10:00:00.000Z"),
  ),
  true,
);
assert.equal(
  isAcceptingResponse(
    poll,
    { isAccepting: false, openedAt, showResults: false },
    new Date(openedAt),
  ),
  false,
);

// A quiz never takes answers once its key has been shown.
assert.equal(
  isAcceptingResponse(
    quiz,
    { isAccepting: true, openedAt, showResults: true },
    new Date(openedAt),
  ),
  false,
);
assert.equal(
  isAcceptingResponse(
    poll,
    { isAccepting: true, openedAt, showResults: true },
    new Date(openedAt),
  ),
  true,
);
const fresh = { hasOpened: false, responseCount: 0 };
assert.equal(liveOpenError(quiz, fresh), null);
assert.match(liveOpenError(quiz, { ...fresh, hasOpened: true }) ?? "", /Reset/);
assert.match(
  liveOpenError(quiz, { ...fresh, responseCount: 1 }) ?? "",
  /Reset/,
);
assert.equal(liveOpenError(poll, { hasOpened: true, responseCount: 9 }), null);
assert.match(liveRevealError(quiz, fresh) ?? "", /Open voting/);
assert.equal(liveRevealError(quiz, { ...fresh, hasOpened: true }), null);
assert.equal(liveRevealError(quiz, { ...fresh, responseCount: 1 }), null);
assert.equal(liveRevealError(poll, fresh), null);

// Result summaries.
assert.deepEqual(
  summarizeResults(poll, [{ option: 0 }, { option: 2 }, { option: 2 }]),
  {
    type: "choice",
    counts: [1, 0, 2],
    total: 3,
  },
);
assert.deepEqual(
  summarizeResults(cloud, [
    { words: ["cell", "atp"] },
    { words: ["atp"] },
    { words: ["dna"] },
  ]),
  {
    type: "words",
    words: [
      { text: "atp", count: 2 },
      { text: "cell", count: 1 },
      { text: "dna", count: 1 },
    ],
    total: 3,
  },
);
const manyWords = Array.from({ length: 45 }, (_, index) => ({
  words: [`w${String(index).padStart(2, "0")}`],
}));
assert.equal(
  (summarizeResults(cloud, manyWords) as { words: unknown[] }).words.length,
  40,
);
const manyTexts = Array.from({ length: 55 }, (_, index) => ({
  text: `t${index}`,
}));
const texts = summarizeResults(open, manyTexts) as {
  texts: string[];
  total: number;
};
assert.equal(texts.texts.length, 50);
assert.equal(texts.texts[0], "t54");
assert.equal(texts.total, 55);
assert.deepEqual(
  summarizeResults(scale, [{ rating: 4 }, { ratings: [5] }, { ratings: [5] }]),
  {
    type: "scale",
    rows: [{ label: null, counts: [0, 0, 0, 1, 2], average: 4.7 }],
    total: 3,
  },
);
assert.deepEqual(summarizeResults(scale, []), {
  type: "scale",
  rows: [{ label: null, counts: [0, 0, 0, 0, 0], average: null }],
  total: 0,
});

// Scales with several statements.
const statements = readQuestionDraft({
  kind: "scale",
  prompt: "How sure are you?",
  options: ["Anatomy", "Physiology"],
});
assert.throws(
  () => readResponseValue(statements, { ratings: [3] }),
  LiveInputError,
);
assert.deepEqual(
  summarizeResults(statements, [{ ratings: [1, 5] }, { ratings: [2, 5] }]),
  {
    type: "scale",
    rows: [
      { label: "Anatomy", counts: [1, 1, 0, 0, 0], average: 1.5 },
      { label: "Physiology", counts: [0, 0, 0, 0, 2], average: 5 },
    ],
    total: 2,
  },
);

// Ranking: every option once, best average first.
const ranking = readQuestionDraft({
  kind: "ranking",
  prompt: "Order these topics",
  options: ["A", "B", "C"],
});
assert.deepEqual(readResponseValue(ranking, { order: [2, 0, 1] }), {
  order: [2, 0, 1],
});
for (const order of [[0, 1], [0, 0, 1], [0, 1, 3], [0, 1, 1.5], "012"]) {
  assert.throws(() => readResponseValue(ranking, { order }), LiveInputError);
}
assert.deepEqual(
  summarizeResults(ranking, [{ order: [2, 0, 1] }, { order: [2, 1, 0] }]),
  {
    type: "ranking",
    rows: [
      { option: 2, average: 1 },
      { option: 0, average: 2.5 },
      { option: 1, average: 2.5 },
    ],
    total: 2,
  },
);

// 100 points: whole numbers that add up to exactly 100.
const points = readQuestionDraft({
  kind: "points",
  prompt: "Share the budget",
  options: ["A", "B"],
});
assert.deepEqual(readResponseValue(points, { points: [100, 0] }), {
  points: [100, 0],
});
for (const value of [[50, 49], [101, -1], [50.5, 49.5], [100], null]) {
  assert.throws(
    () => readResponseValue(points, { points: value }),
    LiveInputError,
  );
}
assert.deepEqual(
  summarizeResults(points, [{ points: [100, 0] }, { points: [25, 75] }]),
  { type: "points", averages: [62.5, 37.5], total: 2 },
);

// 2x2 grid.
const gridInput = {
  kind: "grid",
  prompt: "Place each task",
  options: ["Read", "Drill"],
  settings: { xLabel: " Effort ", yLabel: "Impact" },
};
const grid = readQuestionDraft(gridInput);
assert.deepEqual(grid.settings, { xLabel: "Effort", yLabel: "Impact" });
assert.throws(
  () =>
    readQuestionDraft({ ...gridInput, settings: { xLabel: "", yLabel: "y" } }),
  LiveInputError,
);
const positions = [
  { x: 0, y: 10 },
  { x: 5, y: 5 },
];
assert.deepEqual(readResponseValue(grid, { positions }), { positions });
for (const bad of [
  [{ x: 0, y: 10 }],
  [positions[0], { x: 11, y: 0 }],
  [positions[0], { x: 1 }],
]) {
  assert.throws(
    () => readResponseValue(grid, { positions: bad }),
    LiveInputError,
  );
}
assert.deepEqual(
  summarizeResults(grid, [
    { positions },
    {
      positions: [
        { x: 5, y: 5 },
        { x: 6, y: 5 },
      ],
    },
  ]),
  {
    type: "grid",
    averages: [
      { x: 2.5, y: 7.5 },
      { x: 5.5, y: 5 },
    ],
    total: 2,
  },
);

// Guess the number: the answer is a secret, like a quiz key.
const numberInput = {
  kind: "number",
  prompt: "How many bones?",
  settings: { min: 1, max: 300, answer: 206 },
};
const guess = readQuestionDraft(numberInput);
for (const settings of [
  { min: 5, max: 5, answer: 5 },
  { min: 1, max: 10, answer: 11 },
  { min: 1, max: 10 },
  { min: 1.5, max: 10, answer: 2 },
  { min: -2_000_000, max: 10, answer: 2 },
]) {
  assert.throws(
    () => readQuestionDraft({ ...numberInput, settings }),
    LiveInputError,
  );
}
assert.deepEqual(readResponseValue(guess, { number: 206 }), { number: 206 });
for (const value of [0, 301, 1.5, "206"]) {
  assert.throws(
    () => readResponseValue(guess, { number: value }),
    LiveInputError,
  );
}
const hidden = publicQuestion({ ...guess, id: "n", position: 0 }, false);
assert.deepEqual(hidden.settings, { min: 1, max: 300 });
assert.equal(
  publicQuestion({ ...guess, id: "n", position: 0 }, true).settings.answer,
  206,
);
assert.equal(
  publicQuestion({ ...quiz, id: "q", position: 0 }, false).correctOption,
  null,
);
const guessResults = summarizeResults(guess, [
  { number: 206 },
  { number: 1 },
  { number: 300 },
]);
assert.equal(guessResults.type, "number");
if (guessResults.type === "number") {
  assert.equal(guessResults.exact, 1);
  assert.equal(guessResults.average, 169);
  assert.equal(guessResults.buckets.length, 10);
  assert.deepEqual(guessResults.buckets[0], { from: 1, to: 30, count: 1 });
  assert.deepEqual(guessResults.buckets[9], { from: 271, to: 300, count: 1 });
}
const small = readQuestionDraft({
  ...numberInput,
  settings: { min: 1, max: 3, answer: 2 },
});
const smallResults = summarizeResults(small, []);
assert.ok(
  smallResults.type === "number" &&
    smallResults.buckets.length === 3 &&
    smallResults.average === null,
);
assert.equal(
  isAcceptingResponse(
    guess,
    { isAccepting: true, openedAt, showResults: true },
    new Date(openedAt),
  ),
  false,
);
assert.match(
  liveOpenError(guess, { ...fresh, hasOpened: true }) ?? "",
  /Reset/,
);
assert.match(liveRevealError(guess, fresh) ?? "", /Open voting/);

// Quick form: answers stay with hosts.
const form = readQuestionDraft({
  kind: "form",
  prompt: "Sign up",
  options: ["Name", "Email"],
});
assert.deepEqual(readResponseValue(form, { fields: [" Ana ", ""] }), {
  fields: ["Ana", ""],
});
for (const fields of [["", " "], ["Ana"], ["Ana", "x".repeat(201)], [1, 2]]) {
  assert.throws(() => readResponseValue(form, { fields }), LiveInputError);
}
assert.equal(canShareResults("form"), false);
assert.equal(canShareResults("ranking"), true);
assert.match(
  liveRevealError(form, { hasOpened: true, responseCount: 3 }) ?? "",
  /hosts/,
);
assert.deepEqual(
  summarizeResults(form, [{ fields: ["a", "b"] }, { fields: ["c", "d"] }]),
  {
    type: "form",
    rows: [
      ["c", "d"],
      ["a", "b"],
    ],
    total: 2,
  },
);

// Pin on image.
const pin = readQuestionDraft({ kind: "pin", prompt: "Where is the aorta?" });
assert.deepEqual(readResponseValue(pin, { pin: { x: 12.345, y: 100 } }), {
  pin: { x: 12.3, y: 100 },
});
for (const value of [
  { x: -1, y: 0 },
  { x: 0 },
  { x: 0, y: Number.NaN },
  null,
]) {
  assert.throws(() => readResponseValue(pin, { pin: value }), LiveInputError);
}

// Live Q&A: anonymous, moderated, sorted by votes.
const qa = readQuestionDraft({
  kind: "qa",
  prompt: "Ask anything",
  settings: { moderated: true, answer: 1 },
});
assert.deepEqual(qa.settings, { moderated: true });
assert.throws(() => readResponseValue(qa, { text: "Hi" }), LiveInputError);
assert.equal(readQaText(" Why? "), "Why?");
assert.throws(() => readQaText(" "), LiveInputError);
assert.throws(() => readQaText("x".repeat(281)), LiveInputError);
const qaRow = (
  id: string,
  status: "pending" | "visible" | "answered" | "hidden",
  voterIds: string[],
  userId = "other",
) => ({ id, body: id, status, userId, voterIds, createdAt: `2026-01-0${id}` });
const qaRows = [
  qaRow("1", "visible", []),
  qaRow("2", "visible", ["me", "x"]),
  qaRow("3", "pending", [], "me"),
  qaRow("4", "pending", []),
  qaRow("5", "hidden", [], "me"),
  qaRow("6", "answered", ["a", "b", "c"]),
];
const mine = listQaItems(qaRows, { canHost: false, userId: "me" });
assert.deepEqual(
  mine.map((item) => item.id),
  ["2", "1", "3", "6"],
);
assert.deepEqual(mine[0], {
  id: "2",
  body: "2",
  status: "visible",
  votes: 2,
  votedByMe: true,
  isMine: false,
});
assert.deepEqual(
  listQaItems(qaRows, { canHost: true, userId: "host" }).map((i) => i.id),
  ["2", "1", "3", "4", "6", "5"],
);

// Leaderboard: shared ranks for ties, top 10, and the viewer's own rank.
const rows = Array.from({ length: 12 }, (_, index) => ({
  userId: `u${index}`,
  name: `Student ${index}`,
  points: 1200 - index * 100,
}));
rows.push({ userId: "tie", name: "Tie", points: 1100 });
const board = rankLeaderboard(rows, "u11");
assert.equal(board.top.length, 10);
assert.deepEqual(board.top[0], {
  rank: 1,
  name: "Student 0",
  points: 1200,
  isMe: false,
});
assert.equal(board.top[1].rank, 2);
assert.equal(board.top[2].rank, 2);
assert.equal(board.top[3].rank, 4);
assert.deepEqual(board.me, {
  rank: 13,
  name: "Student 11",
  points: 100,
  isMe: true,
});
assert.equal(rankLeaderboard(rows, "nobody").me, null);

// Excel export: one sheet per question, no names beside answers.
const exported = buildResultSheets({
  questions: [
    { ...quiz, id: "q1", position: 0 },
    { ...form, id: "q2", position: 1 },
    { ...qa, id: "q3", position: 2 },
    { ...open, id: "q4", position: 3 },
  ],
  responses: new Map([
    ["q1", [{ option: 1 }, { option: 0 }, { option: 1 }]],
    ["q2", [{ fields: ["Zed", "z@example.com"] }, { fields: ["Ana", ""] }]],
    ["q4", [{ text: "zebra" }, { text: "=1+1" }]],
  ]),
  qa: new Map([["q3", listQaItems(qaRows, { canHost: true, userId: "h" })]]),
  leaderboard: rankAll([
    { userId: "a", name: "Ana", points: 900 },
    { userId: "b", name: "Ben", points: 900 },
  ]),
});
assert.deepEqual(
  exported.map((sheet) => sheet.name),
  [
    "Summary",
    "Leaderboard",
    "1. Quiz",
    "2. Quick form",
    "3. Live Q&A",
    "4. Open ended",
  ],
);
const cells = (index: number) => exported[index].rows.map((row) => row.cells);
assert.deepEqual(cells(0).slice(-4), [
  [1, "Quiz", "2 + 2?", 3],
  [2, "Quick form", "Sign up", 2],
  [3, "Live Q&A", "Ask anything", 6],
  [4, "Open ended", "Any questions?", 2],
]);
assert.deepEqual(cells(1).slice(-2), [
  [1, "Ana", 900],
  [1, "Ben", 900],
]);
assert.ok(cells(2).some((row) => row.join("|") === "4|2|Correct"));
assert.ok(cells(2).some((row) => row.join("|") === "3|1|"));
assert.deepEqual(cells(3).slice(-2), [
  ["Ana", ""],
  ["Zed", "z@example.com"],
]);
assert.deepEqual(cells(5).slice(-2), [["=1+1"], ["zebra"]]);
assert.ok(!JSON.stringify(exported.slice(2)).includes("userId"));
assert.equal(
  buildResultSheets({
    questions: [{ ...poll, id: "p", position: 0 }],
    responses: new Map(),
    qa: new Map(),
    leaderboard: [],
  }).length,
  2,
);

const workbook = writeXlsx([
  {
    name: "A & B",
    rows: [
      { cells: ["<Head>", null], isHeading: true },
      { cells: ["=1+1", 2.5, "bad\u0001\ud800char"] },
    ],
  },
]);
assert.deepEqual([...workbook.subarray(0, 4)], [0x50, 0x4b, 3, 4]);
const raw = workbook.toString("utf8");
assert.match(raw, /<sheet name="A &amp; B"/);
assert.match(raw, /&lt;Head&gt;/);
// Text starting with "=" stays text, so it can never run as a formula.
assert.match(raw, /t="inlineStr"><is><t xml:space="preserve">=1\+1</);
assert.doesNotMatch(raw, /<f>/);
assert.match(raw, /<v>2\.5<\/v>/);
assert.match(raw, />badchar</);

// Word cloud packing.
const measure = (text: string, size: number): number =>
  text.length * size * 0.6;
const cloudWords = Array.from({ length: 40 }, (_, index) => ({
  text: `word${index}`,
  count: 40 - index,
}));
for (const width of [288, 640, 1200]) {
  const packed = packWords(cloudWords, width, measure);
  assert.equal(packed.words.length, 40);
  assert.deepEqual(packed, packWords(cloudWords, width, measure));
  packed.words.forEach((word, index) => {
    assert.ok(word.size >= 20);
    assert.ok(word.x - word.width / 2 >= -0.01);
    assert.ok(word.x + word.width / 2 <= width + 0.01);
    assert.ok(word.y - word.height / 2 >= -0.01);
    assert.ok(word.y + word.height / 2 <= packed.height + 0.01);
    for (const other of packed.words.slice(0, index)) {
      assert.ok(other.size >= word.size);
      assert.ok(
        Math.abs(other.x - word.x) * 2 >= other.width + word.width - 0.01 ||
          Math.abs(other.y - word.y) * 2 >= other.height + word.height - 0.01,
        `${other.text} overlaps ${word.text} at ${width}`,
      );
    }
  });
  assert.ok(Math.abs(packed.words[0].x - width / 2) < 1);
}
const longWord = packWords([{ text: "x".repeat(25), count: 3 }], 288, measure)
  .words[0];
assert.ok(longWord.width <= 288);
assert.deepEqual(packWords([], 640, measure), { words: [], height: 0 });
assert.equal(answerColor("cell"), answerColor("cell"));
assert.ok(answerColor("cell") >= 0 && answerColor("cell") < 6);

// Reordering moves one entry and loses none.
assert.deepEqual(moveItem(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
assert.deepEqual(moveItem(["a", "b", "c", "d"], 3, 0), ["d", "a", "b", "c"]);
assert.deepEqual(moveItem(["a", "b"], 1, 1), ["a", "b"]);
assert.equal(isSameSet(["a", "b"], ["b", "a"]), true);
assert.equal(isSameSet(["a", "b"], ["a", "a"]), false);
assert.equal(isSameSet(["a", "b"], ["a"]), false);
assert.equal(isSameSet(["a", "b"], ["a", "c"]), false);
assert.equal(isSameSet([], []), true);

// Layouts: a known one, or the first for that type.
assert.equal(layoutOf(poll), "columns");
assert.equal(layoutOf({ ...poll, settings: { layout: "donut" } }), "donut");
assert.equal(layoutOf({ ...poll, settings: { layout: "grid" } }), "columns");
assert.equal(layoutOf(open), "bubbles");
assert.equal(layoutOf(scale), null);
assert.equal(readLayout("open_ended", "grid"), "grid");
assert.throws(() => readLayout("open_ended", "donut"), LiveInputError);
assert.throws(() => readLayout("scale", "bubbles"), LiveInputError);

// The full-screen view is what a projector shows, so it hides host-only facts.
const hostSnapshot: LiveSnapshot = {
  canHost: true,
  questions: [{ ...quiz, id: "q", position: 0 }],
  session: {
    questionId: "q",
    isAccepting: true,
    showResults: false,
    hasOpened: true,
    closesAt: null,
  },
  current: { ...quiz, id: "q", position: 0 },
  myResponse: null,
  myPoints: null,
  responseCount: 2,
  results: { type: "choice", counts: [1, 1], total: 2 },
  leaderboard: null,
  qa: null,
  guestCode: null,
};
const projected = projectorView(hostSnapshot);
assert.equal(projected.current?.correctOption, null);
assert.equal(projected.results, null);
const shown = projectorView({
  ...hostSnapshot,
  session: { ...hostSnapshot.session, showResults: true },
});
assert.equal(shown.current?.correctOption, 1);
assert.equal(shown.results?.total, 2);
assert.equal(
  projectorView({
    ...hostSnapshot,
    session: { ...hostSnapshot.session, showResults: true },
    current: { ...form, id: "f", position: 0 },
    results: { type: "form", rows: [["Ana"]], total: 1 },
  }).results,
  null,
);
assert.equal(
  projectorView({
    ...hostSnapshot,
    current: { ...guess, id: "n", position: 0 },
  }).current?.settings.answer,
  undefined,
);
// Answers without a secret appear live, before results are shown to students.
for (const question of [poll, open, scale, pin]) {
  assert.equal(showsLiveResults(question), true);
}
const secretPin = {
  ...pin,
  settings: { area: { x: 10, y: 20, width: 30, height: 40 } },
};
for (const question of [quiz, guess, secretPin, form, qa]) {
  assert.equal(showsLiveResults(question), false);
}
const livePoll: LiveSnapshot = {
  ...hostSnapshot,
  current: { ...poll, id: "p", position: 0 },
};
assert.equal(projectorView(livePoll).results?.total, 2);
assert.equal(projectorView(livePoll, true).results, null);
// Hiding the screen wins even while students can see the results.
assert.equal(
  projectorView(
    { ...livePoll, session: { ...livePoll.session, showResults: true } },
    true,
  ).results,
  null,
);
assert.deepEqual(
  projectorView({
    ...hostSnapshot,
    current: { ...qa, id: "a", position: 0 },
    qa: listQaItems(qaRows, { canHost: true, userId: "h" }),
  }).qa?.map((item) => item.status),
  ["visible", "visible", "answered"],
);

// Distribution hills: flat at the base, and never above the tallest value.
assert.equal(
  hillPath([0, 2, 0]),
  "M0 100L0 100C25 100 25 0 50 0C75 0 75 100 100 100L100 100Z",
);
assert.equal(hillPath([0, 0]), "M0 100L0 100C50 100 50 100 100 100L100 100Z");
assert.equal(hillPath([3]), "M0 100L0 0L100 0L100 100Z");

assert.equal(
  hillPath([0, 1], [10, 90]),
  "M10 100L10 100C50 100 50 0 90 0L90 100Z",
);

// Placing on the 2x2 grid snaps to whole steps and stays inside.
for (let value = 0; value <= 10; value += 1) {
  assert.equal(gridValue(gridPercent(value)), value);
}
assert.equal(gridValue(-20), 0);
assert.equal(gridValue(140), 10);
assert.deepEqual([1, 2, 3, 4, 5, 6].map(ordinal), [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
]);

// Quick form field types.
const typedForm = readQuestionDraft({
  kind: "form",
  prompt: "Sign up",
  options: ["Name", "Email", "Exam date", "Year"],
  settings: {
    fields: [
      { type: "text", required: true },
      { type: "email", required: false },
      { type: "date", required: false },
      { type: "choice", required: true, choices: [" 1st ", "2nd"] },
    ],
  },
});
assert.deepEqual(typedForm.settings.fields?.[3], {
  type: "choice",
  required: true,
  choices: ["1st", "2nd"],
});
const fill = (fields: string[]) => readResponseValue(typedForm, { fields });
assert.deepEqual(fill(["Ana", "a@example.com", "2026-12-01", "2nd"]), {
  fields: ["Ana", "a@example.com", "2026-12-01", "2nd"],
});
assert.deepEqual(fill(["Ana", "", "", "1st"]), {
  fields: ["Ana", "", "", "1st"],
});
assert.throws(() => fill(["", "", "", "1st"]), /Name is required/);
assert.throws(() => fill(["Ana", "", "", ""]), /Year is required/);
assert.throws(() => fill(["Ana", "not-an-email", "", "1st"]), /valid email/);
assert.throws(() => fill(["Ana", "", "2026-02-30", "1st"]), /date/);
assert.throws(() => fill(["Ana", "", "tomorrow", "1st"]), /date/);
assert.throws(() => fill(["Ana", "", "", "3rd"]), /Choose one/);
const formDraft = (fields: unknown) =>
  readQuestionDraft({
    kind: "form",
    prompt: "Sign up",
    options: ["Name"],
    settings: { fields },
  });
for (const fields of [
  [],
  [{ type: "phone", required: false }],
  [{ type: "choice", required: false, choices: ["only"] }],
  [{ type: "choice", required: false, choices: ["a", "A"] }],
  [{ type: "choice", required: false, choices: ["a", "x".repeat(31)] }],
]) {
  assert.throws(() => formDraft(fields), LiveInputError);
}
assert.deepEqual(formFields(form), [
  { type: "text", required: false },
  { type: "text", required: false },
]);

// Pin on image: an optional correct area, secret until results are shown.
const pinDraft = (area: unknown) =>
  readQuestionDraft({
    kind: "pin",
    prompt: "Where is the aorta?",
    settings: { area },
  });
const areaPin = pinDraft({ x: 10.04, y: 20, width: 30, height: 40 });
assert.deepEqual(areaPin.settings.area, {
  x: 10,
  y: 20,
  width: 30,
  height: 40,
});
for (const area of [
  { x: 80, y: 0, width: 30, height: 10 },
  { x: 0, y: 0, width: 2, height: 10 },
  { x: -1, y: 0, width: 10, height: 10 },
  { x: 0, y: 0, width: 10 },
]) {
  assert.throws(() => pinDraft(area), LiveInputError);
}
assert.deepEqual(pin.settings, {});
assert.equal(
  publicQuestion({ ...areaPin, id: "i", position: 0 }, false).settings.area,
  undefined,
);
assert.equal(hasSecretAnswer(areaPin), true);
assert.equal(hasSecretAnswer(pin), false);
assert.equal(hasSecretAnswer(quiz), true);
const revealed = { isAccepting: true, openedAt, showResults: true };
assert.equal(isAcceptingResponse(areaPin, revealed, new Date(openedAt)), false);
assert.equal(isAcceptingResponse(pin, revealed, new Date(openedAt)), true);
const pinResults = summarizeResults(areaPin, [
  { pin: { x: 10, y: 20 } },
  { pin: { x: 40, y: 60 } },
  { pin: { x: 41, y: 60 } },
]);
assert.ok(pinResults.type === "pin" && pinResults.inArea === 2);
const plainPins = summarizeResults(pin, [{ pin: { x: 1, y: 1 } }]);
assert.ok(plainPins.type === "pin" && plainPins.inArea === null);

// Q&A spotlight: the top open question, and how many are left.
const hostQa = listQaItems(qaRows, { canHost: true, userId: "h" });
const spotlight = spotlightOf(hostQa);
assert.equal(spotlight.item?.id, "2");
assert.equal(spotlight.waiting, 1);
assert.equal(spotlight.answered, 1);
assert.deepEqual(spotlightOf([]), { item: null, waiting: 0, answered: 0 });
assert.deepEqual([11, 12, 13, 21, 22, 23, 101, 111].map(ordinal), [
  "11th",
  "12th",
  "13th",
  "21st",
  "22nd",
  "23rd",
  "101st",
  "111th",
]);

assert.deepEqual(fitArea({ x: 97.6, y: -4, width: 1, height: 240 }), {
  x: 95,
  y: 0,
  width: 5,
  height: 100,
});
assert.doesNotThrow(() =>
  pinDraft(fitArea({ x: 99, y: 99, width: 0, height: 0 })),
);

// Guest links: room slug plus 10 letters or digits, trimmed names, hashed tokens.
const guestCode = "biology-101-a8kd93lmqz";
assert.equal(readGuestCode(guestCode), guestCode);
assert.match(createGuestCode("biology-101"), /^biology-101-[a-z0-9]{10}$/);
assert.notEqual(createGuestCode("x"), createGuestCode("x"));
for (const bad of [
  "",
  "biology-101",
  "biology-101-a8kd93lmq",
  "biology-101-a8kd93lmqz1",
  "biology-101-A8KD93LMQZ",
  "Biology-101-a8kd93lmqz",
  "../x-a8kd93lmqz",
  42,
]) {
  assert.throws(() => readGuestCode(bad), LiveGuestLinkError);
}
assert.equal(guestCookiePath(guestCode), `/live/${guestCode}`);
assert.equal(readGuestName("  Ana   Reyes "), "Ana Reyes");
assert.throws(() => readGuestName("   "), LiveInputError);
assert.throws(() => readGuestName("x".repeat(41)), LiveInputError);
assert.throws(() => readGuestName(undefined), LiveInputError);
const tokenHash = hashGuestToken("token-a");
assert.match(tokenHash, /^[0-9a-f]{64}$/);
assert.equal(hashGuestToken("token-a"), tokenHash);
assert.notEqual(hashGuestToken("token-b"), tokenHash);

console.log("Live activity checks passed.");

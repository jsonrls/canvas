import assert from "node:assert/strict";

import {
  isAcceptingResponse,
  LiveInputError,
  quizDeadline,
  rankLeaderboard,
  readQuestionDraft,
  readResponseValue,
  scoreQuizResponse,
  summarizeResults,
  type LiveQuestionDraft,
} from "../src/lib/live/activities";

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
assert.deepEqual(readResponseValue(scale, { rating: 5 }), { rating: 5 });
assert.throws(() => readResponseValue(scale, { rating: 0 }), LiveInputError);
assert.throws(() => readResponseValue(scale, { rating: 6 }), LiveInputError);

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
    { isAccepting: true, openedAt },
    new Date("2026-11-24T10:00:29.000Z"),
  ),
  true,
);
assert.equal(
  isAcceptingResponse(
    quiz,
    { isAccepting: true, openedAt },
    new Date("2026-11-24T10:00:31.000Z"),
  ),
  false,
);
assert.equal(
  isAcceptingResponse(
    poll,
    { isAccepting: true, openedAt },
    new Date("2026-11-25T10:00:00.000Z"),
  ),
  true,
);
assert.equal(
  isAcceptingResponse(
    poll,
    { isAccepting: false, openedAt },
    new Date(openedAt),
  ),
  false,
);

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
  summarizeResults(scale, [{ rating: 4 }, { rating: 5 }, { rating: 5 }]),
  {
    type: "scale",
    counts: [0, 0, 0, 1, 2],
    average: 4.7,
    total: 3,
  },
);
assert.deepEqual(summarizeResults(scale, []), {
  type: "scale",
  counts: [0, 0, 0, 0, 0],
  average: null,
  total: 0,
});

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

console.log("Live activity checks passed.");

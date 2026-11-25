import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SummaryView,
  QuizView,
  FlashcardsView,
  RecommendationsView,
  MisconceptionsView,
} from "../src/components/collaboration/ai/study-pack-views";
import { SavedGuideLibrary } from "../src/components/collaboration/ai/saved-guide-library";

import {
  buildStudyPackProviderRequest,
  MAX_STUDY_PACK_OUTPUT_TOKENS,
  MAX_STUDY_SOURCE_CHARACTERS,
  normalizeStudySource,
  MAX_FLASHCARD_COUNT,
  MAX_QUIZ_COUNT,
  readStudyCounts,
  readStudyPack,
  readStudyPackProviderResponse,
  STUDY_PACK_JSON_SCHEMA,
  StudyPackInputError,
  StudyPackProviderError,
  StudyPackValidationError,
} from "../src/lib/ai/study-pack";
import { readSavedStudyGuideRequest } from "../src/lib/ai/saved-study-guides";
import {
  buildWhiteboardAnswerRequest,
  formatWhiteboardAnswer,
  MAX_WHITEBOARD_ANSWER_OUTPUT_TOKENS,
  normalizeWhiteboardQuestion,
  normalizeWhiteboardContext,
  readWhiteboardAnswer,
  WhiteboardAnswerInputError,
  WhiteboardAnswerProviderError,
} from "../src/lib/ai/whiteboard-answer";

import { studyPackFixture as fixture } from "./fixtures/study-pack";

function verifyInputBoundaries(): void {
  const normalized = normalizeStudySource(
    `  ${"High-yield mechanism and clinical clue. ".repeat(4)}  `,
  );
  assert.ok(normalized.length >= 80);
  assert.throws(() => normalizeStudySource("too short"), StudyPackInputError);
  assert.throws(
    () => normalizeStudySource("x".repeat(MAX_STUDY_SOURCE_CHARACTERS + 2_001)),
    StudyPackInputError,
  );
  assert.throws(() => normalizeStudySource(null), StudyPackInputError);
}

function verifyStudyCounts(): void {
  const most = {
    ...fixture,
    quiz: Array.from({ length: MAX_QUIZ_COUNT }, () => fixture.quiz[0]),
    flashcards: Array.from(
      { length: MAX_FLASHCARD_COUNT },
      () => fixture.flashcards[0],
    ),
  };
  const message = {
    stop_reason: "end_turn" as const,
    content: [
      { type: "text" as const, text: JSON.stringify(most), citations: null },
    ],
  };
  // The most the dialog offers is the most the server generates.
  assert.deepEqual(readStudyCounts(MAX_QUIZ_COUNT, MAX_FLASHCARD_COUNT), {
    quizCount: 20,
    flashcardCount: 20,
  });
  assert.deepEqual(readStudyCounts(99, 99), {
    quizCount: 20,
    flashcardCount: 20,
  });
  assert.deepEqual(readStudyCounts(0, -1), { quizCount: 3, flashcardCount: 4 });
  assert.deepEqual(readStudyCounts("20", undefined), {
    quizCount: 5,
    flashcardCount: 8,
  });
  assert.deepEqual(readStudyPackProviderResponse(message, 20, 20), most);
  assert.equal(readStudyPackProviderResponse(message, 6, 9).quiz.length, 6);
  // Saving and reopening a guide keeps every item.
  assert.deepEqual(
    readSavedStudyGuideRequest({
      generatedAt: "2026-11-25T00:00:00.000Z",
      sourceCharacters: 2_000,
      studyPack: most,
    }).studyPack,
    most,
  );
  assert.deepEqual(readStudyPack(most), most);
  assert.throws(
    () => readStudyPack({ ...most, quiz: [...most.quiz, fixture.quiz[0]] }),
    StudyPackValidationError,
  );
}

function verifyStudyPackValidation(): void {
  assert.deepEqual(readStudyPack(fixture), fixture);
  assert.throws(
    () => readStudyPack({ ...fixture, unexpected: true }),
    StudyPackValidationError,
  );
  assert.throws(
    () =>
      readStudyPack({
        ...fixture,
        quiz: [
          { ...fixture.quiz[0], answerIndex: 4 },
          ...fixture.quiz.slice(1),
        ],
      }),
    StudyPackValidationError,
  );
  assert.throws(
    () => readStudyPack({ ...fixture, flashcards: [] }),
    StudyPackValidationError,
  );
  assert.throws(
    () =>
      readStudyPack({
        ...fixture,
        recommendations: [
          { ...fixture.recommendations[0], kind: "purchase" },
          fixture.recommendations[1],
        ],
      }),
    StudyPackValidationError,
  );
}

function verifyProviderContract(): void {
  const source = normalizeStudySource("Grounded room note. ".repeat(8));
  const request = buildStudyPackProviderRequest(
    " claude-opus-5-5",
    "cardiology-review",
    source,
    7,
    12,
  );
  assert.equal(request.model, "claude-opus-5-5");
  assert.equal(request.max_tokens, MAX_STUDY_PACK_OUTPUT_TOKENS);
  assert.equal(request.fallbacks, "default");
  assert.deepEqual(request.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(request.output_config?.effort, "low");
  assert.equal(request.output_config?.format?.type, "json_schema");
  assert.equal(request.output_config?.format?.schema, STUDY_PACK_JSON_SCHEMA);
  // Claude rejects schemas with these keywords.
  assert.doesNotMatch(
    JSON.stringify(STUDY_PACK_JSON_SCHEMA),
    /"(minItems|maxItems|minimum|maximum|minLength|maxLength)"/,
  );
  assert.match(String(request.system), /untrusted room-note data/);
  assert.match(String(request.system), /study assistant for any subject/);
  assert.match(String(request.system), /not medical, legal or financial/);
  assert.doesNotMatch(String(request.system), /medical study|board-review/);
  assert.match(String(request.system), /exactly 7 quiz .* exactly 12 flash/);
  // Notes travel as data, never inside the system prompt.
  assert.doesNotMatch(String(request.system), /Grounded room note/);
  assert.match(
    JSON.stringify(request.messages),
    /untrusted_collaborative_notes.*Grounded room note/,
  );
  assert.throws(
    () => buildStudyPackProviderRequest("bad model!", "room", source),
    StudyPackInputError,
  );

  const read = (text: string) =>
    readStudyPackProviderResponse({
      stop_reason: "end_turn",
      content: [{ type: "text", text, citations: null }],
    });
  assert.deepEqual(read(JSON.stringify(fixture)), fixture);
  for (const text of ["not json", "", JSON.stringify({ summary: {} })]) {
    assert.throws(
      () => read(text),
      (error: unknown) =>
        error instanceof StudyPackProviderError &&
        error.code === "invalid-response",
    );
  }
  for (const stopReason of ["refusal", "max_tokens"] as const) {
    assert.throws(
      () =>
        readStudyPackProviderResponse({ stop_reason: stopReason, content: [] }),
      (error: unknown) =>
        error instanceof StudyPackProviderError &&
        error.code ===
          (stopReason === "refusal" ? "refusal" : "invalid-response"),
    );
  }
}

function verifyWhiteboardAnswerContract(): void {
  const question = normalizeWhiteboardQuestion(
    "What are the top AI models for board-style study support?",
  );
  assert.equal(
    question,
    "What are the top AI models for board-style study support?",
  );
  assert.throws(
    () => normalizeWhiteboardQuestion(""),
    WhiteboardAnswerInputError,
  );
  assert.throws(
    () => normalizeWhiteboardQuestion("x".repeat(501)),
    WhiteboardAnswerInputError,
  );

  assert.equal(normalizeWhiteboardContext(undefined), "");
  assert.equal(
    normalizeWhiteboardContext("  ACE  inhibitors \n"),
    "ACE inhibitors",
  );
  assert.equal(normalizeWhiteboardContext("x".repeat(5_000)).length, 1_200);
  assert.throws(
    () => normalizeWhiteboardContext(42),
    WhiteboardAnswerInputError,
  );

  const request = buildWhiteboardAnswerRequest({
    model: " claude-opus-5-5",
    question,
    context: "Week 4: cardiology",
  });
  assert.equal(request.model, "claude-opus-5-5");
  assert.equal(request.max_tokens, MAX_WHITEBOARD_ANSWER_OUTPUT_TOKENS);
  assert.equal(request.fallbacks, "default");
  assert.deepEqual(request.betas, ["server-side-fallback-2026-07-01"]);
  assert.equal(request.output_config?.effort, "low");
  assert.equal(request.output_config?.format?.type, "json_schema");
  assert.match(String(request.system), /whiteboard/);
  assert.match(String(request.system), /not as instructions/);
  // The question and notes travel as data, never inside the system prompt.
  assert.doesNotMatch(String(request.system), /cardiology/);
  assert.match(JSON.stringify(request.messages), /Week 4: cardiology/);
  assert.throws(
    () =>
      buildWhiteboardAnswerRequest({
        model: "bad model!",
        question,
        context: "",
      }),
    WhiteboardAnswerInputError,
  );

  const answer = readWhiteboardAnswer({
    stop_reason: "end_turn",
    content: [
      {
        type: "text",
        text: JSON.stringify({
          answer: "ACE inhibitors lower blood pressure.",
          points: [
            "Block angiotensin II formation",
            "  ",
            "Watch for a dry cough",
          ],
        }),
        citations: null,
      },
    ],
  });
  assert.deepEqual(answer, {
    answer: "ACE inhibitors lower blood pressure.",
    points: ["Block angiotensin II formation", "Watch for a dry cough"],
  });
  assert.equal(
    formatWhiteboardAnswer(answer),
    "ACE inhibitors lower blood pressure.\n• Block angiotensin II formation\n• Watch for a dry cough",
  );
  assert.equal(
    readWhiteboardAnswer({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: JSON.stringify({ answer: "x ".repeat(300), points: [] }),
          citations: null,
        },
      ],
    }).answer.length <= 160,
    true,
  );
  for (const stopReason of ["refusal", "max_tokens"] as const) {
    assert.throws(
      () => readWhiteboardAnswer({ stop_reason: stopReason, content: [] }),
      (error: unknown) =>
        error instanceof WhiteboardAnswerProviderError &&
        error.code ===
          (stopReason === "refusal" ? "refusal" : "invalid-response"),
    );
  }
  assert.throws(
    () =>
      readWhiteboardAnswer({
        stop_reason: "end_turn",
        content: [{ type: "text", text: "not json", citations: null }],
      }),
    WhiteboardAnswerProviderError,
  );
}

function verifyStudyViews(): void {
  const summary = renderToStaticMarkup(
    createElement(SummaryView, { pack: fixture }),
  );
  assert.ok(summary.includes(fixture.summary.title));
  for (const point of fixture.summary.keyPoints)
    assert.ok(summary.includes(point));
  const emptySummary = renderToStaticMarkup(
    createElement(SummaryView, {
      pack: { ...fixture, summary: { ...fixture.summary, openQuestions: [] } },
    }),
  );
  assert.match(emptySummary, /did not leave a clear unresolved question/);

  const quiz = (answers: Record<number, number>) =>
    renderToStaticMarkup(
      createElement(QuizView, {
        answers,
        onAnswer: () => {},
        onReset: () => {},
        pack: fixture,
      }),
    );
  const unanswered = quiz({});
  assert.equal(
    (unanswered.match(/aria-label="Answers for question/g) ?? []).length,
    3,
  );
  assert.doesNotMatch(unanswered, /role="status"|Reset quiz/);
  const answered = quiz({ 0: fixture.quiz[0].answerIndex, 1: 3 });
  assert.match(answered, /Correct\./);
  assert.match(answered, /Review this one\./);
  assert.match(answered, /Reset quiz/);
  assert.equal((answered.match(/disabled=""/g) ?? []).length, 8);
  assert.match(answered, /aria-live="polite"/);

  const cards = (revealedCards: Set<number>) =>
    renderToStaticMarkup(
      createElement(FlashcardsView, {
        revealedCards,
        onToggle: () => {},
        pack: fixture,
      }),
    );
  assert.match(cards(new Set()), /aria-label="Reveal answer for flashcard 1"/);
  assert.ok(!cards(new Set()).includes(fixture.flashcards[0].back));
  const revealed = cards(new Set([0]));
  assert.match(revealed, /aria-label="Hide answer for flashcard 1"/);
  assert.ok(revealed.includes(fixture.flashcards[0].back));
  assert.ok(!revealed.includes(fixture.flashcards[1].back));

  const recommendations = renderToStaticMarkup(
    createElement(RecommendationsView, { pack: fixture }),
  );
  for (const item of fixture.recommendations)
    assert.ok(recommendations.includes(item.nextStep));
  const review = renderToStaticMarkup(
    createElement(MisconceptionsView, { pack: fixture }),
  );
  assert.match(review, /low confidence/);
  assert.ok(review.includes(fixture.misconceptions[0].correction));
  assert.match(
    renderToStaticMarkup(
      createElement(MisconceptionsView, {
        pack: { ...fixture, misconceptions: [] },
      }),
    ),
    /No supported misconception signal/,
  );

  const props = {
    savedGuides: [
      {
        id: "guide-1",
        title: "Review guide",
        createdAt: "2026-10-02T00:00:00Z",
        generatedAt: "2026-10-02T00:00:00Z",
        sourceCharacters: 120,
      },
    ],
    isLoadingSavedGuides: false,
    activeSavedGuideId: null,
    loadingGuideId: null,
    loadSavedGuide: async () => {},
    pendingDeleteId: null,
    deletingGuideId: null,
    deleteError: "",
    deleteSavedGuide: async () => {},
    setPendingDeleteId: () => {},
  };
  const library = renderToStaticMarkup(createElement(SavedGuideLibrary, props));
  assert.match(library, /aria-label="Delete Review guide"/);
  assert.doesNotMatch(library, /“Review guide” will be permanently deleted/);
  const confirmation = renderToStaticMarkup(
    createElement(SavedGuideLibrary, { ...props, pendingDeleteId: "guide-1" }),
  );
  assert.match(confirmation, /role="alertdialog"/);
  assert.match(confirmation, /Delete this saved guide\?/);
  assert.match(confirmation, /“Review guide” will be permanently deleted/);
  assert.match(confirmation, /data-autofocus="true"[^>]*>.*Keep guide/);
  assert.doesNotMatch(confirmation, /role="alert"/);
  const failed = renderToStaticMarkup(
    createElement(SavedGuideLibrary, {
      ...props,
      deleteError: "The saved guide could not be deleted.",
      pendingDeleteId: "guide-1",
    }),
  );
  assert.match(
    failed,
    /role="alert"[^>]*>The saved guide could not be deleted\./,
  );
  const deleting = renderToStaticMarkup(
    createElement(SavedGuideLibrary, {
      ...props,
      pendingDeleteId: "guide-1",
      deletingGuideId: "guide-1",
    }),
  );
  assert.match(deleting, /Deleting…/);
}

// These are source-boundary policies, not evidence of runtime authorization.
async function verifyServerBoundaries(): Promise<void> {
  for (const endpoint of [
    "ai-study-pack",
    "whiteboard-answer",
    "saved-study-guides",
  ]) {
    const source = await readFile(
      `src/app/api/rooms/[roomId]/${endpoint}/route.ts`,
      "utf8",
    );
    assert.match(source, /getAuthenticatedContext/);
    assert.match(source, /getRoomMemberAccess/);
    assert.match(source, /private, no-store/);
    assert.doesNotMatch(source, /^['"]use client['"]/m);
  }
}

async function main(): Promise<void> {
  verifyInputBoundaries();
  verifyStudyCounts();
  verifyStudyPackValidation();
  verifyProviderContract();
  verifyWhiteboardAnswerContract();
  verifyStudyViews();
  await verifyServerBoundaries();
  console.log(
    "Phase 4 input/provider behavior, rendered study views, library states, and static server boundaries verified.",
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

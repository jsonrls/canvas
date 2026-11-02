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
  readStudyPack,
  readStudyPackProviderResponse,
  STUDY_PACK_JSON_SCHEMA,
  StudyPackInputError,
  StudyPackProviderError,
  StudyPackValidationError,
} from "../src/lib/ai/study-pack";
import {
  buildWhiteboardAnswerProviderRequest,
  MAX_WHITEBOARD_ANSWER_OUTPUT_TOKENS,
  normalizeWhiteboardQuestion,
  readWhiteboardAnswerProviderResponse,
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
  const request = buildStudyPackProviderRequest(
    " gpt-4o-mini",
    "cardiology-review",
    normalizeStudySource("Grounded room note. ".repeat(8)),
  );
  assert.equal(request.store, false);
  assert.equal(request.max_output_tokens, MAX_STUDY_PACK_OUTPUT_TOKENS);
  assert.equal(request.model, "gpt-4o-mini");
  assert.match(String(request.instructions), /untrusted room-note data/);
  assert.match(String(request.instructions), /not medical advice/);

  const text = request.text as {
    format?: { schema?: unknown; strict?: unknown; type?: unknown };
  };
  assert.equal(text.format?.type, "json_schema");
  assert.equal(text.format?.strict, true);
  assert.notEqual(text.format?.schema, STUDY_PACK_JSON_SCHEMA);
  const schema = text.format?.schema as {
    properties?: {
      flashcards?: { maxItems?: unknown };
      quiz?: { maxItems?: unknown };
    };
  };
  assert.equal(schema.properties?.quiz?.maxItems, 5);
  assert.equal(schema.properties?.flashcards?.maxItems, 8);

  const input = request.input as Array<{ content?: unknown }>;
  assert.equal(typeof input[0]?.content, "string");
  assert.match(String(input[0]?.content), /untrusted_collaborative_notes/);
  assert.deepEqual(
    readStudyPackProviderResponse({ output_text: JSON.stringify(fixture) }),
    fixture,
  );
  assert.deepEqual(
    readStudyPackProviderResponse({
      output: [
        {
          content: [{ type: "output_text", text: JSON.stringify(fixture) }],
        },
      ],
    }),
    fixture,
  );
  assert.throws(
    () =>
      readStudyPackProviderResponse({
        output: [{ content: [{ type: "refusal", refusal: "declined" }] }],
      }),
    (error: unknown) =>
      error instanceof StudyPackProviderError && error.code === "refusal",
  );
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

  const request = buildWhiteboardAnswerProviderRequest(
    " gpt-4o-mini",
    "cardiology-review",
    question,
  );
  assert.equal(request.store, false);
  assert.equal(request.max_output_tokens, MAX_WHITEBOARD_ANSWER_OUTPUT_TOKENS);
  assert.equal(request.model, "gpt-4o-mini");
  assert.match(String(request.instructions), /whiteboard answer assistant/);
  assert.match(String(request.instructions), /fit inside a whiteboard circle/);

  const text = request.text as {
    format?: { strict?: unknown; type?: unknown };
  };
  assert.equal(text.format?.type, "json_schema");
  assert.equal(text.format?.strict, true);

  assert.equal(
    readWhiteboardAnswerProviderResponse({
      output_text: JSON.stringify({ answer: "1. GPT-5 mini\n2. o3-mini" }),
    }),
    "1. GPT-5 mini\n2. o3-mini",
  );
  assert.throws(
    () =>
      readWhiteboardAnswerProviderResponse({
        output: [{ content: [{ type: "refusal", refusal: "declined" }] }],
      }),
    (error: unknown) =>
      error instanceof WhiteboardAnswerProviderError &&
      error.code === "refusal",
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
    deleteSavedGuide: async () => {},
    setPendingDeleteId: () => {},
  };
  const library = renderToStaticMarkup(createElement(SavedGuideLibrary, props));
  assert.match(library, /aria-label="Delete Review guide"/);
  assert.doesNotMatch(library, /Delete this saved guide\?/);
  const confirmation = renderToStaticMarkup(
    createElement(SavedGuideLibrary, { ...props, pendingDeleteId: "guide-1" }),
  );
  assert.match(confirmation, /aria-label="Confirm deleting Review guide"/);
  assert.match(confirmation, /Delete this saved guide\?/);
  const deleting = renderToStaticMarkup(
    createElement(SavedGuideLibrary, {
      ...props,
      pendingDeleteId: "guide-1",
      deletingGuideId: "guide-1",
    }),
  );
  assert.match(deleting, /Deleting…/);
  assert.equal((deleting.match(/disabled=""/g) ?? []).length, 2);
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

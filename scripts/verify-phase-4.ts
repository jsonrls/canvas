import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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
  type StudyPack,
} from "../src/lib/ai/study-pack";

const fixture: StudyPack = {
  summary: {
    title: "Cardiovascular pharmacology review",
    overview:
      "The note compares receptor effects, hemodynamic responses, and adverse-effect patterns that help distinguish common cardiovascular drug classes.",
    keyPoints: [
      "Beta-one blockade lowers heart rate and contractility.",
      "Afterload reduction can improve forward flow in selected conditions.",
      "Medication effects should be connected to the underlying physiology.",
    ],
    openQuestions: ["Which findings separate toxicity from expected effect?"],
  },
  quiz: Array.from({ length: 3 }, (_, index) => ({
    question: `Which mechanism best explains study finding ${index + 1}?`,
    options: ["Mechanism A", "Mechanism B", "Mechanism C", "Mechanism D"],
    answerIndex: index % 4,
    explanation:
      "The shared notes connect this finding to the selected mechanism.",
  })),
  flashcards: Array.from({ length: 4 }, (_, index) => ({
    front: `Prompt ${index + 1}`,
    back: `Grounded answer ${index + 1} from the notes.`,
  })),
  recommendations: [
    {
      kind: "practice",
      title: "Compare adjacent mechanisms",
      rationale: "The notes list effects but need a direct contrast.",
      nextStep: "Build a two-column mechanism and adverse-effect table.",
    },
    {
      kind: "clarify",
      title: "Resolve the remaining toxicity question",
      rationale: "One open question remains in the discussion summary.",
      nextStep: "Verify the finding against the assigned pharmacology source.",
    },
  ],
  misconceptions: [
    {
      confidence: "low",
      suspectedClaim: "A reduced heart rate always indicates toxicity.",
      correction:
        "A reduced heart rate can be an expected pharmacologic effect; clinical context and severity determine concern.",
      whyItMatters:
        "Confusing expected effect with toxicity can distort board-style reasoning.",
    },
  ],
};

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
    () =>
      readStudyPack({ ...fixture, flashcards: fixture.flashcards.slice(0, 3) }),
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
    "gpt-5-mini",
    "cardiology-review",
    normalizeStudySource("Grounded room note. ".repeat(8)),
  );
  assert.equal(request.store, false);
  assert.equal(request.max_output_tokens, MAX_STUDY_PACK_OUTPUT_TOKENS);
  assert.equal(request.model, "gpt-5-mini");
  assert.match(String(request.instructions), /untrusted room-note data/);
  assert.match(String(request.instructions), /not medical advice/);

  const text = request.text as {
    format?: { schema?: unknown; strict?: unknown; type?: unknown };
  };
  assert.equal(text.format?.type, "json_schema");
  assert.equal(text.format?.strict, true);
  assert.equal(text.format?.schema, STUDY_PACK_JSON_SCHEMA);

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

async function verifyApplicationWiring(): Promise<void> {
  const [
    routeSource,
    savedRouteSource,
    roomSource,
    componentSource,
    repositorySource,
    styles,
    savedMigration,
    env,
  ] = await Promise.all([
    readFile("src/app/api/rooms/[roomId]/ai-study-pack/route.ts", "utf8"),
    readFile("src/app/api/rooms/[roomId]/saved-study-guides/route.ts", "utf8"),
    readFile("src/components/collaboration/collaborative-room.tsx", "utf8"),
    readFile("src/components/collaboration/ai-study-tool.tsx", "utf8"),
    readFile("src/lib/rooms/repository.ts", "utf8"),
    readFile("src/app/globals.css", "utf8"),
    readFile(
      "supabase/migrations/20260718064528_store_saved_ai_study_guides.sql",
      "utf8",
    ),
    readFile(".env.example", "utf8"),
  ]);

  assert.match(routeSource, /getAuthenticatedContext/);
  assert.match(routeSource, /getRoomMemberAccess/);
  assert.match(routeSource, /consumeGenerationAllowance/);
  assert.match(routeSource, /PROVIDER_TIMEOUT_MS/);
  assert.match(routeSource, /private, no-store/);
  assert.match(routeSource, /process\.env\.OPENAI_API_KEY/);
  assert.doesNotMatch(routeSource, /createServiceRoleClient/);
  assert.match(savedRouteSource, /export async function GET/);
  assert.match(savedRouteSource, /export async function POST/);
  assert.match(savedRouteSource, /export async function DELETE/);
  assert.match(savedRouteSource, /getAuthenticatedContext/);
  assert.match(savedRouteSource, /getRoomMemberAccess/);
  assert.match(savedRouteSource, /created_by/);
  assert.match(savedRouteSource, /private, no-store/);
  assert.match(savedRouteSource, /MAX_SAVED_STUDY_GUIDES/);
  assert.match(repositorySource, /export async function getRoomMemberAccess/);

  assert.match(
    roomSource,
    /import\("@\/components\/collaboration\/ai-study-tool"\)/,
  );
  assert.match(roomSource, /editorRef\.current\?\.captureDraft\(\)\?\.text/);
  assert.match(roomSource, /AI study assistant/);
  assert.match(componentSource, /role="tablist"/);
  assert.match(componentSource, /handleTabKeyDown/);
  assert.match(componentSource, /Discussion summary/);
  assert.match(componentSource, /Practice quiz/);
  assert.match(componentSource, /Flashcard deck/);
  assert.match(componentSource, /Content recommendations/);
  assert.match(componentSource, /Misconception review/);
  assert.match(componentSource, /Study aid, not medical advice/);
  assert.match(componentSource, /aria-live="polite"/);
  assert.match(componentSource, /Saved study guides/);
  assert.match(componentSource, /Save guide/);
  assert.match(componentSource, /Delete this saved guide/);
  assert.match(componentSource, /saved-study-guides/);

  assert.match(styles, /grid-template-columns: repeat\(4, 1fr\)/);
  assert.match(styles, /@media \(max-width: 430px\)/);
  assert.match(styles, /min-height: 44px/);
  assert.match(env, /^OPENAI_API_KEY=/m);
  assert.doesNotMatch(componentSource, /OPENAI_API_KEY/);
  assert.match(savedMigration, /create table public\.saved_study_guides/);
  assert.match(savedMigration, /enable row level security/);
  assert.match(savedMigration, /grant select, insert, delete/);
}

async function main(): Promise<void> {
  verifyInputBoundaries();
  verifyStudyPackValidation();
  verifyProviderContract();
  await verifyApplicationWiring();
  console.log("Phase 4 AI assistant contracts verified.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import {
  buildStudyPackProviderRequest,
  DEFAULT_STUDY_PACK_MODEL,
  MAX_STUDY_PACK_REQUEST_BYTES,
  normalizeStudySource,
  readStudyCounts,
  readStudyPackProviderResponse,
  StudyPackInputError,
  StudyPackProviderError,
  type StudyPackResponse,
} from "@/lib/ai/study-pack";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface AiStudyPackRouteProps {
  params: Promise<{ roomId: string }>;
}

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const GENERATION_WINDOW_MS = 10 * 60 * 1_000;
const GENERATION_LIMIT = 5;
const PROVIDER_TIMEOUT_MS = 55_000;
const generationBuckets = new Map<string, number[]>();

// Keep the platform request window slightly above the provider abort so the
// client receives our intentional 504 response instead of a platform reset.
export const maxDuration = 60;

function errorResponse(
  message: string,
  status: number,
  extraHeaders?: Record<string, string>,
): NextResponse {
  return NextResponse.json(
    { error: message },
    { headers: { ...PRIVATE_HEADERS, ...extraHeaders }, status },
  );
}

async function readRequestBody(
  request: Request,
): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_STUDY_PACK_REQUEST_BYTES
  ) {
    throw new StudyPackInputError(
      "The note snapshot is too large. Generate from a shorter focused section.",
    );
  }

  let value: unknown;

  try {
    value = await request.json();
  } catch {
    throw new StudyPackInputError("The study-pack request is invalid.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StudyPackInputError("The study-pack request is invalid.");
  }

  const body = value as Record<string, unknown>;
  const allowedKeys = new Set(["sourceText", "quizCount", "flashcardCount"]);

  if (
    !("sourceText" in body) ||
    Object.keys(body).some((k) => !allowedKeys.has(k))
  ) {
    throw new StudyPackInputError("The study-pack request is invalid.");
  }

  return body;
}

function consumeGenerationAllowance(key: string): number | null {
  const now = Date.now();
  const earliestAllowed = now - GENERATION_WINDOW_MS;
  const recent = (generationBuckets.get(key) ?? []).filter(
    (timestamp) => timestamp > earliestAllowed,
  );

  if (recent.length >= GENERATION_LIMIT) {
    const retryAfterMs = recent[0] + GENERATION_WINDOW_MS - now;
    generationBuckets.set(key, recent);
    return Math.max(1, Math.ceil(retryAfterMs / 1_000));
  }

  recent.push(now);
  generationBuckets.set(key, recent);

  if (generationBuckets.size > 1_000) {
    for (const [bucketKey, timestamps] of generationBuckets) {
      if (timestamps.every((timestamp) => timestamp <= earliestAllowed)) {
        generationBuckets.delete(bucketKey);
      }
    }
  }

  return null;
}

async function callStudyPackProvider(
  request: Request,
  roomSlug: string,
  sourceText: string,
  quizCount: number,
  flashcardCount: number,
): Promise<Anthropic.Beta.Messages.BetaMessage> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("AI_CONFIGURATION_MISSING");
  }

  const client = new Anthropic({ apiKey, maxRetries: 1 });

  return client.beta.messages.create(
    buildStudyPackProviderRequest(
      process.env.ANTHROPIC_STUDY_MODEL ?? DEFAULT_STUDY_PACK_MODEL,
      roomSlug,
      sourceText,
      quizCount,
      flashcardCount,
    ),
    {
      // One deadline for every attempt; also stops if the student leaves.
      signal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      ]),
    },
  );
}

export async function POST(
  request: Request,
  { params }: AiStudyPackRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const { roomId } = await params;
    const [access, body] = await Promise.all([
      getRoomMemberAccess(context.client, roomId, context.userId),
      readRequestBody(request),
    ]);
    const sourceText = normalizeStudySource(body.sourceText);

    const { quizCount, flashcardCount } = readStudyCounts(
      body.quizCount,
      body.flashcardCount,
    );

    const retryAfter = consumeGenerationAllowance(
      `${context.userId}:${access.id}`,
    );

    if (retryAfter !== null) {
      return errorResponse(
        "You have generated several study packs. Try again in a few minutes.",
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    const providerMessage = await callStudyPackProvider(
      request,
      access.slug,
      sourceText,
      quizCount,
      flashcardCount,
    );
    const response: StudyPackResponse = {
      generatedAt: new Date().toISOString(),
      sourceCharacters: sourceText.length,
      studyPack: readStudyPackProviderResponse(
        providerMessage,
        quizCount,
        flashcardCount,
      ),
    };

    return NextResponse.json(response, { headers: PRIVATE_HEADERS });
  } catch (error) {
    if (error instanceof StudyPackInputError) {
      return errorResponse(error.message, 400);
    }

    if (error instanceof RoomDomainError) {
      return errorResponse("The room could not be found.", 404);
    }

    if (error instanceof StudyPackProviderError) {
      return errorResponse(
        error.code === "refusal"
          ? "The assistant could not create a study pack from these notes. Revise the source and try again."
          : "The assistant returned an incomplete study pack. Try again.",
        error.code === "refusal" ? 422 : 502,
      );
    }

    if (
      error instanceof Anthropic.APIConnectionTimeoutError ||
      error instanceof Anthropic.APIUserAbortError ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return errorResponse(
        "Study-pack generation took too long. Try again.",
        504,
      );
    }

    if (error instanceof Anthropic.RateLimitError) {
      return errorResponse(
        "The AI assistant is busy right now. Try again in a minute.",
        503,
      );
    }

    if (
      error instanceof Anthropic.AuthenticationError ||
      error instanceof Anthropic.PermissionDeniedError
    ) {
      console.error("[qollab:ai-study-pack] AI credential rejected", {
        status: error.status,
      });
      return errorResponse(
        "The AI assistant is not configured correctly. Check the server AI credential.",
        503,
      );
    }

    if (
      error instanceof Error &&
      error.message === "AI_CONFIGURATION_MISSING"
    ) {
      return errorResponse(
        "The AI assistant is not configured yet. Add the server AI credential and try again.",
        503,
      );
    }

    return errorResponse(
      "The AI assistant is temporarily unavailable. Try again.",
      502,
    );
  }
}

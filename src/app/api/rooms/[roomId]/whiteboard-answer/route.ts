import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

import {
  buildWhiteboardAnswerRequest,
  DEFAULT_WHITEBOARD_MODEL,
  MAX_WHITEBOARD_ANSWER_REQUEST_BYTES,
  normalizeWhiteboardContext,
  normalizeWhiteboardQuestion,
  readWhiteboardAnswer,
  type WhiteboardAnswer,
  WhiteboardAnswerInputError,
  WhiteboardAnswerProviderError,
  type WhiteboardAnswerResponse,
} from "@/lib/ai/whiteboard-answer";
import { consumeSharedAiAllowance } from "@/lib/ai/usage-limit";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface WhiteboardAnswerRouteProps {
  params: Promise<{ roomId: string }>;
}

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const GENERATION_WINDOW_MS = 10 * 60 * 1_000;
const GENERATION_LIMIT = 12;
const PROVIDER_TIMEOUT_MS = 25_000;
const generationBuckets = new Map<string, number[]>();

export const maxDuration = 30;

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
    contentLength > MAX_WHITEBOARD_ANSWER_REQUEST_BYTES
  ) {
    throw new WhiteboardAnswerInputError(
      "The whiteboard question is too large.",
    );
  }

  let value: unknown;

  try {
    value = await request.json();
  } catch {
    throw new WhiteboardAnswerInputError(
      "The whiteboard answer request is invalid.",
    );
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new WhiteboardAnswerInputError(
      "The whiteboard answer request is invalid.",
    );
  }

  const body = value as Record<string, unknown>;
  const allowedKeys = new Set(["question", "context"]);

  if (
    !("question" in body) ||
    Object.keys(body).some((key) => !allowedKeys.has(key))
  ) {
    throw new WhiteboardAnswerInputError(
      "The whiteboard answer request is invalid.",
    );
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

async function callWhiteboardAnswerProvider(
  request: Request,
  question: string,
  boardNotes: string,
): Promise<WhiteboardAnswer> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("AI_CONFIGURATION_MISSING");
  }

  const client = new Anthropic({
    apiKey,
    maxRetries: 1,
    timeout: PROVIDER_TIMEOUT_MS,
  });
  const message = await client.beta.messages.create(
    buildWhiteboardAnswerRequest({
      model: process.env.ANTHROPIC_WHITEBOARD_MODEL ?? DEFAULT_WHITEBOARD_MODEL,
      question,
      context: boardNotes,
    }),
    // Stop generating if the student leaves the page.
    { signal: request.signal },
  );

  return readWhiteboardAnswer(message);
}

export async function POST(
  request: Request,
  { params }: WhiteboardAnswerRouteProps,
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

    if (access.role === "viewer") {
      return errorResponse(
        "Only editors can add AI answers to the whiteboard.",
        403,
      );
    }

    const question = normalizeWhiteboardQuestion(body.question);
    const boardNotes = normalizeWhiteboardContext(body.context);
    const retryAfter =
      consumeGenerationAllowance(context.userId) ??
      (await consumeSharedAiAllowance(context.userId, "whiteboard-answer"));

    if (retryAfter !== null) {
      return errorResponse(
        "The whiteboard answer limit has been reached. Try again later.",
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    const answer = await callWhiteboardAnswerProvider(
      request,
      question,
      boardNotes,
    );
    const response: WhiteboardAnswerResponse = {
      ...answer,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, { headers: PRIVATE_HEADERS });
  } catch (error) {
    if (error instanceof WhiteboardAnswerInputError) {
      return errorResponse(error.message, 400);
    }

    if (error instanceof RoomDomainError) {
      return errorResponse("The room could not be found.", 404);
    }

    if (error instanceof WhiteboardAnswerProviderError) {
      return errorResponse(
        error.code === "refusal"
          ? "The assistant could not answer that whiteboard question."
          : "The assistant returned an incomplete answer. Try again.",
        error.code === "refusal" ? 422 : 502,
      );
    }

    if (
      error instanceof Anthropic.APIConnectionTimeoutError ||
      error instanceof Anthropic.APIUserAbortError ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return errorResponse(
        "Whiteboard answer generation took too long. Try again.",
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
      console.error("[qollab:whiteboard-answer] AI credential rejected", {
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

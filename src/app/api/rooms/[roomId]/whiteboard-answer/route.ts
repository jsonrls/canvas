import { NextResponse } from "next/server";

import {
  buildWhiteboardAnswerProviderRequest,
  MAX_WHITEBOARD_ANSWER_REQUEST_BYTES,
  normalizeWhiteboardQuestion,
  readWhiteboardAnswerProviderResponse,
  WhiteboardAnswerInputError,
  WhiteboardAnswerProviderError,
  type WhiteboardAnswerResponse,
} from "@/lib/ai/whiteboard-answer";
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
const DEFAULT_WHITEBOARD_MODEL = "gpt-4o-mini";
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
  const allowedKeys = new Set(["question"]);

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
  roomSlug: string,
  question: string,
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("AI_CONFIGURATION_MISSING");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  const abortProviderRequest = (): void => controller.abort();
  request.signal.addEventListener("abort", abortProviderRequest, {
    once: true,
  });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify(
        buildWhiteboardAnswerProviderRequest(
          process.env.OPENAI_WHITEBOARD_MODEL ?? DEFAULT_WHITEBOARD_MODEL,
          roomSlug,
          question,
        ),
      ),
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("AI_PROVIDER_UNAVAILABLE");
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
    request.signal.removeEventListener("abort", abortProviderRequest);
  }
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
    const retryAfter = consumeGenerationAllowance(
      `${context.userId}:${access.id}:whiteboard-answer`,
    );

    if (retryAfter !== null) {
      return errorResponse(
        "You have generated several whiteboard answers. Try again in a few minutes.",
        429,
        { "Retry-After": String(retryAfter) },
      );
    }

    const providerPayload = await callWhiteboardAnswerProvider(
      request,
      access.slug,
      question,
    );
    const response: WhiteboardAnswerResponse = {
      answer: readWhiteboardAnswerProviderResponse(providerPayload),
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

    if (error instanceof DOMException && error.name === "AbortError") {
      return errorResponse(
        "Whiteboard answer generation took too long. Try again.",
        504,
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

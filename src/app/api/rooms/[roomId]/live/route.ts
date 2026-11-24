import { NextResponse } from "next/server";

import { LiveInputError, readQuestionDraft } from "@/lib/live/activities";
import {
  buildLiveSnapshot,
  createLiveQuestion,
  deleteLiveQuestion,
  LiveConflictError,
  LiveNotFoundError,
  presentLiveQuestion,
  resetLiveResults,
  setLiveAccepting,
  setLiveResultsVisible,
  submitLiveResponse,
} from "@/lib/live/repository";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import {
  createServiceRoleClient,
  getAuthenticatedContext,
} from "@/lib/supabase/server";

interface LiveRouteProps {
  params: Promise<{ roomId: string }>;
}

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

const HOST_ACTIONS = new Set([
  "create_question",
  "delete_question",
  "present",
  "set_accepting",
  "set_results",
  "reset_results",
]);

class LiveForbiddenError extends Error {}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { headers: PRIVATE_HEADERS, status },
  );
}

function errorResponse(error: unknown): NextResponse {
  if (error instanceof LiveInputError) return jsonError(error.message, 400);
  if (error instanceof LiveForbiddenError) {
    return jsonError(
      "Only the room owner or an editor can run live activities.",
      403,
    );
  }
  if (error instanceof RoomDomainError) {
    return jsonError("The room could not be found.", 404);
  }
  if (error instanceof LiveNotFoundError) {
    return jsonError("That live question no longer exists.", 404);
  }
  if (error instanceof LiveConflictError) return jsonError(error.message, 409);
  console.error("Live activities request failed", {
    code: error instanceof Error ? error.message : "UNKNOWN",
  });
  return jsonError("Live activities are temporarily unavailable.", 502);
}

function readId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new LiveInputError("The live question is invalid.");
  }
  return value;
}

function readBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new LiveInputError("The live activity request is invalid.");
  }
  return value;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // Fall through to the shared invalid-request error.
  }
  throw new LiveInputError("The live activity request is invalid.");
}

async function loadAccess(params: LiveRouteProps["params"]) {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  const { roomId } = await params;
  const access = await getRoomMemberAccess(
    context.client,
    roomId,
    context.userId,
  );
  return {
    roomId: access.id,
    userId: context.userId,
    // Hosting follows the room role, not the viewer-collaboration toggle.
    canHost: access.role !== "viewer",
  };
}

export async function GET(
  _request: Request,
  { params }: LiveRouteProps,
): Promise<NextResponse> {
  try {
    const access = await loadAccess(params);
    if (!access) return jsonError("Authentication required.", 401);
    const snapshot = await buildLiveSnapshot(createServiceRoleClient(), access);
    return NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: LiveRouteProps,
): Promise<NextResponse> {
  try {
    const [access, body] = await Promise.all([
      loadAccess(params),
      readBody(request),
    ]);
    if (!access) return jsonError("Authentication required.", 401);

    const action = body.action;
    if (typeof action !== "string") {
      throw new LiveInputError("The live activity request is invalid.");
    }
    if (HOST_ACTIONS.has(action) && !access.canHost) {
      throw new LiveForbiddenError();
    }

    const admin = createServiceRoleClient();
    const { roomId, userId } = access;

    switch (action) {
      case "create_question":
        await createLiveQuestion(
          admin,
          roomId,
          userId,
          readQuestionDraft(body.draft),
        );
        break;
      case "delete_question":
        await deleteLiveQuestion(admin, roomId, readId(body.questionId));
        break;
      case "present":
        await presentLiveQuestion(
          admin,
          roomId,
          body.questionId === null ? null : readId(body.questionId),
        );
        break;
      case "set_accepting":
        await setLiveAccepting(admin, roomId, readBoolean(body.value));
        break;
      case "set_results":
        await setLiveResultsVisible(admin, roomId, readBoolean(body.value));
        break;
      case "reset_results":
        await resetLiveResults(admin, roomId);
        break;
      case "respond":
        await submitLiveResponse(admin, {
          roomId,
          userId,
          questionId: readId(body.questionId),
          value: body.value,
        });
        break;
      default:
        throw new LiveInputError("The live activity request is invalid.");
    }

    const snapshot = await buildLiveSnapshot(admin, access);
    return NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return errorResponse(error);
  }
}

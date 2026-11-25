import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { getBreakoutMemberAccess } from "@/lib/breakout-rooms/repository";
import { LiveInputError } from "@/lib/live/activities";
import { LiveConflictError, LiveNotFoundError } from "@/lib/live/repository";
import { breakoutLiveScope, roomLiveScope } from "@/lib/live/scope";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export class LiveForbiddenError extends Error {}

export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { headers: PRIVATE_HEADERS, status },
  );
}

export function liveErrorResponse(error: unknown): NextResponse {
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

export function readLiveId(value: unknown): string {
  if (typeof value !== "string" || !/^[0-9a-f-]{36}$/i.test(value)) {
    throw new LiveInputError("The live question is invalid.");
  }
  return value;
}

export interface LiveRouteProps {
  /** `code` is present on the breakout routes only. */
  params: Promise<{ roomId: string; code?: string }>;
}

/** Who is asking, and which room's or breakout's activities they may use. */
export async function resolveLiveAccess(
  client: SupabaseClient,
  userId: string,
  { code, roomId }: { roomId: string; code?: string },
) {
  if (code === undefined) {
    const access = await getRoomMemberAccess(client, roomId, userId);
    return {
      scope: roomLiveScope(access.id),
      userId,
      // Hosting follows the room role, not the viewer-collaboration toggle.
      canHost: access.role !== "viewer",
    };
  }
  const access = await getBreakoutMemberAccess(client, roomId, code, userId);
  return {
    scope: breakoutLiveScope(access.breakoutRoomId),
    userId,
    canHost: access.role !== "viewer",
  };
}

export async function loadLiveAccess(params: LiveRouteProps["params"]) {
  const context = await getAuthenticatedContext();
  if (!context) return null;
  return resolveLiveAccess(context.client, context.userId, await params);
}

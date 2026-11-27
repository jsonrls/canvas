import { type NextRequest, NextResponse } from "next/server";

import { LiveInputError } from "@/lib/live/activities";
import {
  createGuest,
  findGuestRoom,
  GUEST_COOKIE,
  GUEST_COOKIE_MAX_AGE_SECONDS,
  guestCookiePath,
  LiveGuestLinkError,
  loadGuest,
  readGuestCode,
  readGuestName,
} from "@/lib/live/guests";
import {
  jsonError,
  liveErrorResponse,
  PRIVATE_HEADERS,
  readLiveId,
} from "@/lib/live/http";
import {
  askLiveQuestion,
  buildLiveSnapshot,
  submitLiveResponse,
  voteLiveQuestion,
} from "@/lib/live/repository";
import { roomLiveScope } from "@/lib/live/scope";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface GuestRouteProps {
  params: Promise<{ code: string }>;
}

const MAX_BODY_BYTES = 16 * 1024;

/** The room behind a guest link, and the guest from this browser's cookie. */
async function loadGuestAccess(
  request: NextRequest,
  params: GuestRouteProps["params"],
) {
  const code = readGuestCode((await params).code);
  const admin = createServiceRoleClient();
  const room = await findGuestRoom(admin, code);
  if (!room) throw new LiveGuestLinkError();
  const guest = await loadGuest(
    admin,
    room.roomId,
    request.cookies.get(GUEST_COOKIE)?.value,
  );
  return { admin, code, guest, scope: roomLiveScope(room.roomId) };
}

function guestErrorResponse(error: unknown): NextResponse {
  if (error instanceof LiveGuestLinkError) {
    return jsonError("This live link is no longer active.", 404);
  }
  return liveErrorResponse(error);
}

export async function GET(
  request: NextRequest,
  { params }: GuestRouteProps,
): Promise<NextResponse> {
  try {
    const { admin, guest, scope } = await loadGuestAccess(request, params);
    if (!guest) return jsonError("Enter your name to join.", 401);
    const snapshot = await buildLiveSnapshot(admin, {
      scope,
      userId: guest.id,
      canHost: false,
    });
    return NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return guestErrorResponse(error);
  }
}

async function readBody(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    throw new LiveInputError("The live activity request is invalid.");
  }
  try {
    const body: unknown = await request.json();
    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }
  } catch {
    // Reported below.
  }
  throw new LiveInputError("The live activity request is invalid.");
}

/** Guests can join, answer, ask and vote. Everything else is for hosts. */
export async function POST(
  request: NextRequest,
  { params }: GuestRouteProps,
): Promise<NextResponse> {
  try {
    const body = await readBody(request);
    const access = await loadGuestAccess(request, params);
    const { admin, code, scope } = access;
    let guest = access.guest;
    let token: string | null = null;

    if (body.action === "join") {
      // A second join from the same browser keeps the guest it has.
      if (!guest) {
        const name = readGuestName(body.name);
        const created = await createGuest(admin, scope.id, name);
        guest = { id: created.id, name };
        token = created.token;
      }
    } else {
      if (!guest) return jsonError("Enter your name to join.", 401);
      const participant = { scope, userId: guest.id, isGuest: true };
      switch (body.action) {
        case "respond":
          await submitLiveResponse(admin, {
            ...participant,
            questionId: readLiveId(body.questionId),
            value: body.value,
          });
          break;
        case "qa_ask":
          await askLiveQuestion(admin, {
            ...participant,
            questionId: readLiveId(body.questionId),
            text: body.text,
          });
          break;
        case "qa_vote":
          if (typeof body.value !== "boolean") {
            throw new LiveInputError("The live activity request is invalid.");
          }
          await voteLiveQuestion(admin, {
            ...participant,
            itemId: readLiveId(body.itemId),
            value: body.value,
          });
          break;
        default:
          return jsonError("Only the host can do that.", 403);
      }
    }

    const snapshot = await buildLiveSnapshot(admin, {
      scope,
      userId: guest.id,
      canHost: false,
    });
    const response = NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
    if (token) {
      response.cookies.set(GUEST_COOKIE, token, {
        httpOnly: true,
        maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
        path: guestCookiePath(code),
        sameSite: "lax",
        secure: process.env.NODE_ENV !== "development",
      });
    }
    return response;
  } catch (error) {
    return guestErrorResponse(error);
  }
}

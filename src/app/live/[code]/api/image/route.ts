import type { NextRequest } from "next/server";

import {
  findGuestRoom,
  GUEST_COOKIE,
  LiveGuestLinkError,
  loadGuest,
  readGuestCode,
} from "@/lib/live/guests";
import { jsonError, liveErrorResponse, readLiveId } from "@/lib/live/http";
import { loadLiveImage } from "@/lib/live/repository";
import { roomLiveScope } from "@/lib/live/scope";
import { createServiceRoleClient } from "@/lib/supabase/server";

/** The image of the presented pin question, for guests who joined. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  try {
    const admin = createServiceRoleClient();
    const room = await findGuestRoom(admin, readGuestCode((await params).code));
    if (!room) throw new LiveGuestLinkError();
    const guest = await loadGuest(
      admin,
      room.roomId,
      request.cookies.get(GUEST_COOKIE)?.value,
    );
    if (!guest) return jsonError("Enter your name to join.", 401);
    const image = await loadLiveImage(admin, {
      scope: roomLiveScope(room.roomId),
      canHost: false,
      questionId: readLiveId(request.nextUrl.searchParams.get("questionId")),
    });
    return new Response(image, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof LiveGuestLinkError) {
      return jsonError("This live link is no longer active.", 404);
    }
    return liveErrorResponse(error);
  }
}

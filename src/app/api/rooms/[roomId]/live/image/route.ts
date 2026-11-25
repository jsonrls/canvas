import {
  jsonError,
  liveErrorResponse,
  loadLiveAccess,
  type LiveRouteProps,
  readLiveId,
} from "@/lib/live/http";
import { loadLiveImage } from "@/lib/live/repository";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: LiveRouteProps,
): Promise<Response> {
  try {
    const access = await loadLiveAccess(params);
    if (!access) return jsonError("Authentication required.", 401);
    const image = await loadLiveImage(createServiceRoleClient(), {
      scope: access.scope,
      canHost: access.canHost,
      questionId: readLiveId(
        new URL(request.url).searchParams.get("questionId"),
      ),
    });
    // A question's image never changes, so the browser may keep it.
    return new Response(image, {
      headers: {
        "Cache-Control": "private, max-age=3600",
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return liveErrorResponse(error);
  }
}

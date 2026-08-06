import { experimental_upgradeWebSocket } from "@vercel/functions";

import { getAuthenticatedContext } from "@/lib/supabase/server";
import {
  attachDocumentConnection,
  attachPresenceConnection,
  authorizeCollaborationRequest,
  prepareCollaborationConnection,
} from "../../../../../server/yjs-runtime.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request): Promise<Response> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return new Response("Unauthorized", {
      headers: { "Cache-Control": "private, no-store" },
      status: 401,
    });
  }

  const authorization = await authorizeCollaborationRequest(
    request,
    context.accessToken,
  );

  if ("error" in authorization) {
    return new Response(authorization.error, {
      headers: { "Cache-Control": "private, no-store" },
      status: authorization.status,
    });
  }

  try {
    await prepareCollaborationConnection(authorization);
  } catch {
    return new Response("Collaboration service unavailable", {
      headers: { "Cache-Control": "private, no-store" },
      status: 503,
    });
  }

  return experimental_upgradeWebSocket(
    (websocket) => {
      if ("channel" in authorization) {
        attachPresenceConnection(websocket, authorization);
        return;
      }

      attachDocumentConnection(websocket, request, authorization);
    },
    { maxPayload: 8 * 1024 * 1024 },
  );
}

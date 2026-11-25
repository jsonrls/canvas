import { buildResultSheets } from "@/lib/live/export";
import {
  jsonError,
  LiveForbiddenError,
  liveErrorResponse,
  loadLiveAccess,
  type LiveRouteProps,
  PRIVATE_HEADERS,
} from "@/lib/live/http";
import { loadLiveExport } from "@/lib/live/repository";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { writeXlsx } from "@/lib/xlsx";

export async function GET(
  _request: Request,
  { params }: LiveRouteProps,
): Promise<Response> {
  try {
    const access = await loadLiveAccess(params);
    if (!access) return jsonError("Authentication required.", 401);
    if (!access.canHost) throw new LiveForbiddenError();

    const workbook = writeXlsx(
      buildResultSheets(
        await loadLiveExport(
          createServiceRoleClient(),
          access.scope,
          access.userId,
        ),
      ),
    );
    return new Response(new Uint8Array(workbook), {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Disposition": 'attachment; filename="live-results.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return liveErrorResponse(error);
  }
}

import { NextResponse } from "next/server";

import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface ViewerCollaborationRouteProps {
  params: Promise<{ roomId: string }>;
}

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: ViewerCollaborationRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return NextResponse.json(
      { error: "Authentication required." },
      { headers: PRIVATE_HEADERS, status: 401 },
    );
  }

  try {
    const { roomId } = await params;
    const access = await getRoomMemberAccess(
      context.client,
      roomId,
      context.userId,
    );

    return NextResponse.json(
      { enabled: access.viewerCanCollaborate },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RoomDomainError
            ? error.message
            : "Viewer collaboration status could not be loaded.",
      },
      { headers: PRIVATE_HEADERS, status: 403 },
    );
  }
}

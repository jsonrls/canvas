import { NextResponse } from "next/server";

import { getProfileDisplayNames } from "@/lib/profiles/repository";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface CollaboratorNamesRouteProps {
  params: Promise<{ roomId: string }>;
}

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: CollaboratorNamesRouteProps,
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
    const { data: memberships, error: membershipError } = await context.client
      .from("room_members")
      .select("user_id")
      .eq("room_id", access.id)
      .limit(250);

    if (membershipError) {
      throw new RoomDomainError("Collaborator names could not be loaded.");
    }

    const displayNames = await getProfileDisplayNames(
      context.client,
      (memberships ?? []).map(({ user_id }) => user_id),
    );

    return NextResponse.json(
      {
        collaborators: Array.from(displayNames, ([id, name]) => ({ id, name })),
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RoomDomainError
            ? error.message
            : "Collaborator names could not be loaded.",
      },
      { headers: PRIVATE_HEADERS, status: 403 },
    );
  }
}

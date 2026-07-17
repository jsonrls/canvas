import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CollaborativeRoom } from "@/components/collaboration/collaborative-room";
import { getProfile } from "@/lib/profiles/repository";
import { getRoomWorkspace, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";
import { listVersions } from "@/lib/version-history/repository";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

const ROOM_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

function formatRoomName(roomId: string): string {
  return roomId
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;

  return {
    title: ROOM_ID_PATTERN.test(roomId)
      ? `${formatRoomName(roomId)} room`
      : "Study room",
  };
}

export default async function RoomPage({
  params,
}: RoomPageProps): Promise<React.ReactElement> {
  const { roomId } = await params;

  if (!ROOM_ID_PATTERN.test(roomId)) {
    notFound();
  }

  const context = await getAuthenticatedContext();

  if (!context) {
    redirect(`/login?next=${encodeURIComponent(`/rooms/${roomId}`)}`);
  }

  let room;

  try {
    room = await getRoomWorkspace(context.client, roomId, context.userId);
  } catch (error) {
    if (error instanceof RoomDomainError) {
      notFound();
    }

    throw error;
  }

  const [profile, versions] = await Promise.all([
    getProfile(context.client, context.userId),
    listVersions(context.client, room.slug),
  ]);

  return (
    <CollaborativeRoom
      availableRooms={room.joinedRooms}
      currentUser={{
        displayName: profile.displayName,
        id: context.userId,
      }}
      currentUserRole={room.role}
      initialDocumentState={room.initialDocumentState}
      initialVersions={versions}
      isPublic={room.isPublic}
      key={room.slug}
      roomId={room.slug}
      roomName={room.name}
    />
  );
}

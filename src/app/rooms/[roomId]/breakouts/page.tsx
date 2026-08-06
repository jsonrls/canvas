import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BreakoutRoomDirectory } from "@/components/rooms/breakout-room-directory";
import {
  listBreakoutRooms,
  type BreakoutRoomDirectoryItem,
} from "@/lib/breakout-rooms/repository";
import { getProfile } from "@/lib/profiles/repository";
import {
  getRoomMemberAccess,
  RoomDomainError,
  type RoomRole,
} from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface BreakoutDirectoryPageProps {
  params: Promise<{ roomId: string }>;
}

const ROOM_ID_PATTERN = /^[a-z0-9-]{1,64}$/;

export async function generateMetadata({
  params,
}: BreakoutDirectoryPageProps): Promise<Metadata> {
  const { roomId } = await params;

  return {
    title: ROOM_ID_PATTERN.test(roomId)
      ? "Breakout rooms"
      : "Study room breakouts",
  };
}

export default async function BreakoutDirectoryPage({
  params,
}: BreakoutDirectoryPageProps): Promise<React.ReactElement> {
  const { roomId } = await params;
  const nextPath = `/rooms/${roomId}/breakouts`;

  if (!ROOM_ID_PATTERN.test(roomId)) {
    notFound();
  }

  const context = await getAuthenticatedContext();

  if (!context) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  let directory: {
    breakoutRooms: BreakoutRoomDirectoryItem[];
    displayName: string;
    parentRoomName: string;
    parentRoomSlug: string;
    role: RoomRole;
  };

  try {
    const access = await getRoomMemberAccess(
      context.client,
      roomId,
      context.userId,
    );
    const [roomResult, breakoutRooms, profile] = await Promise.all([
      context.client.from("rooms").select("name").eq("id", access.id).single(),
      listBreakoutRooms(context.client, access.id),
      getProfile(context.client, context.userId),
    ]);

    if (roomResult.error || !roomResult.data) {
      throw new RoomDomainError("That study room could not be loaded.");
    }

    directory = {
      breakoutRooms,
      displayName: profile.displayName,
      parentRoomName: roomResult.data.name,
      parentRoomSlug: access.slug,
      role: access.role,
    };
  } catch (error) {
    if (error instanceof RoomDomainError) {
      notFound();
    }

    throw error;
  }

  return (
    <BreakoutRoomDirectory
      breakoutRooms={directory.breakoutRooms}
      currentUser={{
        displayName: directory.displayName,
        id: context.userId,
      }}
      parentRoomName={directory.parentRoomName}
      parentRoomSlug={directory.parentRoomSlug}
      role={directory.role}
    />
  );
}

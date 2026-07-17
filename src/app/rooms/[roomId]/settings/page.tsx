import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { RoomSettingsPanel } from "@/components/rooms/room-settings";
import {
  getRoomSettings,
  RoomDomainError,
  type RoomSettings,
} from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface RoomSettingsPageProps {
  params: Promise<{ roomId: string }>;
}

export const metadata: Metadata = {
  title: "Room settings",
};

export default async function RoomSettingsPage({
  params,
}: RoomSettingsPageProps): Promise<React.ReactElement> {
  const { roomId } = await params;
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect(`/login?next=${encodeURIComponent(`/rooms/${roomId}/settings`)}`);
  }

  let room: RoomSettings;

  try {
    room = await getRoomSettings(context.client, roomId, context.userId);
  } catch (error) {
    if (error instanceof RoomDomainError) {
      notFound();
    }

    throw error;
  }

  return <RoomSettingsPanel room={room} />;
}

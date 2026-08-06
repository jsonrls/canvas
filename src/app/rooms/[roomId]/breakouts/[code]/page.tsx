import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BreakoutRoomWorkspace } from "@/components/collaboration/breakout-room-workspace";
import { getBreakoutRoomWorkspace } from "@/lib/breakout-rooms/repository";
import { getProfile } from "@/lib/profiles/repository";
import { RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface BreakoutRoomPageProps {
  params: Promise<{ code: string; roomId: string }>;
}

export async function generateMetadata({
  params,
}: BreakoutRoomPageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: /^[A-Z0-9]{8}$/i.test(code)
      ? `Breakout ${code.toUpperCase()}`
      : "Breakout room",
  };
}

export default async function BreakoutRoomPage({
  params,
}: BreakoutRoomPageProps): Promise<React.ReactElement> {
  const { code, roomId } = await params;
  const nextPath = `/rooms/${roomId}/breakouts/${code}`;
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  let breakout;

  try {
    breakout = await getBreakoutRoomWorkspace(
      context.client,
      roomId,
      code,
      context.userId,
    );
  } catch (error) {
    if (error instanceof RoomDomainError) {
      notFound();
    }

    throw error;
  }

  const profile = await getProfile(context.client, context.userId);

  return (
    <BreakoutRoomWorkspace
      breakout={breakout}
      currentUser={{ displayName: profile.displayName, id: context.userId }}
    />
  );
}

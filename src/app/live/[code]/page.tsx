import type { Metadata } from "next";
import { cookies } from "next/headers";

import { LiveGuest } from "@/components/collaboration/live/live-guest";
import {
  findGuestRoom,
  GUEST_COOKIE,
  LiveGuestLinkError,
  loadGuest,
  readGuestCode,
} from "@/lib/live/guests";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Join live activity",
  robots: { follow: false, index: false },
};

interface LiveGuestPageProps {
  params: Promise<{ code: string }>;
}

/** Who opened the link: the room, and the guest this browser already is. */
async function loadLink(rawCode: string) {
  try {
    const code = readGuestCode(rawCode);
    const admin = createServiceRoleClient();
    const room = await findGuestRoom(admin, code);
    if (!room) return null;
    const guest = await loadGuest(
      admin,
      room.roomId,
      (await cookies()).get(GUEST_COOKIE)?.value,
    );
    return { code, roomName: room.roomName, guestName: guest?.name ?? null };
  } catch (error) {
    if (error instanceof LiveGuestLinkError) return null;
    throw error;
  }
}

export default async function LiveGuestPage({
  params,
}: LiveGuestPageProps): Promise<React.ReactElement> {
  const link = await loadLink((await params).code);
  return <LiveGuest link={link} />;
}

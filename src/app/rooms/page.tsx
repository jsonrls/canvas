import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { RoomsDashboard } from "@/components/rooms/rooms-dashboard";
import { getProfile } from "@/lib/profiles/repository";
import { listRoomDirectory } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Study rooms",
};

export default async function RoomsPage(): Promise<React.ReactElement> {
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect("/login?next=%2Frooms");
  }

  const [profile, directory] = await Promise.all([
    getProfile(context.client, context.userId),
    listRoomDirectory(context.client, context.userId),
  ]);

  return (
    <RoomsDashboard
      directory={directory}
      displayName={profile.displayName}
      userId={context.userId}
    />
  );
}

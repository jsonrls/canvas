import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { ProfilePanel } from "@/components/account/profile-panel";
import { getProfile } from "@/lib/profiles/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage the name you use across Qollab study rooms.",
};

export default async function ProfilePage(): Promise<React.ReactElement> {
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect("/login?next=%2Fprofile");
  }

  const profile = await getProfile(context.client, context.userId);

  return (
    <AccountShell
      activePage="profile"
      displayName={profile.displayName}
      email={context.email}
      intro="Choose the name your study partners see when you collaborate, present, and leave notes."
      title="Your study identity."
    >
      <ProfilePanel displayName={profile.displayName} email={context.email} />
    </AccountShell>
  );
}

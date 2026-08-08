import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountShell } from "@/components/account/account-shell";
import { SettingsPanel } from "@/components/account/settings-panel";
import { getProfile } from "@/lib/profiles/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
  description: "Review your Qollab account and security settings.",
};

export default async function SettingsPage(): Promise<React.ReactElement> {
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect("/login?next=%2Fsettings");
  }

  const profile = await getProfile(context.client, context.userId);

  return (
    <AccountShell
      activePage="settings"
      displayName={profile.displayName}
      email={context.email}
      intro="Review your sign-in details, strengthen account security, and manage your current session."
      title="Everything in its place."
    >
      <SettingsPanel
        displayName={profile.displayName}
        email={context.email}
        userId={context.userId}
      />
    </AccountShell>
  );
}

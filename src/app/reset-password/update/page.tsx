import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/app/reset-password/update/update-password-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { createServerAuthClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { follow: false, index: false },
};

export default async function UpdatePasswordPage(): Promise<React.ReactElement> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || typeof data?.claims.sub !== "string") {
    redirect("/reset-password?error=invalid_or_expired");
  }

  return (
    <AuthShell
      eyebrow="Secure reset link"
      title="Choose a fresh key."
      intro="Set a new password for your account. When it is saved, this recovery session will close and you can sign in again."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}

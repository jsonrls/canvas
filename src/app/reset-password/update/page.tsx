import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/app/reset-password/update/update-password-form";
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
    <main className="login-page auth-page">
      <section className="login-card" aria-labelledby="new-password-title">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            BP
          </span>
          <span>BoardPrep Canvas</span>
        </div>
        <p className="eyebrow">Secure reset link</p>
        <h1 id="new-password-title">Choose a fresh key.</h1>
        <p className="login-intro">
          Set a new password for your account. When it is saved, this recovery
          session will close and you can sign in again.
        </p>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}

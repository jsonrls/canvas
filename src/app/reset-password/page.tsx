import type { Metadata } from "next";

import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { follow: false, index: false },
};

interface ResetPasswordPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps): Promise<React.ReactElement> {
  const { error } = await searchParams;
  const initialError =
    error === "invalid_or_expired"
      ? "This reset link is invalid or expired. Request a new one below."
      : undefined;

  return (
    <main className="login-page auth-page">
      <section className="login-card" aria-labelledby="reset-password-title">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            BP
          </span>
          <span>BoardPrep Canvas</span>
        </div>
        <p className="eyebrow">Account recovery</p>
        <h1 id="reset-password-title">Find your way back in.</h1>
        <p className="login-intro">
          Enter your account email. We will send one secure route back to your
          study rooms without revealing whether the address is registered.
        </p>
        <ResetPasswordForm initialError={initialError} />
      </section>
    </main>
  );
}

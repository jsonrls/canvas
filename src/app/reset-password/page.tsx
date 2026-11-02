import type { Metadata } from "next";

import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

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
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      intro="Enter the email address you use to sign in to Qollab."
    >
      <ResetPasswordForm initialError={initialError} />
    </AuthShell>
  );
}

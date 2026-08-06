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
      title="Find your way back in."
      intro="Enter your account email. We will send one secure route back to your study rooms without revealing whether the address is registered."
    >
      <ResetPasswordForm initialError={initialError} />
    </AuthShell>
  );
}

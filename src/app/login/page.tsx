import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeNextPath } from "@/lib/auth/redirects";
import { SuccessToastOnMount } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Sign in",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.ReactElement> {
  const { error, next, reset } = await searchParams;
  const nextPath = safeNextPath(next);
  const initialError =
    error === "confirmation_failed"
      ? "This confirmation link is invalid or expired. Sign in to continue, or to get a new link."
      : undefined;

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Welcome back!"
      intro="Sign in to open your rooms and keep working with your group."
    >
      {reset === "success" ? (
        <SuccessToastOnMount message="Your password is updated. Sign in with the new one." />
      ) : null}
      <LoginForm initialError={initialError} nextPath={nextPath} />
    </AuthShell>
  );
}

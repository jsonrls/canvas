import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { SuccessToastOnMount } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Sign in",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string; reset?: string }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.ReactElement> {
  const { next, reset } = await searchParams;
  const nextPath =
    next?.startsWith("/") && !next.startsWith("//") ? next : "/rooms";

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Welcome back!"
      intro="Sign in to open your rooms and keep working with your group."
    >
      {reset === "success" ? (
        <SuccessToastOnMount message="Your password is updated. Sign in with the new one." />
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}

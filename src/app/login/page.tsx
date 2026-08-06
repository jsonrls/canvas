import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

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
      title="Return to your study circle."
      intro="Sign in to reopen the notes, questions, and ideas your group has been building together."
    >
      {reset === "success" ? (
        <p className="login-message login-message--success" role="status">
          Your password is updated. Sign in with the new one.
        </p>
      ) : null}
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}

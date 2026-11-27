import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { safeNextPath } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Create an account",
};

interface SignUpPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignUpPage({
  searchParams,
}: SignUpPageProps): Promise<React.ReactElement> {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next);

  return (
    <AuthShell
      eyebrow="Start studying together"
      title="Create your account"
      intro="Create or join a room to work on notes with your group."
      art="signup"
      caption="Pull up a seat. Create a room or join your group’s."
    >
      <LoginForm mode="signup" nextPath={nextPath} />
    </AuthShell>
  );
}

import type { Metadata } from "next";

import { LoginForm } from "@/app/login/login-form";

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
    next?.startsWith("/") && !next.startsWith("//") ? next : "/rooms/demo";

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="brand-mark" aria-hidden="true">
            BP
          </span>
          <span>BoardPrep Canvas</span>
        </div>
        <p className="eyebrow">Secure study room</p>
        <h1 id="login-title">Pick up the thread together.</h1>
        <p className="login-intro">
          Sign in before opening shared notes. Your room membership controls
          collaboration and version-history access.
        </p>
        {reset === "success" ? (
          <p className="login-message login-message--success" role="status">
            Your password is updated. Sign in with the new one.
          </p>
        ) : null}
        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}

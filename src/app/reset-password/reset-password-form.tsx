"use client";

import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/app/reset-password/actions";
import { INITIAL_PASSWORD_RESET_STATE } from "@/lib/auth/password-reset";

export function ResetPasswordForm({
  initialError,
}: {
  initialError?: string;
}): React.ReactElement {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    INITIAL_PASSWORD_RESET_STATE,
  );
  const message = state.message || initialError;
  const status = state.message ? state.status : initialError ? "error" : "idle";

  return (
    <>
      <form className="login-form auth-form" action={action}>
        <label htmlFor="reset-email">
          <span>Email address</span>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-describedby="reset-email-help"
            placeholder="you@example.com"
            required
          />
        </label>
        <p className="auth-field-help" id="reset-email-help">
          We will send a time-limited link if this email belongs to an account.
        </p>

        {message ? (
          <p
            className={`login-message login-message--${status}`}
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}

        <button className="login-submit" type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle className="spin" aria-hidden="true" size={17} />
          ) : (
            <Mail aria-hidden="true" size={17} />
          )}
          {pending ? "Sending secure link…" : "Send reset link"}
        </button>
      </form>

      <Link className="auth-back-link" href="/login">
        <ArrowLeft aria-hidden="true" size={16} />
        Back to sign in
      </Link>
    </>
  );
}

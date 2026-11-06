"use client";

import { ArrowLeft, Mail } from "@/components/ui/icons";
import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/app/reset-password/actions";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { Field } from "@astryxdesign/core/Field";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Text } from "@astryxdesign/core/Text";
import { useSuccessToast } from "@/components/ui/toast";
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
  useSuccessToast(state);
  const message = state.message || initialError;
  const status = state.message ? state.status : initialError ? "error" : "idle";

  return (
    <>
      <form action={action}>
        <FormLayout className="gap-5">
          <Field inputID="reset-email" label="Email address">
            <input
              className="min-h-12 w-full min-w-0 rounded-full border border-border-strong bg-surface px-5 text-primary text-lg focus:outline-accent"
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              aria-describedby="reset-email-help"
              placeholder="you@example.com"
              required
            />
          </Field>
          <Text as="p" color="secondary" id="reset-email-help">
            We will send a time-limited link if this email belongs to an
            account.
          </Text>

          {status === "error" && message ? (
            <Text
              as="p"
              role="alert"
              className="text-primary! bg-error-muted p-3 rounded-2xl"
            >
              {message}
            </Text>
          ) : null}

          <AuthSubmit isDisabled={pending}>
            <Mail aria-hidden="true" size={17} />
            {pending ? "Sending secure link…" : "Send reset link"}
          </AuthSubmit>
        </FormLayout>
      </form>

      <Link
        className="min-h-11 inline-flex items-center justify-center gap-2 text-accent hover:underline focus-visible:outline-accent!"
        href="/login"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to sign in
      </Link>
    </>
  );
}

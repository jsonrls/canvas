"use client";

import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { useActionState, useState } from "react";

import { updatePassword } from "@/app/reset-password/actions";
import {
  INITIAL_PASSWORD_RESET_STATE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/auth/password-reset";

export function UpdatePasswordForm(): React.ReactElement {
  const [state, action, pending] = useActionState(
    updatePassword,
    INITIAL_PASSWORD_RESET_STATE,
  );
  const [showPasswords, setShowPasswords] = useState(false);
  const inputType = showPasswords ? "text" : "password";

  return (
    <form className="login-form auth-form" action={action}>
      <div className="auth-password-field">
        <label htmlFor="new-password">
          <span>New password</span>
        </label>
        <div className="password-input-wrap">
          <input
            id="new-password"
            name="password"
            type={inputType}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={PASSWORD_MAX_LENGTH}
            aria-describedby="new-password-help"
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPasswords ? "Hide passwords" : "Show passwords"}
            aria-controls="new-password new-password-confirmation"
            aria-pressed={showPasswords}
            onClick={() => setShowPasswords((visible) => !visible)}
          >
            {showPasswords ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </button>
        </div>
      </div>
      <p className="auth-field-help" id="new-password-help">
        Use {PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters and choose a
        password you do not use elsewhere.
      </p>

      <label htmlFor="new-password-confirmation">
        <span>Confirm new password</span>
        <input
          id="new-password-confirmation"
          name="passwordConfirmation"
          type={inputType}
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          required
        />
      </label>

      {state.message ? (
        <p
          className={`login-message login-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button className="login-submit" type="submit" disabled={pending}>
        {pending ? (
          <LoaderCircle className="spin" aria-hidden="true" size={17} />
        ) : (
          <KeyRound aria-hidden="true" size={17} />
        )}
        {pending ? "Securing your account…" : "Set new password"}
      </button>
    </form>
  );
}

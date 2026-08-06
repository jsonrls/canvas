"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

import { type AuthActionState, signIn, signUp } from "@/app/login/actions";

const INITIAL_STATE: AuthActionState = {
  message: "",
  status: "idle",
};

interface LoginFormProps {
  mode?: "signin" | "signup";
  nextPath: string;
}

export function LoginForm({
  mode = "signin",
  nextPath,
}: LoginFormProps): React.ReactElement {
  const [signInState, signInAction, isSigningIn] = useActionState(
    signIn,
    INITIAL_STATE,
  );
  const [signUpState, signUpAction, isSigningUp] = useActionState(
    signUp,
    INITIAL_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);
  const isSignUp = mode === "signup";
  const state = isSignUp ? signUpState : signInState;
  const isPending = isSignUp ? isSigningUp : isSigningIn;
  const submitAction = isSignUp ? signUpAction : signInAction;

  return (
    <form className="login-form auth-credentials-form" action={submitAction}>
      <input type="hidden" name="next" value={nextPath} />
      {isSignUp ? (
        <label htmlFor="auth-display-name">
          <span>Display name</span>
          <input
            id="auth-display-name"
            name="displayName"
            type="text"
            autoComplete="name"
            maxLength={60}
            placeholder="How your study group will see you"
            required
          />
        </label>
      ) : null}

      <label htmlFor="auth-email">
        <span>Email address</span>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </label>

      <div className="auth-password-field">
        <div className="login-field-header">
          <label htmlFor="auth-password">
            <span>Password</span>
          </label>
          {!isSignUp ? (
            <Link href="/reset-password">Forgot password?</Link>
          ) : null}
        </div>
        <div className="password-input-wrap">
          <input
            id="auth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            aria-describedby={isSignUp ? "auth-password-help" : undefined}
            placeholder={
              isSignUp ? "Create at least 8 characters" : "Your password"
            }
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-controls="auth-password"
            aria-pressed={showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" size={18} />
            ) : (
              <Eye aria-hidden="true" size={18} />
            )}
          </button>
        </div>
      </div>

      {isSignUp ? (
        <p className="auth-field-help" id="auth-password-help">
          Use 8 or more characters. A unique password keeps your rooms safer.
        </p>
      ) : null}

      {state.message ? (
        <p
          className={`login-message login-message--${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="login-submit"
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? (
          <LoaderCircle className="spin" aria-hidden="true" size={17} />
        ) : isSignUp ? (
          <UserRoundPlus aria-hidden="true" size={17} />
        ) : (
          <ArrowRight aria-hidden="true" size={17} />
        )}
        {isSignUp
          ? isSigningUp
            ? "Creating your account…"
            : "Create my Qollab account"
          : isSigningIn
            ? "Opening your rooms…"
            : "Sign in to Qollab"}
      </button>

      <p className="auth-switch">
        {isSignUp ? "Already have an account?" : "New to Qollab?"}{" "}
        <Link
          href={`${isSignUp ? "/login" : "/signup"}${
            nextPath === "/rooms" ? "" : `?next=${encodeURIComponent(nextPath)}`
          }`}
        >
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

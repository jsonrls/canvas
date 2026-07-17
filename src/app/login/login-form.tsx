"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { type AuthActionState, signIn, signUp } from "@/app/login/actions";

const INITIAL_STATE: AuthActionState = {
  message: "",
  status: "idle",
};

interface LoginFormProps {
  nextPath: string;
}

export function LoginForm({ nextPath }: LoginFormProps): React.ReactElement {
  const [signInState, signInAction, isSigningIn] = useActionState(
    signIn,
    INITIAL_STATE,
  );
  const [signUpState, signUpAction, isSigningUp] = useActionState(
    signUp,
    INITIAL_STATE,
  );
  const state = signInState.status !== "idle" ? signInState : signUpState;
  const isPending = isSigningIn || isSigningUp;

  return (
    <form className="login-form" action={signInAction}>
      <input type="hidden" name="next" value={nextPath} />
      <label>
        <span>Display name (new accounts)</span>
        <input
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={60}
          placeholder="How collaborators see you"
        />
      </label>
      <label>
        <span>Email address</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />
      </label>
      <label>
        <span className="login-field-header">
          Password
          <Link href="/reset-password">Forgot password?</Link>
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={8}
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

      <button className="login-submit" type="submit" disabled={isPending}>
        {isSigningIn ? (
          <LoaderCircle className="spin" aria-hidden="true" size={17} />
        ) : (
          <ArrowRight aria-hidden="true" size={17} />
        )}
        Sign in to your room
      </button>
      <button
        className="login-create"
        type="submit"
        formAction={signUpAction}
        disabled={isPending}
      >
        {isSigningUp ? "Creating account…" : "Create a new account"}
      </button>
    </form>
  );
}

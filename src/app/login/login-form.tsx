"use client";

import { AppIcon } from "@/components/ui/icons";
import {
  Eye as EyeData,
  EyeOff as EyeOffData,
  UserRoundPlus as UserRoundPlusData,
} from "lucide";
import Link from "next/link";
import { useActionState, useState } from "react";

import { type AuthActionState, signIn, signUp } from "@/app/login/actions";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { Field } from "@astryxdesign/core/Field";
import { IconButton } from "@/components/ui/button";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { useSuccessToast } from "@/components/ui/toast";

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
  useSuccessToast(state);

  return (
    <form action={submitAction}>
      <FormLayout className="gap-5">
        <input type="hidden" name="next" value={nextPath} />
        {isSignUp ? (
          <Field inputID="auth-display-name" label="Display name">
            <input
              className="min-h-12 w-full min-w-0 rounded-full border border-border-strong bg-surface px-5 text-primary text-lg focus:outline-accent"
              id="auth-display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={60}
              placeholder="How your study group will see you"
              required
            />
          </Field>
        ) : null}

        <Field inputID="auth-email" label="Email address">
          <input
            className="min-h-12 w-full min-w-0 rounded-full border border-border-strong bg-surface px-5 text-primary text-lg focus:outline-accent"
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field inputID="auth-password" label="Password">
          <HStack gap={0} vAlign="center" className="relative w-full">
            <input
              className="min-h-12 w-full min-w-0 rounded-full border border-border-strong bg-surface px-5 pr-14! text-primary text-lg focus:outline-accent"
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
            <IconButton
              variant="ghost"
              size="lg"
              className="absolute! inset-y-0 right-0 min-h-11 min-w-11 focus-visible:outline-accent!"
              type="button"
              label={showPassword ? "Hide password" : "Show password"}
              aria-controls="auth-password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
              icon={
                <AppIcon
                  iconData={showPassword ? EyeOffData : EyeData}
                  aria-hidden="true"
                  size={18}
                />
              }
            />
          </HStack>
        </Field>

        {!isSignUp ? (
          <Link
            href="/reset-password"
            className="min-h-11 inline-flex items-center text-accent hover:underline focus-visible:outline-accent!"
          >
            Forgot password?
          </Link>
        ) : null}
        {isSignUp ? (
          <Text as="p" color="secondary" id="auth-password-help">
            Use 8 or more characters. A unique password keeps your rooms safer.
          </Text>
        ) : null}

        {state.status === "error" && state.message ? (
          <Text
            as="p"
            role="alert"
            className="text-primary! bg-error-muted p-3 rounded-2xl"
          >
            {state.message}
          </Text>
        ) : null}

        <AuthSubmit isDisabled={isPending}>
          {isSignUp ? (
            <AppIcon
              iconData={UserRoundPlusData}
              aria-hidden="true"
              size={17}
            />
          ) : null}
          {isSignUp
            ? isSigningUp
              ? "Creating your account…"
              : "Create my Qollab account"
            : isSigningIn
              ? "Opening your rooms…"
              : "Sign in to Qollab"}
        </AuthSubmit>

        <Text as="p" color="secondary" justify="center">
          {isSignUp ? "Already have an account?" : "New to Qollab?"}{" "}
          <Link
            className="inline-flex min-h-11 items-center text-accent hover:underline focus-visible:outline-accent!"
            href={`${isSignUp ? "/login" : "/signup"}${
              nextPath === "/rooms"
                ? ""
                : `?next=${encodeURIComponent(nextPath)}`
            }`}
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </Text>
      </FormLayout>
    </form>
  );
}

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
import { ButtonControl } from "@/components/ui/button";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { useSuccessToast } from "@/components/ui/toast";

const INITIAL_STATE: AuthActionState = {
  message: "",
  status: "idle",
};

interface LoginFormProps {
  initialError?: string;
  mode?: "signin" | "signup";
  nextPath: string;
}

export function LoginForm({
  initialError,
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
  const errorMessage =
    state.status === "error"
      ? state.message
      : state.status === "idle"
        ? initialError
        : undefined;
  const isPending = isSignUp ? isSigningUp : isSigningIn;
  const submitAction = isSignUp ? signUpAction : signInAction;
  useSuccessToast(state);

  return (
    <form action={submitAction}>
      <FormLayout className="gap-5">
        <input type="hidden" name="next" value={nextPath} />
        {isSignUp ? (
          <Field inputID="auth-display-name" label="Display name" isLabelHidden>
            <input
              className="min-h-10 w-full min-w-0 rounded-full border border-border-strong bg-surface px-4 text-primary text-lg"
              id="auth-display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              maxLength={60}
              placeholder="Display name"
              required
            />
          </Field>
        ) : null}

        <Field inputID="auth-email" label="Email address" isLabelHidden>
          <input
            className="min-h-10 w-full min-w-0 rounded-full border border-border-strong bg-surface px-4 text-primary text-lg"
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email address"
            required
          />
        </Field>

        <Field inputID="auth-password" label="Password" isLabelHidden>
          <HStack gap={0} vAlign="center" className="relative w-full">
            <input
              className="min-h-10 w-full min-w-0 rounded-full border border-border-strong bg-surface px-4 pr-12! text-primary text-lg"
              id="auth-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={8}
              aria-describedby={isSignUp ? "auth-password-help" : undefined}
              placeholder={isSignUp ? "Create a password" : "Password"}
              required
            />
            <ButtonControl
              variant="custom"
              className="absolute inset-y-0 right-1 flex min-w-10 cursor-pointer items-center justify-center rounded-full text-secondary! hover:text-primary! aria-pressed:text-accent!"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-controls="auth-password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              <AppIcon
                iconData={showPassword ? EyeOffData : EyeData}
                aria-hidden="true"
                size={18}
              />
            </ButtonControl>
          </HStack>
        </Field>

        {!isSignUp ? (
          <Link
            href="/reset-password"
            className="inline-flex min-h-11 items-center self-end justify-self-end font-medium text-primary hover:underline focus-visible:outline-accent!"
          >
            Forgot password?
          </Link>
        ) : null}
        {isSignUp ? (
          <Text as="p" color="secondary" id="auth-password-help">
            Use 8 or more characters. A unique password keeps your rooms safer.
          </Text>
        ) : null}

        {errorMessage ? (
          <Text
            as="p"
            role="alert"
            className="text-primary! bg-error-muted p-3 rounded-2xl"
          >
            {errorMessage}
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
          {isSignUp ? "Already a member?" : "Not a member?"}{" "}
          <Link
            className="inline-flex min-h-11 items-center text-accent hover:underline focus-visible:outline-accent!"
            href={`${isSignUp ? "/login" : "/signup"}${
              nextPath === "/rooms"
                ? ""
                : `?next=${encodeURIComponent(nextPath)}`
            }`}
          >
            {isSignUp ? "Sign in" : "Register now"}
          </Link>
        </Text>
      </FormLayout>
    </form>
  );
}

"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import {
  buildConfirmUrl,
  configuredSiteUrl,
  safeNextPath,
} from "@/lib/auth/redirects";
import { createServerAuthClient } from "@/lib/supabase/server";

export interface AuthActionState {
  message: string;
  status: "idle" | "error" | "success";
}

function readCredentials(formData: FormData): {
  email: string;
  password: string;
} | null {
  const email = formData.get("email");
  const password = formData.get("password");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.includes("@") ||
    password.length < 8
  ) {
    return null;
  }

  return { email: email.trim().toLowerCase(), password };
}

function readNextPath(formData: FormData): string {
  return safeNextPath(formData.get("next"));
}

function confirmRedirectUrl(formData: FormData): string {
  return buildConfirmUrl(configuredSiteUrl(), readNextPath(formData));
}

function logAuthError(action: string, error: AuthError): void {
  console.error(`[qollab:auth] ${action} failed`, {
    code: error.code,
    status: error.status,
  });
}

function signInErrorMessage(error: AuthError): string {
  if (error.code === "invalid_credentials") {
    return "We could not sign you in with those credentials.";
  }

  return error.status === 429
    ? "Too many sign-in attempts. Wait a few minutes, then try again."
    : "We could not sign you in right now. Please try again shortly.";
}

function signUpErrorMessage(error: AuthError): string {
  if (error.status === 429) {
    return "Too many confirmation emails were sent. Wait a few minutes, then try again.";
  }

  switch (error.code) {
    case "weak_password":
      return "Choose a stronger password.";
    case "email_address_invalid":
    case "email_exists":
    case "user_already_exists":
      return "We could not create that account. Try another email address.";
    default:
      return "We could not create that account right now. Please try again shortly.";
  }
}

function readDisplayName(formData: FormData): string | null {
  const displayName = formData.get("displayName");

  if (typeof displayName !== "string") {
    return null;
  }

  const normalized = displayName.trim();
  return normalized.length >= 1 && normalized.length <= 60 ? normalized : null;
}

export async function signIn(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);

  if (!credentials) {
    return {
      message: "Enter a valid email and a password with at least 8 characters.",
      status: "error",
    };
  }

  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  // Supabase checks the password first, so only the account holder reaches this.
  if (error?.code === "email_not_confirmed") {
    const { error: resendError } = await supabase.auth.resend({
      email: credentials.email,
      options: { emailRedirectTo: confirmRedirectUrl(formData) },
      type: "signup",
    });

    if (resendError) logAuthError("confirmation resend", resendError);

    return {
      message: !resendError
        ? "Confirm your email first. We sent you a new link."
        : resendError.status === 429
          ? "Confirm your email first. Check your inbox and spam folder for the link, or try again in a few minutes to get a new one."
          : "Confirm your email first. A new link could not be sent right now. Please try again shortly.",
      status: "error",
    };
  }

  if (error) {
    if (error.code !== "invalid_credentials") logAuthError("sign in", error);
    return { message: signInErrorMessage(error), status: "error" };
  }

  redirect(readNextPath(formData));
}

export async function signUp(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = readCredentials(formData);
  const displayName = readDisplayName(formData);

  if (!credentials || !displayName) {
    return {
      message:
        "Enter a display name, a valid email, and a password with at least 8 characters.",
      status: "error",
    };
  }

  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.signUp({
    ...credentials,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: confirmRedirectUrl(formData),
    },
  });

  if (error) {
    logAuthError("sign up", error);
    return { message: signUpErrorMessage(error), status: "error" };
  }

  if (data.session) {
    redirect(readNextPath(formData));
  }

  return {
    message: "Check your email to confirm your Qollab account.",
    status: "success",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}

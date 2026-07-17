"use server";

import { redirect } from "next/navigation";

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
  const nextPath = formData.get("next");

  if (
    typeof nextPath === "string" &&
    nextPath.startsWith("/") &&
    !nextPath.startsWith("//")
  ) {
    return nextPath;
  }

  return "/rooms";
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

  if (error) {
    return {
      message: "We could not sign you in with those credentials.",
      status: "error",
    };
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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/confirm?next=${encodeURIComponent(readNextPath(formData))}`,
    },
  });

  if (error) {
    return {
      message: "We could not create that account. Try another email address.",
      status: "error",
    };
  }

  if (data.session) {
    redirect(readNextPath(formData));
  }

  return {
    message: "Check your email to confirm your BoardPrep account.",
    status: "success",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/login");
}

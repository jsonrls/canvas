"use server";

import { redirect } from "next/navigation";

import {
  buildRecoveryRedirectUrl,
  normalizeResetEmail,
  type PasswordResetActionState,
  readNewPassword,
} from "@/lib/auth/password-reset";
import { createServerAuthClient } from "@/lib/supabase/server";

function recoveryRedirectUrl(): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  return buildRecoveryRedirectUrl(siteUrl);
}

export async function requestPasswordReset(
  _state: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const email = normalizeResetEmail(formData.get("email"));

  if (!email) {
    return {
      message: "Enter the email address used for your BoardPrep account.",
      status: "error",
    };
  }

  try {
    const supabase = await createServerAuthClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: recoveryRedirectUrl(),
    });

    if (error) {
      return {
        message:
          error.status === 429
            ? "Too many reset requests were sent. Wait a few minutes, then try again."
            : "A reset email could not be sent right now. Please try again shortly.",
        status: "error",
      };
    }
  } catch {
    return {
      message:
        "A reset email could not be sent right now. Please try again shortly.",
      status: "error",
    };
  }

  return {
    message:
      "If a BoardPrep account uses that email, a secure reset link is on its way.",
    status: "success",
  };
}

export async function updatePassword(
  _state: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const result = readNewPassword(
    formData.get("password"),
    formData.get("passwordConfirmation"),
  );

  if (result.password === null) {
    return { message: result.error, status: "error" };
  }

  const supabase = await createServerAuthClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || typeof claimsData?.claims.sub !== "string") {
    return {
      message:
        "This reset session is invalid or expired. Request a new reset link.",
      status: "error",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: result.password,
  });

  if (error) {
    return {
      message:
        "Your password could not be updated. Request a new link if this one has expired.",
      status: "error",
    };
  }

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}

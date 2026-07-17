export interface PasswordResetActionState {
  message: string;
  status: "idle" | "error" | "success";
}

export const INITIAL_PASSWORD_RESET_STATE: PasswordResetActionState = {
  message: "",
  status: "idle",
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export function normalizeResetEmail(
  value: FormDataEntryValue | null,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized.length < 3 ||
    normalized.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized)
  ) {
    return null;
  }

  return normalized;
}

export function readNewPassword(
  passwordValue: FormDataEntryValue | null,
  confirmationValue: FormDataEntryValue | null,
): { error: string; password: null } | { error: null; password: string } {
  if (
    typeof passwordValue !== "string" ||
    passwordValue.length < PASSWORD_MIN_LENGTH ||
    passwordValue.length > PASSWORD_MAX_LENGTH
  ) {
    return {
      error: `Use between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters for your new password.`,
      password: null,
    };
  }

  if (passwordValue !== confirmationValue) {
    return {
      error: "The password confirmation does not match.",
      password: null,
    };
  }

  return { error: null, password: passwordValue };
}

export function buildRecoveryRedirectUrl(siteUrl: string): string {
  const redirectUrl = new URL(siteUrl);

  if (redirectUrl.protocol !== "http:" && redirectUrl.protocol !== "https:") {
    throw new Error("The configured site URL must use HTTP or HTTPS.");
  }

  redirectUrl.pathname = "/auth/confirm";
  redirectUrl.search = "";
  redirectUrl.hash = "";
  redirectUrl.searchParams.set("next", "/reset-password/update");
  return redirectUrl.toString();
}

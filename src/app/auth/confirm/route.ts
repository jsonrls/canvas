import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createServerAuthClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/rooms/demo";
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.clone();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextPath = safeNextPath(url.searchParams.get("next"));
  const isPasswordRecovery =
    type === "recovery" || nextPath === "/reset-password/update";
  const supabase = await createServerAuthClient();

  let error: Error | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    }));
  } else {
    error = new Error("Missing authentication confirmation parameters.");
  }

  url.search = "";
  url.pathname = error
    ? isPasswordRecovery
      ? "/reset-password"
      : "/login"
    : nextPath;

  if (error) {
    url.searchParams.set(
      "error",
      isPasswordRecovery ? "invalid_or_expired" : "confirmation_failed",
    );
  }

  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

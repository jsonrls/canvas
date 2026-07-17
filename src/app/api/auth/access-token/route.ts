import { NextResponse } from "next/server";

import { getAuthenticatedContext } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return NextResponse.json(
      { error: "Authentication required." },
      {
        headers: { "Cache-Control": "private, no-store" },
        status: 401,
      },
    );
  }

  return NextResponse.json(
    { accessToken: context.accessToken },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

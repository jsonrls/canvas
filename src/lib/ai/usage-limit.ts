import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/server";

type AiFeature = "study-pack" | "whiteboard-answer";

const WINDOW_SECONDS = 10 * 60;
const LIMITS: Record<AiFeature, { window: number; day: number }> = {
  "study-pack": { window: 5, day: 20 },
  "whiteboard-answer": { window: 12, day: 60 },
};
/** All AI requests by everyone in 24 hours; caps the bill if accounts are scripted. */
const APP_DAY_LIMIT = 500;

/** Seconds to wait, or null when the request may go ahead. */
export async function consumeSharedAiAllowance(
  userId: string,
  feature: AiFeature,
): Promise<number | null> {
  const { window, day } = LIMITS[feature];
  const { data, error } = await createServiceRoleClient().rpc(
    "consume_ai_allowance",
    {
      input_user_id: userId,
      input_feature: feature,
      input_window_seconds: WINDOW_SECONDS,
      input_window_limit: window,
      input_day_limit: day,
      input_app_day_limit: APP_DAY_LIMIT,
    },
  );

  if (error) {
    // Fails open: the caller's per-instance limit still applies.
    console.error("[qollab:ai-usage] shared limit unavailable", {
      code: error.code,
    });
    return null;
  }

  return typeof data === "number" && data > 0 ? data : null;
}

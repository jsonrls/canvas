"use server";

import { revalidatePath } from "next/cache";

import type { ProfileActionState } from "@/app/profile/action-state";
import {
  normalizeProfileDisplayName,
  ProfileDomainError,
} from "@/lib/profiles/model";
import { updateProfileDisplayName } from "@/lib/profiles/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export async function updateProfileAction(
  _state: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      throw new ProfileDomainError(
        "Your session expired. Sign in again before saving your profile.",
      );
    }

    const displayName = normalizeProfileDisplayName(
      formData.get("displayName"),
    );
    await updateProfileDisplayName(context.client, context.userId, displayName);

    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/rooms");

    return {
      message: "Your profile name is up to date.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof ProfileDomainError
          ? error.message
          : "Your profile could not be saved. Try again.",
      status: "error",
    };
  }
}

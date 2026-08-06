"use server";

import { revalidatePath } from "next/cache";

import {
  getRoomMemberAccess,
  updateViewerCollaboration,
} from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";
import {
  insertVersion,
  prepareVersionRestore,
} from "@/lib/version-history/repository";
import type {
  EditorSnapshot,
  RestorableVersion,
  VersionActionResult,
  VersionSummary,
} from "@/lib/version-history/types";

function safeErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Version history is temporarily unavailable.";
}

export async function updateViewerCollaborationAction(
  roomSlug: string,
  enabled: boolean,
): Promise<{ enabled: boolean; error: string | null }> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return {
      enabled: !enabled,
      error: "Sign in again to change viewer collaboration.",
    };
  }

  try {
    const access = await getRoomMemberAccess(
      context.client,
      roomSlug,
      context.userId,
    );
    const updated = await updateViewerCollaboration(
      context.client,
      access.id,
      enabled,
    );
    revalidatePath(`/rooms/${roomSlug}`);
    revalidatePath(`/rooms/${roomSlug}/breakouts`);
    return { enabled: updated, error: null };
  } catch (error) {
    return { enabled: !enabled, error: safeErrorMessage(error) };
  }
}

export async function createVersionAction(
  roomSlug: string,
  label: string,
  snapshot: EditorSnapshot,
): Promise<VersionActionResult<VersionSummary>> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return { data: null, error: "Sign in again to save a version." };
  }

  try {
    const version = await insertVersion(
      context.client,
      roomSlug,
      context.userId,
      label,
      snapshot,
    );
    revalidatePath(`/rooms/${roomSlug}`);
    return { data: version, error: null };
  } catch (error) {
    return { data: null, error: safeErrorMessage(error) };
  }
}

export async function restoreVersionAction(
  roomSlug: string,
  versionId: string,
  currentSnapshot: EditorSnapshot,
): Promise<VersionActionResult<RestorableVersion>> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return { data: null, error: "Sign in again to restore a version." };
  }

  try {
    const version = await prepareVersionRestore(
      context.client,
      roomSlug,
      versionId,
      context.userId,
      currentSnapshot,
    );
    revalidatePath(`/rooms/${roomSlug}`);
    return { data: version, error: null };
  } catch (error) {
    return { data: null, error: safeErrorMessage(error) };
  }
}

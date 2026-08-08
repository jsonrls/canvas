import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { ProfileDomainError } from "@/lib/profiles/model";

interface ProfileRow {
  avatar_path: string | null;
  display_name: string;
  id: string;
}

export interface Profile {
  avatarPath: string | null;
  displayName: string;
  id: string;
}

export async function getProfile(
  client: SupabaseClient,
  userId: string,
): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .select("id, display_name, avatar_path")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error("Your profile could not be loaded.");
  }

  const profile = data as ProfileRow;

  return {
    avatarPath: profile.avatar_path,
    displayName: profile.display_name,
    id: profile.id,
  };
}

export async function getProfileDisplayNames(
  client: SupabaseClient,
  userIds: string[],
): Promise<Map<string, string>> {
  const uniqueUserIds = [...new Set(userIds)];

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client
    .from("profiles")
    .select("id, display_name")
    .in("id", uniqueUserIds);

  if (error) {
    throw new Error("Collaborator profiles could not be loaded.");
  }

  return new Map(
    (data ?? []).map((profile) => [profile.id, profile.display_name]),
  );
}

export async function updateProfileDisplayName(
  client: SupabaseClient,
  userId: string,
  displayName: string,
): Promise<Profile> {
  const { data, error } = await client
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId)
    .select("id, display_name, avatar_path")
    .single();

  if (error || !data) {
    throw new ProfileDomainError(
      "Your profile could not be saved. Check your connection and try again.",
    );
  }

  const profile = data as ProfileRow;

  return {
    avatarPath: profile.avatar_path,
    displayName: profile.display_name,
    id: profile.id,
  };
}

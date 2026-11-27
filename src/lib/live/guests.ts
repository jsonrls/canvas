import "server-only";

import { createHash, randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { LiveInputError } from "@/lib/live/activities";
import { GUEST_CODE_PATTERN, LiveConflictError } from "@/lib/live/repository";

/**
 * People without an account answer a main room's live activities from the
 * guest link. The cookie holds a random token; the database keeps its hash.
 */
export const GUEST_COOKIE = "qollab_live_guest";
export const GUEST_COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;
export const MAX_GUESTS_PER_ROOM = 500;
export const GUEST_NAME_MAX = 40;

/** The link was turned off, replaced, or never existed. */
export class LiveGuestLinkError extends Error {}

export function readGuestCode(value: unknown): string {
  if (typeof value !== "string" || !GUEST_CODE_PATTERN.test(value)) {
    throw new LiveGuestLinkError();
  }
  return value;
}

export function hashGuestToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function readGuestName(value: unknown): string {
  const name =
    typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (name.length < 1 || name.length > GUEST_NAME_MAX) {
    throw new LiveInputError(`Enter a name of 1–${GUEST_NAME_MAX} characters.`);
  }
  return name;
}

/** Cookie path, so each room's link keeps its own guest. */
export function guestCookiePath(code: string): string {
  return `/live/${code}`;
}

export async function findGuestRoom(
  admin: SupabaseClient,
  code: string,
): Promise<{ roomId: string; roomName: string } | null> {
  const { data, error } = await admin
    .from("live_sessions")
    .select("room_id, rooms(name)")
    .eq("guest_code", code)
    .maybeSingle<{ room_id: string; rooms: { name: string } | null }>();
  if (error) throw new Error("LIVE_GUEST_LINK_LOAD_FAILED");
  if (!data) return null;
  return {
    roomId: data.room_id,
    roomName: data.rooms?.name ?? "Live activity",
  };
}

export async function loadGuest(
  admin: SupabaseClient,
  roomId: string,
  token: string | undefined,
): Promise<{ id: string; name: string } | null> {
  if (!token || token.length > 128) return null;
  const { data, error } = await admin
    .from("live_guests")
    .select("id, display_name")
    .eq("token_hash", hashGuestToken(token))
    .eq("room_id", roomId)
    .maybeSingle();
  if (error) throw new Error("LIVE_GUEST_LOAD_FAILED");
  return data ? { id: String(data.id), name: String(data.display_name) } : null;
}

export async function createGuest(
  admin: SupabaseClient,
  roomId: string,
  name: string,
): Promise<{ id: string; token: string }> {
  const { count, error: countError } = await admin
    .from("live_guests")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);
  if (countError) throw new Error("LIVE_GUEST_LOAD_FAILED");
  if ((count ?? 0) >= MAX_GUESTS_PER_ROOM) {
    throw new LiveConflictError(
      "This activity is full. Ask the host for help.",
    );
  }
  const token = randomBytes(32).toString("base64url");
  const { data, error } = await admin
    .from("live_guests")
    .insert({
      room_id: roomId,
      token_hash: hashGuestToken(token),
      display_name: name,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("LIVE_GUEST_CREATE_FAILED");
  return { id: String(data.id), token };
}

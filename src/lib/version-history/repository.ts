import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  EditorSnapshot,
  RestorableVersion,
  VersionSummary,
} from "@/lib/version-history/types";
import { getProfileDisplayNames } from "@/lib/profiles/repository";

const ROOM_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
const VERSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64_PATTERN =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const MAX_CONTENT_BYTES = 2 * 1024 * 1024;
const MAX_YJS_BASE64_LENGTH = 24 * 1024 * 1024;

interface RoomDocument {
  documentId: string;
  roomId: string;
}

interface VersionRow {
  created_at: string;
  created_by: string;
  id: string;
  label: string;
}

export function assertRoomSlug(roomSlug: string): void {
  if (!ROOM_ID_PATTERN.test(roomSlug)) {
    throw new Error("Invalid room identifier.");
  }
}

function validateSnapshot(snapshot: EditorSnapshot): void {
  if (
    typeof snapshot.content !== "object" ||
    snapshot.content === null ||
    Array.isArray(snapshot.content)
  ) {
    throw new Error("The editor snapshot is invalid.");
  }

  const contentSize = Buffer.byteLength(JSON.stringify(snapshot.content));

  if (contentSize === 0 || contentSize > MAX_CONTENT_BYTES) {
    throw new Error("The editor snapshot is too large.");
  }

  if (
    snapshot.yjsState.length === 0 ||
    snapshot.yjsState.length > MAX_YJS_BASE64_LENGTH ||
    !BASE64_PATTERN.test(snapshot.yjsState)
  ) {
    throw new Error("The collaborative document state is invalid.");
  }
}

function validateLabel(label: string): string {
  const normalized = label.trim();

  if (normalized.length < 1 || normalized.length > 80) {
    throw new Error("Version names must be between 1 and 80 characters.");
  }

  return normalized;
}

async function findRoomDocument(
  client: SupabaseClient,
  roomSlug: string,
): Promise<RoomDocument> {
  assertRoomSlug(roomSlug);

  const { data: room, error: roomError } = await client
    .from("rooms")
    .select("id")
    .eq("slug", roomSlug)
    .single();

  if (roomError || !room) {
    throw new Error("You do not have access to that room.");
  }

  const { data: document, error: documentError } = await client
    .from("documents")
    .select("id")
    .eq("room_id", room.id)
    .eq("kind", "notes")
    .single();

  if (documentError || !document) {
    throw new Error("The shared notes document is unavailable.");
  }

  return { documentId: document.id, roomId: room.id };
}

export async function listVersions(
  client: SupabaseClient,
  roomSlug: string,
): Promise<VersionSummary[]> {
  const { documentId } = await findRoomDocument(client, roomSlug);
  const { data, error } = await client
    .from("document_versions")
    .select("id, label, created_by, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error("Version history could not be loaded.");
  }

  const versions = (data ?? []) as VersionRow[];
  const displayNames = await getProfileDisplayNames(
    client,
    versions.map((version) => version.created_by),
  );

  return versions.map((version) => ({
    createdAt: version.created_at,
    createdBy: version.created_by,
    createdByName: displayNames.get(version.created_by) ?? "Former member",
    id: version.id,
    label: version.label,
  }));
}

export async function insertVersion(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
  label: string,
  snapshot: EditorSnapshot,
): Promise<VersionSummary> {
  const normalizedLabel = validateLabel(label);
  validateSnapshot(snapshot);
  const { documentId } = await findRoomDocument(client, roomSlug);
  const { data, error } = await client
    .from("document_versions")
    .insert({
      content: snapshot.content,
      created_by: userId,
      document_id: documentId,
      label: normalizedLabel,
      yjs_state: snapshot.yjsState,
    })
    .select("id, label, created_by, created_at")
    .single();

  if (error || !data) {
    throw new Error("The version could not be saved.");
  }

  const displayNames = await getProfileDisplayNames(client, [data.created_by]);

  return {
    createdAt: data.created_at,
    createdBy: data.created_by,
    createdByName: displayNames.get(data.created_by) ?? "Study partner",
    id: data.id,
    label: data.label,
  };
}

export async function prepareVersionRestore(
  client: SupabaseClient,
  roomSlug: string,
  versionId: string,
  userId: string,
  currentSnapshot: EditorSnapshot,
): Promise<RestorableVersion> {
  if (!VERSION_ID_PATTERN.test(versionId)) {
    throw new Error("Invalid version identifier.");
  }

  validateSnapshot(currentSnapshot);
  const { documentId } = await findRoomDocument(client, roomSlug);
  const { data: target, error: targetError } = await client
    .from("document_versions")
    .select("label, content")
    .eq("id", versionId)
    .eq("document_id", documentId)
    .single();

  if (targetError || !target) {
    throw new Error("That version is no longer available.");
  }

  await insertVersion(
    client,
    roomSlug,
    userId,
    `Before restoring ${target.label}`.slice(0, 80),
    currentSnapshot,
  );

  if (
    typeof target.content !== "object" ||
    target.content === null ||
    Array.isArray(target.content)
  ) {
    throw new Error("That version contains invalid editor content.");
  }

  return {
    content: target.content as Record<string, unknown>,
    label: target.label,
  };
}

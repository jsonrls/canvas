import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getProfileDisplayNames } from "@/lib/profiles/repository";
import { PDF_BUCKET } from "@/lib/pdf-assets/validation";

const ROOM_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
const USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RoomRole = "owner" | "editor" | "viewer";
export type AssignableRoomRole = Exclude<RoomRole, "owner">;

interface RoomRow {
  id: string;
  is_public: boolean;
  name: string;
  owner_id: string;
  slug: string;
  updated_at: string;
}

interface MembershipRow {
  joined_at?: string;
  role: RoomRole;
  room_id: string;
  user_id?: string;
}

export type RoomDocumentKind = "notes" | "pdf" | "whiteboard";

interface RoomDocumentRow {
  kind: RoomDocumentKind;
  pdf_asset_revision: string | null;
  pdf_file_name: string | null;
  pdf_file_size: number | null;
  pdf_storage_path: string | null;
  yjs_state: string | null;
}

export interface RoomPdfAsset {
  fileName: string;
  revision: string;
  signedUrl: string;
  size: number;
  storagePath: string;
}

export interface RoomSummary {
  id: string;
  isPublic: boolean;
  name: string;
  role: RoomRole | null;
  slug: string;
  updatedAt: string;
}

export interface RoomDirectory {
  joinedRooms: RoomSummary[];
  publicRooms: RoomSummary[];
}

export interface RoomWorkspace {
  id: string;
  initialDocumentState: string | null;
  initialDocumentStates: Record<RoomDocumentKind, string | null>;
  isPublic: boolean;
  joinedRooms: Array<{ name: string; slug: string }>;
  name: string;
  ownerId: string;
  pdfAsset: RoomPdfAsset | null;
  role: RoomRole;
  slug: string;
}

export interface RoomToolAccess {
  id: string;
  pdfStoragePath: string | null;
  role: RoomRole;
  slug: string;
}

export type RoomMemberAccess = Omit<RoomToolAccess, "pdfStoragePath">;

export interface RoomMember {
  displayName: string;
  joinedAt: string;
  role: RoomRole;
  userId: string;
}

export interface RoomSettings extends RoomWorkspace {
  members: RoomMember[];
}

export class RoomDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomDomainError";
  }
}

export function assertRoomSlug(roomSlug: string): void {
  if (!ROOM_SLUG_PATTERN.test(roomSlug)) {
    throw new RoomDomainError("That room address is invalid.");
  }
}

export function normalizeRoomName(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    throw new RoomDomainError("Enter a room name.");
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < 1 || normalized.length > 120) {
    throw new RoomDomainError(
      "Room names must be between 1 and 120 characters.",
    );
  }

  return normalized;
}

export function normalizeMemberEmail(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    throw new RoomDomainError("Enter a valid BoardPrep account email.");
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized.length < 3 ||
    normalized.length > 320 ||
    !normalized.includes("@")
  ) {
    throw new RoomDomainError("Enter a valid BoardPrep account email.");
  }

  return normalized;
}

export function normalizeAssignableRole(
  value: FormDataEntryValue | null,
): AssignableRoomRole {
  if (value === "editor" || value === "viewer") {
    return value;
  }

  throw new RoomDomainError(
    "Collaborators must be assigned as an editor or viewer.",
  );
}

function assertUserId(userId: string): void {
  if (!USER_ID_PATTERN.test(userId)) {
    throw new RoomDomainError("That collaborator identifier is invalid.");
  }
}

function toRoomSummary(room: RoomRow, role: RoomRole | null): RoomSummary {
  return {
    id: room.id,
    isPublic: room.is_public,
    name: room.name,
    role,
    slug: room.slug,
    updatedAt: room.updated_at,
  };
}

async function findRoom(
  client: SupabaseClient,
  roomSlug: string,
): Promise<RoomRow> {
  assertRoomSlug(roomSlug);
  const { data, error } = await client
    .from("rooms")
    .select("id, slug, name, owner_id, is_public, updated_at")
    .eq("slug", roomSlug)
    .maybeSingle();

  if (error || !data) {
    throw new RoomDomainError("You do not have access to that room.");
  }

  return data as RoomRow;
}

async function findMembership(
  client: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<MembershipRow | null> {
  const { data, error } = await client
    .from("room_members")
    .select("room_id, role")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new RoomDomainError("Room membership could not be verified.");
  }

  return (data as MembershipRow | null) ?? null;
}

export async function listRoomDirectory(
  client: SupabaseClient,
  userId: string,
): Promise<RoomDirectory> {
  const [roomsResult, membershipsResult] = await Promise.all([
    client
      .from("rooms")
      .select("id, slug, name, owner_id, is_public, updated_at")
      .order("updated_at", { ascending: false })
      .limit(100),
    client.from("room_members").select("room_id, role").eq("user_id", userId),
  ]);

  if (roomsResult.error || membershipsResult.error) {
    throw new RoomDomainError("Your rooms could not be loaded.");
  }

  const memberships = new Map(
    ((membershipsResult.data ?? []) as MembershipRow[]).map((membership) => [
      membership.room_id,
      membership.role,
    ]),
  );
  const joinedRooms: RoomSummary[] = [];
  const publicRooms: RoomSummary[] = [];

  for (const room of (roomsResult.data ?? []) as RoomRow[]) {
    const role =
      memberships.get(room.id) ?? (room.owner_id === userId ? "owner" : null);
    const summary = toRoomSummary(room, role);

    if (role) {
      joinedRooms.push(summary);
    } else if (room.is_public) {
      publicRooms.push(summary);
    }
  }

  return { joinedRooms, publicRooms };
}

export async function getRoomWorkspace(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<RoomWorkspace> {
  const room = await findRoom(client, roomSlug);
  const [membership, directory, documentsResult] = await Promise.all([
    findMembership(client, room.id, userId),
    listRoomDirectory(client, userId),
    client
      .from("documents")
      .select(
        "kind, yjs_state, pdf_storage_path, pdf_file_name, pdf_file_size, pdf_asset_revision",
      )
      .eq("room_id", room.id),
  ]);

  if (!membership) {
    throw new RoomDomainError(
      "Join this public room from your room home before opening it.",
    );
  }

  if (documentsResult.error) {
    throw new RoomDomainError("The room study tools could not be loaded.");
  }

  const documents = new Map<RoomDocumentKind, RoomDocumentRow>(
    ((documentsResult.data ?? []) as RoomDocumentRow[]).map((document) => [
      document.kind,
      document,
    ]),
  );
  const notesDocument = documents.get("notes");
  const pdfDocument = documents.get("pdf");
  const whiteboardDocument = documents.get("whiteboard");

  if (!notesDocument || !pdfDocument || !whiteboardDocument) {
    throw new RoomDomainError("The room study tools are incomplete.");
  }

  const initialDocumentStates: Record<RoomDocumentKind, string | null> = {
    notes: null,
    pdf: null,
    whiteboard: null,
  };

  if (membership.role === "viewer") {
    initialDocumentStates.notes = notesDocument.yjs_state;
    initialDocumentStates.pdf = pdfDocument.yjs_state;
    initialDocumentStates.whiteboard = whiteboardDocument.yjs_state;
  }

  let pdfAsset: RoomPdfAsset | null = null;

  if (
    pdfDocument.pdf_storage_path &&
    pdfDocument.pdf_file_name &&
    typeof pdfDocument.pdf_file_size === "number" &&
    pdfDocument.pdf_asset_revision
  ) {
    const { data: signedPdf, error: signedPdfError } = await client.storage
      .from(PDF_BUCKET)
      .createSignedUrl(pdfDocument.pdf_storage_path, 10 * 60);

    if (signedPdfError || !signedPdf.signedUrl) {
      throw new RoomDomainError("The shared PDF could not be opened.");
    }

    pdfAsset = {
      fileName: pdfDocument.pdf_file_name,
      revision: pdfDocument.pdf_asset_revision,
      signedUrl: signedPdf.signedUrl,
      size: pdfDocument.pdf_file_size,
      storagePath: pdfDocument.pdf_storage_path,
    };
  }

  return {
    id: room.id,
    initialDocumentState: initialDocumentStates.notes,
    initialDocumentStates,
    isPublic: room.is_public,
    joinedRooms: directory.joinedRooms.map(({ name, slug }) => ({
      name,
      slug,
    })),
    name: room.name,
    ownerId: room.owner_id,
    pdfAsset,
    role: membership.role,
    slug: room.slug,
  };
}

export async function getRoomToolAccess(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<RoomToolAccess> {
  const room = await findRoom(client, roomSlug);
  const [membership, pdfResult] = await Promise.all([
    findMembership(client, room.id, userId),
    client
      .from("documents")
      .select("pdf_storage_path")
      .eq("room_id", room.id)
      .eq("kind", "pdf")
      .single(),
  ]);

  if (!membership || pdfResult.error || !pdfResult.data) {
    throw new RoomDomainError("The room PDF is unavailable.");
  }

  return {
    id: room.id,
    pdfStoragePath:
      typeof pdfResult.data.pdf_storage_path === "string"
        ? pdfResult.data.pdf_storage_path
        : null,
    role: membership.role,
    slug: room.slug,
  };
}

export async function getRoomMemberAccess(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<RoomMemberAccess> {
  const room = await findRoom(client, roomSlug);
  const membership = await findMembership(client, room.id, userId);

  if (!membership) {
    throw new RoomDomainError("You do not have access to that room.");
  }

  return {
    id: room.id,
    role: membership.role,
    slug: room.slug,
  };
}

export async function getRoomSettings(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<RoomSettings> {
  const workspace = await getRoomWorkspace(client, roomSlug, userId);

  if (workspace.role !== "owner" || workspace.ownerId !== userId) {
    throw new RoomDomainError("Only the room owner can manage this room.");
  }

  const { data, error } = await client
    .from("room_members")
    .select("room_id, user_id, role, joined_at")
    .eq("room_id", workspace.id)
    .order("joined_at", { ascending: true });

  if (error) {
    throw new RoomDomainError("Room collaborators could not be loaded.");
  }

  const memberships = (data ?? []) as Required<MembershipRow>[];
  const displayNames = await getProfileDisplayNames(
    client,
    memberships.map((membership) => membership.user_id),
  );
  const members = memberships
    .map((membership) => ({
      displayName:
        displayNames.get(membership.user_id) ?? "Former study partner",
      joinedAt: membership.joined_at,
      role: membership.role,
      userId: membership.user_id,
    }))
    .sort((first, second) => {
      if (first.role === "owner") return -1;
      if (second.role === "owner") return 1;
      return first.displayName.localeCompare(second.displayName);
    });

  return { ...workspace, members };
}

export async function createRoom(
  client: SupabaseClient,
  name: string,
  isPublic: boolean,
): Promise<{ id: string; slug: string }> {
  const { data, error } = await client.rpc("create_study_room", {
    input_is_public: isPublic,
    input_name: name,
  });
  const created = Array.isArray(data) ? data[0] : data;

  if (
    error ||
    !created ||
    typeof created.room_id !== "string" ||
    typeof created.room_slug !== "string"
  ) {
    throw new RoomDomainError("The room could not be created. Try again.");
  }

  return { id: created.room_id, slug: created.room_slug };
}

export async function joinPublicRoom(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<void> {
  const room = await findRoom(client, roomSlug);

  if (!room.is_public) {
    throw new RoomDomainError("That room is private.");
  }

  if (await findMembership(client, room.id, userId)) {
    return;
  }

  const { data, error } = await client.rpc("join_public_room", {
    input_room_id: room.id,
  });
  const joined = Array.isArray(data) ? data[0] : data;

  if (
    error ||
    joined?.joined_room_id !== room.id ||
    joined.joined_role !== "editor"
  ) {
    throw new RoomDomainError("You could not join that room.");
  }
}

export async function leaveRoom(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<void> {
  const room = await findRoom(client, roomSlug);

  if (room.owner_id === userId) {
    throw new RoomDomainError(
      "Room owners cannot leave. Delete the room from settings instead.",
    );
  }

  const { data, error } = await client
    .from("room_members")
    .delete()
    .eq("room_id", room.id)
    .eq("user_id", userId)
    .select("user_id");

  if (error || data?.length !== 1) {
    throw new RoomDomainError("The room could not be left.");
  }
}

export async function updateRoom(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
  name: string,
  isPublic: boolean,
): Promise<void> {
  const { data, error } = await client
    .from("rooms")
    .update({ is_public: isPublic, name })
    .eq("slug", roomSlug)
    .eq("owner_id", userId)
    .select("id");

  if (error || data?.length !== 1) {
    throw new RoomDomainError("Room settings could not be saved.");
  }
}

export async function addRoomMember(
  client: SupabaseClient,
  roomId: string,
  email: string,
  role: AssignableRoomRole,
): Promise<string> {
  const { data, error } = await client.rpc("add_room_member_by_email", {
    input_email: email,
    input_role: role,
    input_room_id: roomId,
  });
  const member = Array.isArray(data) ? data[0] : data;

  if (error) {
    const allowedMessages = [
      "No BoardPrep account matches that email.",
      "That account is already a room member.",
      "The room owner is already a member.",
      "Only the room owner can add collaborators.",
    ];
    const matched = allowedMessages.find((message) =>
      error.message.includes(message),
    );
    throw new RoomDomainError(
      matched ?? "That collaborator could not be added.",
    );
  }

  if (!member || typeof member.member_display_name !== "string") {
    throw new RoomDomainError("That collaborator could not be added.");
  }

  return member.member_display_name;
}

export async function changeRoomMemberRole(
  client: SupabaseClient,
  roomId: string,
  memberUserId: string,
  role: AssignableRoomRole,
): Promise<void> {
  assertUserId(memberUserId);
  const { data, error } = await client
    .from("room_members")
    .update({ role })
    .eq("room_id", roomId)
    .eq("user_id", memberUserId)
    .select("user_id");

  if (error || data?.length !== 1) {
    throw new RoomDomainError("That collaborator role could not be changed.");
  }
}

export async function removeRoomMember(
  client: SupabaseClient,
  roomId: string,
  memberUserId: string,
): Promise<void> {
  assertUserId(memberUserId);
  const { data, error } = await client
    .from("room_members")
    .delete()
    .eq("room_id", roomId)
    .eq("user_id", memberUserId)
    .select("user_id");

  if (error || data?.length !== 1) {
    throw new RoomDomainError("That collaborator could not be removed.");
  }
}

export async function deleteRoom(
  client: SupabaseClient,
  roomSlug: string,
  userId: string,
): Promise<void> {
  const { data, error } = await client
    .from("rooms")
    .delete()
    .eq("slug", roomSlug)
    .eq("owner_id", userId)
    .select("id");

  if (error || data?.length !== 1) {
    throw new RoomDomainError("The room could not be deleted.");
  }
}

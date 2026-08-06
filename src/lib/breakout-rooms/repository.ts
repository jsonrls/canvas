import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getRoomMemberAccess,
  RoomDomainError,
  type RoomDocumentKind,
  type RoomPdfAsset,
  type RoomRole,
} from "@/lib/rooms/repository";
import { PDF_BUCKET } from "@/lib/pdf-assets/validation";

const BREAKOUT_CODE_PATTERN = /^[A-Z0-9]{8}$/;

interface BreakoutRoomRow {
  code: string;
  created_at: string;
  id: string;
  name: string;
  room_id: string;
}

interface BreakoutDocumentRow {
  id: string;
  kind: RoomDocumentKind;
  pdf_asset_revision: string | null;
  pdf_file_name: string | null;
  pdf_file_size: number | null;
  pdf_storage_path: string | null;
  yjs_state: string | null;
}

export interface BreakoutRoomSummary {
  code: string;
  createdAt: string;
  id: string;
  name: string;
}

export interface BreakoutRoomDirectoryItem {
  code?: string;
  createdAt: string;
  id: string;
  isJoined: boolean;
  name: string;
}

interface BreakoutRoomDirectoryRpcRow {
  breakout_room_code: string | null;
  breakout_room_created_at: string;
  breakout_room_id: string;
  breakout_room_name: string;
  is_joined: boolean;
}

export interface BreakoutRoomWorkspace extends BreakoutRoomSummary {
  initialDocumentState: string | null;
  initialDocumentStates: Record<RoomDocumentKind, string | null>;
  parentRoomId: string;
  parentRoomName: string;
  parentRoomSlug: string;
  pdfAsset: RoomPdfAsset | null;
  role: RoomRole;
  viewerCanCollaborate: boolean;
}

export interface BreakoutToolAccess {
  breakoutRoomId: string;
  code: string;
  parentRoomId: string;
  parentRoomSlug: string;
  pdfDocumentId: string;
  pdfStoragePath: string | null;
  role: RoomRole;
}

export function normalizeBreakoutRoomName(
  value: FormDataEntryValue | null,
): string {
  if (typeof value !== "string") {
    throw new RoomDomainError("Enter a breakout room name.");
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length < 1 || normalized.length > 80) {
    throw new RoomDomainError(
      "Breakout room names must be between 1 and 80 characters.",
    );
  }

  return normalized;
}

export function normalizeBreakoutRoomCode(
  value: FormDataEntryValue | string | null,
): string {
  if (typeof value !== "string") {
    throw new RoomDomainError("Enter an 8-character breakout room code.");
  }

  const normalized = value.trim().toUpperCase();

  if (!BREAKOUT_CODE_PATTERN.test(normalized)) {
    throw new RoomDomainError("Enter a valid 8-character breakout room code.");
  }

  return normalized;
}

function toSummary(row: BreakoutRoomRow): BreakoutRoomSummary {
  return {
    code: row.code,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
  };
}

export async function listBreakoutRooms(
  client: SupabaseClient,
  roomId: string,
): Promise<BreakoutRoomDirectoryItem[]> {
  const { data, error } = await client.rpc("list_breakout_room_directory", {
    input_room_id: roomId,
  });

  if (error) {
    throw new RoomDomainError("Breakout rooms could not be loaded.");
  }

  return ((data ?? []) as BreakoutRoomDirectoryRpcRow[]).map((row) => ({
    ...(row.breakout_room_code ? { code: row.breakout_room_code } : undefined),
    createdAt: row.breakout_room_created_at,
    id: row.breakout_room_id,
    isJoined: row.is_joined,
    name: row.breakout_room_name,
  }));
}

export async function countBreakoutRooms(
  client: SupabaseClient,
  roomId: string,
): Promise<number> {
  const { data, error } = await client.rpc("count_breakout_rooms", {
    input_room_id: roomId,
  });

  if (error) {
    throw new RoomDomainError("Breakout rooms could not be counted.");
  }

  const count = Number(data);

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RoomDomainError("Breakout rooms could not be counted.");
  }

  return count;
}

export async function joinBreakoutRoom(
  client: SupabaseClient,
  roomId: string,
  code: string,
): Promise<void> {
  const { data, error } = await client.rpc("join_breakout_room", {
    input_code: code,
    input_room_id: roomId,
  });
  const joined = Array.isArray(data) ? data[0] : data;

  if (
    error ||
    !joined ||
    typeof joined.breakout_room_id !== "string" ||
    joined.breakout_room_code !== code
  ) {
    throw new RoomDomainError(
      "That breakout room does not belong to this study room.",
    );
  }
}

export async function createBreakoutRoom(
  client: SupabaseClient,
  roomId: string,
  name: string,
): Promise<BreakoutRoomSummary> {
  const { data, error } = await client.rpc("create_breakout_room", {
    input_name: name,
    input_room_id: roomId,
  });
  const created = Array.isArray(data) ? data[0] : data;

  if (
    error ||
    !created ||
    typeof created.breakout_room_id !== "string" ||
    typeof created.breakout_room_code !== "string"
  ) {
    const message = error?.message.includes(
      "Only room owners and editors can create breakout rooms.",
    )
      ? "Only room owners and editors can create breakout rooms."
      : "The breakout room could not be created. Try again.";
    throw new RoomDomainError(message);
  }

  return {
    code: created.breakout_room_code,
    createdAt: new Date().toISOString(),
    id: created.breakout_room_id,
    name,
  };
}

export async function getBreakoutRoomWorkspace(
  client: SupabaseClient,
  parentRoomSlug: string,
  code: string,
  userId: string,
): Promise<BreakoutRoomWorkspace> {
  const normalizedCode = normalizeBreakoutRoomCode(code);
  const access = await getRoomMemberAccess(client, parentRoomSlug, userId);

  if (access.role === "viewer") {
    await joinBreakoutRoom(client, access.id, normalizedCode);
  }

  const [parentResult, breakoutResult] = await Promise.all([
    client
      .from("rooms")
      .select("name, viewer_can_collaborate")
      .eq("id", access.id)
      .single(),
    client
      .from("breakout_rooms")
      .select("id, room_id, name, code, created_at")
      .eq("room_id", access.id)
      .eq("code", normalizedCode)
      .maybeSingle(),
  ]);

  if (
    parentResult.error ||
    !parentResult.data ||
    breakoutResult.error ||
    !breakoutResult.data
  ) {
    throw new RoomDomainError(
      "That breakout room does not belong to this study room.",
    );
  }

  const row = breakoutResult.data as BreakoutRoomRow;
  const { data: documentsData, error: documentsError } = await client
    .from("breakout_documents")
    .select(
      "id, kind, yjs_state, pdf_storage_path, pdf_file_name, pdf_file_size, pdf_asset_revision",
    )
    .eq("breakout_room_id", row.id);

  if (documentsError) {
    throw new RoomDomainError("Breakout study tools could not be loaded.");
  }

  const documents = new Map<RoomDocumentKind, BreakoutDocumentRow>(
    ((documentsData ?? []) as BreakoutDocumentRow[]).map((document) => [
      document.kind,
      document,
    ]),
  );
  const notesDocument = documents.get("notes");
  const pdfDocument = documents.get("pdf");
  const whiteboardDocument = documents.get("whiteboard");

  if (!notesDocument || !pdfDocument || !whiteboardDocument) {
    throw new RoomDomainError("The breakout study tools are incomplete.");
  }

  const initialDocumentStates: Record<RoomDocumentKind, string | null> = {
    notes: notesDocument.yjs_state,
    pdf: pdfDocument.yjs_state,
    whiteboard: whiteboardDocument.yjs_state,
  };
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
      throw new RoomDomainError("The breakout PDF could not be opened.");
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
    ...toSummary(row),
    initialDocumentState: initialDocumentStates.notes,
    initialDocumentStates,
    parentRoomId: access.id,
    parentRoomName: parentResult.data.name,
    parentRoomSlug: access.slug,
    pdfAsset,
    role: access.role,
    viewerCanCollaborate: parentResult.data.viewer_can_collaborate,
  };
}

export async function getBreakoutToolAccess(
  client: SupabaseClient,
  parentRoomSlug: string,
  code: string,
  userId: string,
): Promise<BreakoutToolAccess> {
  const normalizedCode = normalizeBreakoutRoomCode(code);
  const access = await getRoomMemberAccess(client, parentRoomSlug, userId);

  if (access.role === "viewer") {
    await joinBreakoutRoom(client, access.id, normalizedCode);
  }

  const { data: breakout, error: breakoutError } = await client
    .from("breakout_rooms")
    .select("id, code")
    .eq("room_id", access.id)
    .eq("code", normalizedCode)
    .maybeSingle();

  if (breakoutError || !breakout) {
    throw new RoomDomainError(
      "That breakout room does not belong to this study room.",
    );
  }

  const { data: pdfDocument, error: pdfError } = await client
    .from("breakout_documents")
    .select("id, pdf_storage_path")
    .eq("breakout_room_id", breakout.id)
    .eq("kind", "pdf")
    .single();

  if (pdfError || !pdfDocument) {
    throw new RoomDomainError("The breakout PDF is unavailable.");
  }

  return {
    breakoutRoomId: breakout.id,
    code: breakout.code,
    parentRoomId: access.id,
    parentRoomSlug: access.slug,
    pdfDocumentId: pdfDocument.id,
    pdfStoragePath:
      typeof pdfDocument.pdf_storage_path === "string"
        ? pdfDocument.pdf_storage_path
        : null,
    role: access.role,
  };
}

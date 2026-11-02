import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  ROOM_ICON_BUCKET,
  ROOM_ICON_CONTENT_TYPE,
  ROOM_ICON_MAX_UPLOAD_BYTES,
} from "@/lib/room-banners/constants";
import { RoomDomainError } from "@/lib/rooms/repository";

const JPEG_START = [0xff, 0xd8, 0xff] as const;

async function hasJpegSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(
    await file.slice(0, JPEG_START.length).arrayBuffer(),
  );

  return JPEG_START.every((byte, index) => bytes[index] === byte);
}

export async function readCompressedRoomIcon(
  value: FormDataEntryValue | null,
  compressionMarker: FormDataEntryValue | null,
): Promise<File | null> {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  if (compressionMarker !== "true") {
    throw new RoomDomainError(
      "Wait for the room icon to finish compressing before saving.",
    );
  }

  if (
    value.type !== ROOM_ICON_CONTENT_TYPE ||
    value.size > ROOM_ICON_MAX_UPLOAD_BYTES ||
    !(await hasJpegSignature(value))
  ) {
    throw new RoomDomainError(
      "The room icon must be a compressed JPEG smaller than 700 KB.",
    );
  }

  return value;
}

export async function uploadRoomIcon(
  client: SupabaseClient,
  roomId: string,
  file: File,
): Promise<string> {
  const path = `${roomId}/${randomUUID()}.jpg`;
  const { error } = await client.storage
    .from(ROOM_ICON_BUCKET)
    .upload(path, file, {
      cacheControl: "31536000",
      contentType: ROOM_ICON_CONTENT_TYPE,
      upsert: false,
    });

  if (error) {
    throw new RoomDomainError(
      "The room icon could not be uploaded. Try again.",
    );
  }

  return path;
}

export async function removeRoomIcon(
  client: SupabaseClient,
  path: string,
): Promise<boolean> {
  const { error } = await client.storage.from(ROOM_ICON_BUCKET).remove([path]);

  return !error;
}

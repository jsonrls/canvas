import { clampUnit, type PdfAnnotationType, type PdfPoint } from "./model";
import type { RoomPdfAsset } from "@/lib/rooms/repository";

export function annotationUsesComments(type: PdfAnnotationType): boolean {
  return type === "sticky" || type === "comment";
}

export function isRoomPdfAsset(value: unknown): value is RoomPdfAsset {
  return Boolean(
    value &&
    typeof value === "object" &&
    "fileName" in value &&
    "revision" in value &&
    "signedUrl" in value &&
    "size" in value &&
    "storagePath" in value &&
    typeof value.fileName === "string" &&
    typeof value.revision === "string" &&
    typeof value.signedUrl === "string" &&
    typeof value.size === "number" &&
    typeof value.storagePath === "string",
  );
}

export function getPoint(event: React.PointerEvent<HTMLElement>): PdfPoint {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: clampUnit((event.clientX - bounds.left) / bounds.width),
    y: clampUnit((event.clientY - bounds.top) / bounds.height),
  };
}

export function readError(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

export function formatBytes(size: number): string {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

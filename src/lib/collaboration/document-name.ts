import type { CollaborativeDocumentKind } from "@/lib/collaboration/offline-document";

const ROOM_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
const BREAKOUT_CODE_PATTERN = /^[A-Z0-9]{8}$/;

export function buildCollaborativeDocumentName(
  roomSlug: string,
  kind: CollaborativeDocumentKind,
): string {
  if (!ROOM_SLUG_PATTERN.test(roomSlug)) {
    throw new Error("Invalid collaborative document room identifier.");
  }

  return kind === "notes" ? roomSlug : `${roomSlug}--${kind}`;
}

export function buildBreakoutCollaborativeDocumentName(
  roomSlug: string,
  breakoutCode: string,
  kind: CollaborativeDocumentKind = "notes",
): string {
  if (
    !ROOM_SLUG_PATTERN.test(roomSlug) ||
    !BREAKOUT_CODE_PATTERN.test(breakoutCode) ||
    !["notes", "pdf", "whiteboard"].includes(kind)
  ) {
    throw new Error("Invalid breakout collaborative document identifier.");
  }

  const baseName = `${roomSlug}--breakout--${breakoutCode}`;
  return kind === "notes" ? baseName : `${baseName}--${kind}`;
}

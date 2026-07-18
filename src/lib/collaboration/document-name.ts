import type { CollaborativeDocumentKind } from "@/lib/collaboration/offline-document";

const ROOM_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;

export function buildCollaborativeDocumentName(
  roomSlug: string,
  kind: CollaborativeDocumentKind,
): string {
  if (!ROOM_SLUG_PATTERN.test(roomSlug)) {
    throw new Error("Invalid collaborative document room identifier.");
  }

  return kind === "notes" ? roomSlug : `${roomSlug}--${kind}`;
}

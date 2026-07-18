const ROOM_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
const DOCUMENT_KINDS = new Set(["notes", "pdf", "whiteboard"]);

export function buildDocumentName(roomSlug, kind = "notes") {
  if (!ROOM_SLUG_PATTERN.test(roomSlug) || !DOCUMENT_KINDS.has(kind)) {
    throw new Error("Invalid collaborative document name.");
  }

  return kind === "notes" ? roomSlug : `${roomSlug}--${kind}`;
}

export function parseDocumentName(documentName) {
  const separatorIndex = documentName.lastIndexOf("--");

  if (separatorIndex > 0) {
    const roomSlug = documentName.slice(0, separatorIndex);
    const kind = documentName.slice(separatorIndex + 2);

    if (
      ROOM_SLUG_PATTERN.test(roomSlug) &&
      (kind === "pdf" || kind === "whiteboard")
    ) {
      return { documentName, kind, roomSlug };
    }
  }

  if (ROOM_SLUG_PATTERN.test(documentName)) {
    return { documentName, kind: "notes", roomSlug: documentName };
  }

  return null;
}

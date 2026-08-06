const ROOM_SLUG_PATTERN = /^[a-z0-9-]{1,64}$/;
const BREAKOUT_CODE_PATTERN = /^[A-Z0-9]{8}$/;
const DOCUMENT_KINDS = new Set(["notes", "pdf", "whiteboard"]);

export function buildDocumentName(roomSlug, kind = "notes") {
  if (!ROOM_SLUG_PATTERN.test(roomSlug) || !DOCUMENT_KINDS.has(kind)) {
    throw new Error("Invalid collaborative document name.");
  }

  return kind === "notes" ? roomSlug : `${roomSlug}--${kind}`;
}

export function parseDocumentName(documentName) {
  const breakoutMarker = "--breakout--";
  const breakoutIndex = documentName.lastIndexOf(breakoutMarker);

  if (breakoutIndex > 0) {
    const roomSlug = documentName.slice(0, breakoutIndex);
    const breakoutSuffix = documentName.slice(
      breakoutIndex + breakoutMarker.length,
    );
    const suffixParts = breakoutSuffix.split("--");
    const breakoutCode = suffixParts[0];
    const kind = suffixParts[1] ?? "notes";

    if (
      ROOM_SLUG_PATTERN.test(roomSlug) &&
      BREAKOUT_CODE_PATTERN.test(breakoutCode) &&
      suffixParts.length <= 2 &&
      DOCUMENT_KINDS.has(kind)
    ) {
      return {
        breakoutCode,
        documentName,
        isBreakout: true,
        kind,
        roomSlug,
      };
    }

    return null;
  }

  const separatorIndex = documentName.lastIndexOf("--");

  if (separatorIndex > 0) {
    const roomSlug = documentName.slice(0, separatorIndex);
    const kind = documentName.slice(separatorIndex + 2);

    if (
      ROOM_SLUG_PATTERN.test(roomSlug) &&
      (kind === "pdf" || kind === "whiteboard")
    ) {
      return { documentName, isBreakout: false, kind, roomSlug };
    }
  }

  if (ROOM_SLUG_PATTERN.test(documentName)) {
    return {
      documentName,
      isBreakout: false,
      kind: "notes",
      roomSlug: documentName,
    };
  }

  return null;
}

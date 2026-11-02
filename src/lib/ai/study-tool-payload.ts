import type { StudyPackResponse } from "./study-pack";
import type { SavedStudyGuideMetadata } from "./saved-study-guides";

export function formatGenerationTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "just now";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function readApiPayload(value: unknown): StudyPackResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Partial<StudyPackResponse>;

  if (
    typeof payload.generatedAt !== "string" ||
    typeof payload.sourceCharacters !== "number" ||
    !payload.studyPack ||
    typeof payload.studyPack !== "object"
  ) {
    return null;
  }

  return payload as StudyPackResponse;
}

export function readSavedGuidesPayload(
  value: unknown,
): SavedStudyGuideMetadata[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const guides = (value as { guides?: unknown }).guides;

  if (!Array.isArray(guides)) return [];

  return guides.filter((guide): guide is SavedStudyGuideMetadata => {
    if (!guide || typeof guide !== "object" || Array.isArray(guide)) {
      return false;
    }

    const item = guide as Record<string, unknown>;
    return (
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.generatedAt === "string" &&
      typeof item.createdAt === "string" &&
      typeof item.sourceCharacters === "number"
    );
  });
}

export function readErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : null;
}

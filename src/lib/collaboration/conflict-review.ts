export interface EditorDraft {
  content: Record<string, unknown>;
  text: string;
}

export interface ReconciliationWindow {
  localUpdateCount: number;
  offlineDraft: EditorDraft | null;
  remoteUpdateCount: number;
}

export interface ConflictReview {
  id: number;
  localUpdateCount: number;
  mergedDraft: EditorDraft;
  offlineDraft: EditorDraft;
  remoteUpdateCount: number;
}

export type ReconciliationUpdateSource = "local" | "remote";

const EMPTY_DRAFT_COPY = "No text in this draft.";

export function createReconciliationWindow(): ReconciliationWindow {
  return {
    localUpdateCount: 0,
    offlineDraft: null,
    remoteUpdateCount: 0,
  };
}

export function recordReconciliationUpdate(
  window: ReconciliationWindow,
  source: ReconciliationUpdateSource,
): void {
  if (source === "remote") {
    window.remoteUpdateCount += 1;
    return;
  }

  window.localUpdateCount += 1;
}

export function isReconciliationUpdateRelevant(
  source: ReconciliationUpdateSource,
  isEditorFocused: boolean,
): boolean {
  return source === "remote" || isEditorFocused;
}

export function captureOfflineDraft(
  window: ReconciliationWindow,
  draft: EditorDraft | null,
): void {
  if (window.offlineDraft === null && draft !== null) {
    window.offlineDraft = draft;
  }
}

export function finalizeConflictReview(
  window: ReconciliationWindow,
  mergedDraft: EditorDraft | null,
  id: number,
): ConflictReview | null {
  if (
    window.localUpdateCount === 0 ||
    window.remoteUpdateCount === 0 ||
    window.offlineDraft === null ||
    mergedDraft === null
  ) {
    return null;
  }

  return {
    id,
    localUpdateCount: window.localUpdateCount,
    mergedDraft,
    offlineDraft: window.offlineDraft,
    remoteUpdateCount: window.remoteUpdateCount,
  };
}

export function createDraftExcerpt(text: string, maximumLength = 220): string {
  const normalized = text.replace(/\s+/gu, " ").trim();

  if (!normalized) {
    return EMPTY_DRAFT_COPY;
  }

  if (normalized.length <= maximumLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(1, maximumLength - 1)).trimEnd()}…`;
}

export function createConflictCheckpointLabel(
  date = new Date(),
  timeZone?: string,
): string {
  const timestamp = new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone,
  }).format(date);

  return `Merged before offline draft · ${timestamp}`.slice(0, 80);
}

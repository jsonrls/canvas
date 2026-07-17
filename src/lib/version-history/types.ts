export interface EditorSnapshot {
  content: Record<string, unknown>;
  yjsState: string;
}

export interface VersionSummary {
  createdAt: string;
  createdBy: string;
  createdByName: string;
  id: string;
  label: string;
}

export interface RestorableVersion {
  content: Record<string, unknown>;
  label: string;
}

export type VersionActionResult<T> =
  { data: T; error: null } | { data: null; error: string };

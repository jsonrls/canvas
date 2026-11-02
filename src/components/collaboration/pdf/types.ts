import {
  Highlighter,
  MessageSquare,
  Minus,
  Pencil,
  StickyNote,
} from "@/components/ui/icons";
import {
  type PdfAnnotationType,
  type PdfPoint,
} from "@/lib/pdf-annotations/model";

export interface UploadStartResponse {
  error?: unknown;
  fileName?: unknown;
  revision?: unknown;
  signedUrl?: unknown;
}

export interface UploadFinishResponse {
  asset?: unknown;
  error?: unknown;
}

export interface AssetRefreshResponse {
  asset?: unknown;
  error?: unknown;
}

export interface DraftMark {
  current: PdfPoint;
  points: PdfPoint[];
  start: PdfPoint;
  type: Extract<PdfAnnotationType, "draw" | "highlight" | "underline">;
}

export const TOOL_LABELS: Array<{
  icon: typeof Highlighter;
  label: string;
  type: PdfAnnotationType;
}> = [
  { icon: Highlighter, label: "Highlight", type: "highlight" },
  { icon: Minus, label: "Underline", type: "underline" },
  { icon: Pencil, label: "Draw", type: "draw" },
  { icon: StickyNote, label: "Sticky note", type: "sticky" },
  { icon: MessageSquare, label: "Page comment", type: "comment" },
];
export const MOBILE_PRIMARY_PDF_TOOLS = new Set<PdfAnnotationType>([
  "highlight",
  "draw",
]);

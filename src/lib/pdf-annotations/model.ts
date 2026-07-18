export type PdfAnnotationType =
  "comment" | "draw" | "highlight" | "sticky" | "underline";

export interface PdfPoint {
  x: number;
  y: number;
}

export interface PdfAnnotation {
  authorId: string;
  authorName: string;
  color: string;
  createdAt: string;
  height: number;
  id: string;
  page: number;
  points: PdfPoint[];
  revision: string;
  text: string;
  type: PdfAnnotationType;
  width: number;
  x: number;
  y: number;
}

export interface PdfReply {
  annotationId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  id: string;
  revision: string;
  text: string;
}

const TYPES = new Set<PdfAnnotationType>([
  "comment",
  "draw",
  "highlight",
  "sticky",
  "underline",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUnitNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isShortString(value: unknown, limit = 4000): value is string {
  return typeof value === "string" && value.length <= limit;
}

export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function readPdfAnnotation(value: unknown): PdfAnnotation | null {
  if (!isRecord(value) || !TYPES.has(value.type as PdfAnnotationType)) {
    return null;
  }

  const points = Array.isArray(value.points)
    ? value.points.filter(
        (point): point is PdfPoint =>
          isRecord(point) && isUnitNumber(point.x) && isUnitNumber(point.y),
      )
    : [];

  if (
    !isShortString(value.id, 80) ||
    !isShortString(value.revision, 80) ||
    !isShortString(value.authorId, 80) ||
    !isShortString(value.authorName, 120) ||
    !isShortString(value.color, 32) ||
    !isShortString(value.createdAt, 40) ||
    !isShortString(value.text) ||
    !Number.isInteger(value.page) ||
    (value.page as number) < 1 ||
    !isUnitNumber(value.x) ||
    !isUnitNumber(value.y) ||
    !isUnitNumber(value.width) ||
    !isUnitNumber(value.height) ||
    points.length > 2_000
  ) {
    return null;
  }

  return {
    authorId: value.authorId,
    authorName: value.authorName,
    color: value.color,
    createdAt: value.createdAt,
    height: value.height,
    id: value.id,
    page: value.page as number,
    points,
    revision: value.revision,
    text: value.text,
    type: value.type as PdfAnnotationType,
    width: value.width,
    x: value.x,
    y: value.y,
  };
}

export function readPdfReply(value: unknown): PdfReply | null {
  if (
    !isRecord(value) ||
    !isShortString(value.id, 80) ||
    !isShortString(value.annotationId, 80) ||
    !isShortString(value.revision, 80) ||
    !isShortString(value.authorId, 80) ||
    !isShortString(value.authorName, 120) ||
    !isShortString(value.createdAt, 40) ||
    !isShortString(value.text, 1200) ||
    value.text.trim().length === 0
  ) {
    return null;
  }

  return {
    annotationId: value.annotationId,
    authorId: value.authorId,
    authorName: value.authorName,
    createdAt: value.createdAt,
    id: value.id,
    revision: value.revision,
    text: value.text,
  };
}

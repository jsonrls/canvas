export const PDF_BUCKET = "boardprep-pdfs";
export const MAX_PDF_BYTES = 15 * 1024 * 1024;
const PDF_MAGIC = "%PDF-";

export interface PdfUploadSource {
  arrayBuffer(): Promise<ArrayBuffer>;
  name: string;
  size: number;
  type: string;
}

export interface ValidatedPdfUpload {
  bytes: Uint8Array;
  fileName: string;
  size: number;
}

export interface ValidatedPdfMetadata {
  fileName: string;
  size: number;
}

export class PdfUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfUploadError";
  }
}

export function normalizePdfFileName(fileName: string): string {
  const normalized = fileName
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]+/g, "-")
    .trim();
  const withExtension = normalized.toLowerCase().endsWith(".pdf")
    ? normalized
    : `${normalized || "study-material"}.pdf`;

  return withExtension.slice(0, 180);
}

export function validatePdfMetadata(
  fileName: string,
  mimeType: string,
  size: number,
): ValidatedPdfMetadata {
  if (mimeType !== "application/pdf") {
    throw new PdfUploadError("Choose a PDF file.");
  }

  if (
    !Number.isSafeInteger(size) ||
    size < PDF_MAGIC.length ||
    size > MAX_PDF_BYTES
  ) {
    throw new PdfUploadError("PDF files must be 15 MB or smaller.");
  }

  return {
    fileName: normalizePdfFileName(fileName),
    size,
  };
}

export function hasPdfHeader(bytes: Uint8Array): boolean {
  const header = new TextDecoder("ascii").decode(
    bytes.slice(0, PDF_MAGIC.length),
  );

  return header === PDF_MAGIC;
}

export async function validatePdfUpload(
  file: PdfUploadSource,
): Promise<ValidatedPdfUpload> {
  const metadata = validatePdfMetadata(file.name, file.type, file.size);

  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!hasPdfHeader(bytes)) {
    throw new PdfUploadError("That file does not contain a valid PDF header.");
  }

  return {
    bytes,
    ...metadata,
  };
}

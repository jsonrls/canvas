import { NextResponse } from "next/server";

import { getBreakoutToolAccess } from "@/lib/breakout-rooms/repository";
import {
  hasPdfHeader,
  MAX_PDF_BYTES,
  PDF_BUCKET,
  PdfUploadError,
  validatePdfMetadata,
} from "@/lib/pdf-assets/validation";
import { type RoomPdfAsset, RoomDomainError } from "@/lib/rooms/repository";
import {
  createServiceRoleClient,
  getAuthenticatedContext,
} from "@/lib/supabase/server";

interface BreakoutPdfRouteProps {
  params: Promise<{ code: string; roomId: string }>;
}

interface StartUploadBody {
  fileName?: unknown;
  mimeType?: unknown;
  size?: unknown;
}

interface FinishUploadBody {
  fileName?: unknown;
  revision?: unknown;
  size?: unknown;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { headers: PRIVATE_HEADERS, status },
  );
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > 4_096) {
    throw new PdfUploadError("The PDF request is too large.");
  }

  const body: unknown = await request.json();

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new PdfUploadError("The PDF request is invalid.");
  }

  return body as Record<string, unknown>;
}

function requireEditor(role: "owner" | "editor" | "viewer"): void {
  if (role === "viewer") {
    throw new RoomDomainError(
      "Only room editors can replace the breakout PDF.",
    );
  }
}

async function ensurePdfBucket(): Promise<void> {
  const admin = createServiceRoleClient();
  const { data: bucket } = await admin.storage.getBucket(PDF_BUCKET);
  const options = {
    allowedMimeTypes: ["application/pdf"],
    fileSizeLimit: MAX_PDF_BYTES,
    public: false,
  };

  if (!bucket) {
    const { error } = await admin.storage.createBucket(PDF_BUCKET, options);

    if (error) {
      throw new PdfUploadError("Private PDF storage is unavailable.");
    }

    return;
  }

  if (
    bucket.public !== false ||
    bucket.file_size_limit !== MAX_PDF_BYTES ||
    bucket.allowed_mime_types?.length !== 1 ||
    bucket.allowed_mime_types[0] !== "application/pdf"
  ) {
    const { error } = await admin.storage.updateBucket(PDF_BUCKET, options);

    if (error) {
      throw new PdfUploadError("Private PDF storage is unavailable.");
    }
  }
}

async function removeUploadedAsset(path: string): Promise<void> {
  await createServiceRoleClient().storage.from(PDF_BUCKET).remove([path]);
}

export async function GET(
  _request: Request,
  { params }: BreakoutPdfRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const { code, roomId } = await params;
    const access = await getBreakoutToolAccess(
      context.client,
      roomId,
      code,
      context.userId,
    );

    if (!access.pdfStoragePath) {
      return NextResponse.json({ asset: null }, { headers: PRIVATE_HEADERS });
    }

    const { data: document, error: documentError } = await context.client
      .from("breakout_documents")
      .select("pdf_asset_revision, pdf_file_name, pdf_file_size")
      .eq("id", access.pdfDocumentId)
      .single();

    if (
      documentError ||
      !document ||
      typeof document.pdf_asset_revision !== "string" ||
      typeof document.pdf_file_name !== "string" ||
      typeof document.pdf_file_size !== "number"
    ) {
      throw new PdfUploadError("The breakout PDF is unavailable.");
    }

    const { data: signedPdf, error: signedPdfError } =
      await createServiceRoleClient()
        .storage.from(PDF_BUCKET)
        .createSignedUrl(access.pdfStoragePath, 10 * 60);

    if (signedPdfError || !signedPdf?.signedUrl) {
      throw new PdfUploadError("The breakout PDF could not be opened.");
    }

    const asset: RoomPdfAsset = {
      fileName: document.pdf_file_name,
      revision: document.pdf_asset_revision,
      signedUrl: signedPdf.signedUrl,
      size: document.pdf_file_size,
      storagePath: access.pdfStoragePath,
    };

    return NextResponse.json({ asset }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    const message =
      error instanceof PdfUploadError || error instanceof RoomDomainError
        ? error.message
        : "The breakout PDF could not be opened.";

    return errorResponse(message, 400);
  }
}

export async function POST(
  request: Request,
  { params }: BreakoutPdfRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return errorResponse("Authentication required.", 401);
  }

  try {
    const { code, roomId } = await params;
    const body = (await readJson(request)) as StartUploadBody;

    if (
      typeof body.fileName !== "string" ||
      typeof body.mimeType !== "string" ||
      typeof body.size !== "number"
    ) {
      throw new PdfUploadError("The PDF request is invalid.");
    }

    const metadata = validatePdfMetadata(
      body.fileName,
      body.mimeType,
      body.size,
    );
    const access = await getBreakoutToolAccess(
      context.client,
      roomId,
      code,
      context.userId,
    );
    requireEditor(access.role);
    await ensurePdfBucket();

    const revision = crypto.randomUUID();
    const path = `breakouts/${access.breakoutRoomId}/${revision}.pdf`;
    const { data, error } = await context.client.storage
      .from(PDF_BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data?.signedUrl) {
      throw new PdfUploadError("The secure PDF upload could not be started.");
    }

    return NextResponse.json(
      {
        fileName: metadata.fileName,
        path,
        revision,
        signedUrl: data.signedUrl,
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    const message =
      error instanceof PdfUploadError || error instanceof RoomDomainError
        ? error.message
        : "The secure PDF upload could not be started.";

    return errorResponse(message, 400);
  }
}

export async function PUT(
  request: Request,
  { params }: BreakoutPdfRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return errorResponse("Authentication required.", 401);
  }

  let uploadedPath: string | null = null;

  try {
    const { code, roomId } = await params;
    const body = (await readJson(request)) as FinishUploadBody;

    if (
      typeof body.fileName !== "string" ||
      typeof body.revision !== "string" ||
      typeof body.size !== "number" ||
      !UUID_PATTERN.test(body.revision)
    ) {
      throw new PdfUploadError("The PDF request is invalid.");
    }

    const metadata = validatePdfMetadata(
      body.fileName,
      "application/pdf",
      body.size,
    );
    const access = await getBreakoutToolAccess(
      context.client,
      roomId,
      code,
      context.userId,
    );
    requireEditor(access.role);
    uploadedPath = `breakouts/${access.breakoutRoomId}/${body.revision}.pdf`;

    const adminFiles = createServiceRoleClient().storage.from(PDF_BUCKET);
    const [{ data: info, error: infoError }, downloadResult] =
      await Promise.all([
        adminFiles.info(uploadedPath),
        adminFiles.download(uploadedPath, {}, { cache: "no-store" }),
      ]);

    if (
      infoError ||
      downloadResult.error ||
      !info ||
      !downloadResult.data ||
      info.size !== metadata.size ||
      info.contentType !== "application/pdf"
    ) {
      throw new PdfUploadError("The uploaded PDF could not be verified.");
    }

    const header = new Uint8Array(
      await downloadResult.data.slice(0, 5).arrayBuffer(),
    );

    if (!hasPdfHeader(header)) {
      throw new PdfUploadError(
        "That file does not contain a valid PDF header.",
      );
    }

    const { data: signedPdf, error: signedPdfError } =
      await context.client.storage
        .from(PDF_BUCKET)
        .createSignedUrl(uploadedPath, 10 * 60);

    if (signedPdfError || !signedPdf?.signedUrl) {
      throw new PdfUploadError("The uploaded PDF could not be opened.");
    }

    let update = context.client
      .from("breakout_documents")
      .update({
        pdf_asset_revision: body.revision,
        pdf_file_name: metadata.fileName,
        pdf_file_size: metadata.size,
        pdf_storage_path: uploadedPath,
        updated_by: context.userId,
      })
      .eq("id", access.pdfDocumentId);

    update = access.pdfStoragePath
      ? update.eq("pdf_storage_path", access.pdfStoragePath)
      : update.is("pdf_storage_path", null);

    const { data: updatedDocument, error: updateError } = await update
      .select("pdf_storage_path")
      .maybeSingle();

    if (updateError || updatedDocument?.pdf_storage_path !== uploadedPath) {
      throw new PdfUploadError(
        "The breakout PDF changed during this upload. Try replacing it again.",
      );
    }

    const asset: RoomPdfAsset = {
      fileName: metadata.fileName,
      revision: body.revision,
      signedUrl: signedPdf.signedUrl,
      size: metadata.size,
      storagePath: uploadedPath,
    };
    uploadedPath = null;

    if (access.pdfStoragePath) {
      await context.client.storage
        .from(PDF_BUCKET)
        .remove([access.pdfStoragePath]);
    }

    return NextResponse.json({ asset }, { headers: PRIVATE_HEADERS });
  } catch (error) {
    if (uploadedPath) {
      await removeUploadedAsset(uploadedPath);
    }

    const message =
      error instanceof PdfUploadError || error instanceof RoomDomainError
        ? error.message
        : "The uploaded PDF could not be published.";

    return errorResponse(message, 400);
  }
}

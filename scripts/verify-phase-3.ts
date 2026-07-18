import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import * as Y from "yjs";

import { buildCollaborativeDocumentName } from "../src/lib/collaboration/document-name";
import { buildOfflineDocumentKey } from "../src/lib/collaboration/offline-document";
import {
  readPdfAnnotation,
  readPdfReply,
} from "../src/lib/pdf-annotations/model";
import {
  MAX_PDF_BYTES,
  PdfUploadError,
  validatePdfMetadata,
  validatePdfUpload,
} from "../src/lib/pdf-assets/validation";
import {
  getElementBounds,
  readWhiteboardElement,
  resizeWhiteboardElement,
} from "../src/lib/whiteboard/model";

const userId = "11111111-1111-4111-8111-111111111111";
const roomSlug = "phase-three-verification";

async function verifyPdfValidation(): Promise<void> {
  const bytes = new TextEncoder().encode("%PDF-1.7\nverification");
  const valid = await validatePdfUpload({
    arrayBuffer: async () => bytes.buffer,
    name: "../../Study Guide",
    size: bytes.byteLength,
    type: "application/pdf",
  });
  assert.equal(valid.fileName, "..-..-Study Guide.pdf");
  assert.equal(valid.size, bytes.byteLength);
  assert.deepEqual(validatePdfMetadata("notes.pdf", "application/pdf", 5), {
    fileName: "notes.pdf",
    size: 5,
  });
  assert.throws(
    () => validatePdfMetadata("notes.pdf", "text/plain", 5),
    PdfUploadError,
  );
  assert.throws(
    () =>
      validatePdfMetadata("notes.pdf", "application/pdf", MAX_PDF_BYTES + 1),
    PdfUploadError,
  );
  await assert.rejects(
    validatePdfUpload({
      arrayBuffer: async () => new TextEncoder().encode("not-pdf").buffer,
      name: "fake.pdf",
      size: 7,
      type: "application/pdf",
    }),
    PdfUploadError,
  );
}

function verifyPayloadBoundaries(): void {
  const annotation = {
    authorId: userId,
    authorName: "Phase Three",
    color: "#3871c2",
    createdAt: new Date().toISOString(),
    height: 0.1,
    id: "annotation-1",
    page: 1,
    points: [{ x: 0.1, y: 0.2 }],
    revision: "revision-1",
    text: "High yield",
    type: "highlight",
    width: 0.2,
    x: 0.1,
    y: 0.2,
  };
  assert.deepEqual(readPdfAnnotation(annotation), annotation);
  assert.equal(readPdfAnnotation({ ...annotation, x: 1.1 }), null);
  assert.equal(readPdfAnnotation({ ...annotation, page: 0 }), null);

  const reply = {
    annotationId: annotation.id,
    authorId: userId,
    authorName: "Phase Three",
    createdAt: new Date().toISOString(),
    id: "reply-1",
    revision: annotation.revision,
    text: "Agreed",
  };
  assert.deepEqual(readPdfReply(reply), reply);
  assert.equal(readPdfReply({ ...reply, text: "" }), null);

  const boardElement = {
    authorId: userId,
    color: "#3871c2",
    createdAt: new Date().toISOString(),
    height: 120,
    id: "shape-1",
    points: [] as Array<{ x: number; y: number }>,
    src: "",
    text: "",
    type: "rectangle" as const,
    width: 220,
    x: 30,
    y: 40,
  };
  assert.deepEqual(readWhiteboardElement(boardElement), boardElement);
  assert.equal(readWhiteboardElement({ ...boardElement, x: -1 }), null);
  assert.equal(
    readWhiteboardElement({
      ...boardElement,
      src: "javascript:alert(1)",
      type: "image",
    }),
    null,
  );
  assert.equal(
    readWhiteboardElement({
      ...boardElement,
      src: "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
      type: "image",
    }),
    null,
  );

  const resized = resizeWhiteboardElement(boardElement, "se", {
    x: boardElement.x + 300,
    y: boardElement.y + 200,
  });
  assert.equal(resized.width, 300);
  assert.equal(resized.height, 200);
  assert.deepEqual(getElementBounds(resized), {
    x: 30,
    y: 40,
    width: 300,
    height: 200,
  });

  const line = {
    ...boardElement,
    id: "line-1",
    type: "line" as const,
    width: 100,
    height: 50,
    x: 10,
    y: 20,
  };
  const resizedLine = resizeWhiteboardElement(line, "end", { x: 80, y: 90 });
  assert.equal(resizedLine.x, 10);
  assert.equal(resizedLine.y, 20);
  assert.equal(resizedLine.width, 70);
  assert.equal(resizedLine.height, 70);
}

function verifyDocumentIsolation(): void {
  assert.equal(buildCollaborativeDocumentName(roomSlug, "notes"), roomSlug);
  assert.equal(
    buildCollaborativeDocumentName(roomSlug, "pdf"),
    `${roomSlug}--pdf`,
  );
  assert.equal(
    buildCollaborativeDocumentName(roomSlug, "whiteboard"),
    `${roomSlug}--whiteboard`,
  );
  assert.notEqual(
    buildOfflineDocumentKey(userId, roomSlug, "notes"),
    buildOfflineDocumentKey(userId, roomSlug, "pdf"),
  );
  assert.notEqual(
    buildOfflineDocumentKey(userId, roomSlug, "pdf"),
    buildOfflineDocumentKey(userId, roomSlug, "whiteboard"),
  );
  assert.throws(() => buildCollaborativeDocumentName("Invalid Room", "pdf"));
}

function verifyIndependentCrdtMerges(): void {
  const first = new Y.Doc();
  const second = new Y.Doc();
  const firstMap = first.getMap("elements");
  const secondMap = second.getMap("elements");
  firstMap.set("annotation-a", { type: "highlight" });
  secondMap.set("annotation-b", { type: "comment" });
  Y.applyUpdate(first, Y.encodeStateAsUpdate(second));
  Y.applyUpdate(second, Y.encodeStateAsUpdate(first));
  assert.equal(firstMap.size, 2);
  assert.equal(secondMap.size, 2);
  first.destroy();
  second.destroy();
}

async function verifyWorkspaceContract(): Promise<void> {
  const [roomSource, pdfSource, whiteboardSource, routeSource] =
    await Promise.all([
      readFile("src/components/collaboration/collaborative-room.tsx", "utf8"),
      readFile("src/components/collaboration/pdf-study-tool.tsx", "utf8"),
      readFile(
        "src/components/collaboration/whiteboard-study-tool.tsx",
        "utf8",
      ),
      readFile("src/app/api/rooms/[roomId]/pdf/route.ts", "utf8"),
    ]);

  assert.match(roomSource, /dynamic\(/);
  assert.match(roomSource, /ssr: false/);
  assert.match(roomSource, /PDF annotation/);
  assert.match(roomSource, /Whiteboard/);
  assert.match(pdfSource, /disabled=\{!canEdit\}/);
  assert.match(pdfSource, /renderTextLayer=\{false\}/);
  assert.match(pdfSource, /ZoomIn/);
  assert.match(whiteboardSource, /disabled=\{!canEdit\}/);
  assert.match(whiteboardSource, /whiteboard-elements/);
  assert.match(whiteboardSource, /resizeWhiteboardElement/);
  assert.match(whiteboardSource, /Clear all/);
  assert.match(whiteboardSource, /clearAllDrawings/);
  assert.match(routeSource, /getAuthenticatedContext/);
  assert.match(routeSource, /requireEditor/);
  assert.match(routeSource, /hasPdfHeader/);
}

async function main(): Promise<void> {
  await verifyPdfValidation();
  verifyPayloadBoundaries();
  verifyDocumentIsolation();
  verifyIndependentCrdtMerges();
  await verifyWorkspaceContract();
  console.log(
    "Phase 3 verification passed: PDF validation, bounded payloads, isolated document keys, CRDT merging, lazy workspaces, viewer controls, zoom, and route authorization guards.",
  );
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

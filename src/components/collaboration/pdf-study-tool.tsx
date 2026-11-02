"use client";
import { PdfAnnotationLayer } from "./pdf/pdf-annotation-layer";
import { PdfComments } from "./pdf/pdf-comments";
import { PdfToolbar } from "./pdf/pdf-toolbar";
import { usePdfAnnotations } from "./pdf/use-pdf-annotations";
import { usePdfAsset } from "./pdf/use-pdf-asset";
import { usePdfDocument } from "./pdf/use-pdf-document";

import { ButtonControl } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
} from "@/components/ui/icons";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import { type PdfAnnotationType } from "@/lib/pdf-annotations/model";
import type { RoomPdfAsset } from "@/lib/rooms/repository";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfStudyToolProps {
  breakoutCode?: string;
  canEdit: boolean;
  canManageAsset: boolean;
  currentUser: { displayName: string; id: string };
  initialAsset: RoomPdfAsset | null;
  initialState: string | null;
  pdfApiPath?: string;
  roomId: string;
}

export default function PdfStudyTool({
  breakoutCode,
  canEdit,
  canManageAsset,
  currentUser,
  initialAsset,
  initialState,
  pdfApiPath,
  roomId,
}: PdfStudyToolProps): React.ReactElement {
  const [page, setPage] = useState(1);

  const [numPages, setNumPages] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    asset,
    fileMessage,
    isRefreshingAsset,
    isUploading,
    fileInputRef,
    handlePdfLoadError,
    uploadPdf,
  } = usePdfAsset({
    pdfApiPath,
    roomId,
    initialAsset,
    canManageAsset,
    setPage,
    setNumPages,
    setSelectedId,
  });

  const collaboration = useCollaborativeTool({
    breakoutCode,
    canEdit,
    currentUser,
    initialState,
    kind: "pdf",
    roomId,
  });

  const revision = asset?.revision ?? "";

  const { annotations, bookmarkedPages, replies, transact, toggleBookmark } =
    usePdfDocument({ collaboration, revision, canEdit, currentUser, page });

  const [commentsOpen, setCommentsOpen] = useState(false);

  const [scrollMode, setScrollMode] = useState(true);

  const [selectedTool, setSelectedTool] =
    useState<PdfAnnotationType>("highlight");

  const {
    draft,
    setDraft,
    replyText,
    setReplyText,
    textDraft,
    setTextDraft,
    selectedAnnotation,
    pageAnnotations,
    pageComments,
    selectAnnotation,
    handlePointerDown,
    handlePointerMove,
    finishDraft,
    saveAnnotationText,
    deleteSelected,
    addReply,
  } = usePdfAnnotations({
    annotations,
    selectedId,
    page,
    setSelectedId,
    setCommentsOpen,
    currentUser,
    collaboration,
    transact,
    revision,
    scrollMode,
    canEdit,
    selectedTool,
  });

  const [pageWidth, setPageWidth] = useState(720);

  const [zoom, setZoom] = useState(1);

  const pageHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = pageHostRef.current;

    if (!host) return;

    const updateWidth = (): void => {
      const horizontalInset = window.matchMedia("(max-width: 760px)").matches
        ? 0
        : 24;
      setPageWidth(
        Math.max(280, Math.min(820, host.clientWidth - horizontalInset)),
      );
    };
    const observer = new ResizeObserver(updateWidth);
    observer.observe(host);
    updateWidth();
    return () => observer.disconnect();
  }, [asset, isRefreshingAsset]);

  return (
    <section
      className="study-tool study-tool--visual study-tool--pdf"
      aria-label="PDF annotation workspace"
    >
      <div className="study-tool__heading">
        <div className="study-tool__file-actions">
          {asset && !isRefreshingAsset ? (
            <a href={asset.signedUrl} download={asset.fileName}>
              <Download aria-hidden="true" size={16} /> Download
            </a>
          ) : null}
          {canManageAsset ? (
            <>
              <input
                ref={fileInputRef}
                accept="application/pdf,.pdf"
                className="visually-hidden"
                id="room-pdf-upload"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadPdf(file);
                }}
                type="file"
              />
              <ButtonControl
                variant="secondary"
                aria-busy={isUploading}
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {isUploading ? (
                  <LoadingIndicator size="icon" />
                ) : (
                  <Upload aria-hidden="true" size={16} />
                )}
                {asset ? "Replace PDF" : "Upload PDF"}
              </ButtonControl>
            </>
          ) : null}
        </div>
      </div>

      {fileMessage || collaboration.message ? (
        <p className="study-tool__message" role="status">
          {fileMessage || collaboration.message}
        </p>
      ) : null}

      {isRefreshingAsset ? (
        <div className="pdf-empty-state">
          <LoadingIndicator
            description="The shared document will open automatically."
            label="Refreshing secure PDF access…"
            size="panel"
          />
        </div>
      ) : !asset ? (
        <div className="pdf-empty-state">
          <Upload aria-hidden="true" size={30} />
          <strong>
            {canManageAsset
              ? "Share the room’s first PDF"
              : "Waiting for a shared PDF"}
          </strong>
          <p>Private PDF files can be up to 15 MB.</p>
          {canManageAsset ? (
            <ButtonControl
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              Choose PDF
            </ButtonControl>
          ) : null}
        </div>
      ) : (
        <div
          className={`pdf-studio${commentsOpen ? "" : " pdf-studio--comments-collapsed"}`}
        >
          <div className="pdf-canvas-column">
            <PdfToolbar
              scrollMode={scrollMode}
              setDraft={setDraft}
              setScrollMode={setScrollMode}
              commentsOpen={commentsOpen}
              setCommentsOpen={setCommentsOpen}
              selectedTool={selectedTool}
              canEdit={canEdit}
              setSelectedTool={setSelectedTool}
              bookmarkedPages={bookmarkedPages}
              page={page}
              toggleBookmark={toggleBookmark}
              zoom={zoom}
              setZoom={setZoom}
              asset={asset}
              isRefreshingAsset={isRefreshingAsset}
              canManageAsset={canManageAsset}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              collaboration={collaboration}
            />

            <div className="pdf-page-host" ref={pageHostRef}>
              <Document
                error={
                  <p className="pdf-load-state">
                    This PDF could not be rendered.
                  </p>
                }
                file={asset.signedUrl}
                loading={
                  <LoadingIndicator
                    className="pdf-load-state"
                    label="Opening PDF…"
                    size="panel"
                  />
                }
                onLoadError={handlePdfLoadError}
                onLoadSuccess={({ numPages: loadedPages }) =>
                  setNumPages(loadedPages)
                }
              >
                <div className="pdf-page-wrap">
                  <Page
                    pageNumber={page}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    width={pageWidth * zoom}
                  />
                  <PdfAnnotationLayer
                    scrollMode={scrollMode}
                    selectedTool={selectedTool}
                    finishDraft={finishDraft}
                    handlePointerDown={handlePointerDown}
                    handlePointerMove={handlePointerMove}
                    pageAnnotations={pageAnnotations}
                    selectedId={selectedId}
                    selectAnnotation={selectAnnotation}
                    draft={draft}
                  />
                </div>
              </Document>
            </div>

            <div className="pdf-pagination">
              <ButtonControl
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={16} /> Previous
              </ButtonControl>
              <span>
                Page {page} of {numPages || "…"}
              </span>
              <ButtonControl
                variant="secondary"
                disabled={page >= numPages}
                onClick={() => setPage((value) => value + 1)}
                type="button"
              >
                Next <ChevronRight aria-hidden="true" size={16} />
              </ButtonControl>
            </div>
          </div>

          {commentsOpen ? (
            <PdfComments
              page={page}
              pageComments={pageComments}
              setCommentsOpen={setCommentsOpen}
              bookmarkedPages={bookmarkedPages}
              setPage={setPage}
              selectedId={selectedId}
              selectAnnotation={selectAnnotation}
              selectedAnnotation={selectedAnnotation}
              canEdit={canEdit}
              deleteSelected={deleteSelected}
              setTextDraft={setTextDraft}
              textDraft={textDraft}
              saveAnnotationText={saveAnnotationText}
              replies={replies}
              setReplyText={setReplyText}
              replyText={replyText}
              addReply={addReply}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

"use client";
import { PdfAnnotationLayer } from "./pdf/pdf-annotation-layer";
import { PdfComments } from "./pdf/pdf-comments";
import { visualMarkIds, fitPageWidth } from "@/lib/pdf-annotations/study-tool";
import { PdfToolbar } from "./pdf/pdf-toolbar";
import { usePdfAnnotations } from "./pdf/use-pdf-annotations";
import { usePdfAsset } from "./pdf/use-pdf-asset";
import { usePdfDocument } from "./pdf/use-pdf-document";

import { ButtonControl } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Upload } from "@/components/ui/icons";
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
    clearVisualMarks,
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

  // Room inside the page host, and the current page's width / height ratio.
  // 100% zoom fits the whole page in that room, as PDF viewers do with
  // "fit page", so nobody has to scroll to see the bottom of a slide.
  const [hostSize, setHostSize] = useState({ width: 720, height: 0 });
  const [pageAspect, setPageAspect] = useState(612 / 792);

  const [zoom, setZoom] = useState(1);

  const pageHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = pageHostRef.current;

    if (!host) return;

    const updateSize = (): void => {
      const styles = window.getComputedStyle(host);
      const width =
        host.clientWidth -
        Number.parseFloat(styles.paddingLeft) -
        Number.parseFloat(styles.paddingRight);
      const height =
        host.clientHeight -
        Number.parseFloat(styles.paddingTop) -
        Number.parseFloat(styles.paddingBottom);
      setHostSize({ width, height });
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(host);
    updateSize();
    return () => observer.disconnect();
  }, [asset, isRefreshingAsset]);

  // Phones scroll the page vertically by design, so there it fits the width.
  const isPhone =
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 760px)").matches;
  const pageWidth = fitPageWidth(hostSize, pageAspect, isPhone);

  return (
    <section
      className="study-tool study-tool--visual study-tool--pdf"
      aria-label="PDF annotation workspace"
    >
      {/* Download and Replace now sit beside the file name in the toolbar
          (and in the phone "More" menu). Only the file picker lives here. */}
      {canManageAsset ? (
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
      ) : null}

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
              visualMarkCount={visualMarkIds(annotations).length}
              onClearVisualMarks={clearVisualMarks}
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
                    onLoadSuccess={({ originalWidth, originalHeight }) => {
                      if (originalWidth > 0 && originalHeight > 0) {
                        setPageAspect(originalWidth / originalHeight);
                      }
                    }}
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
                variant="custom"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                title="Previous page"
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </ButtonControl>
              <span>
                Page {page} of {numPages || "…"}
              </span>
              <ButtonControl
                variant="custom"
                aria-label="Next page"
                disabled={page >= numPages}
                onClick={() => setPage((value) => value + 1)}
                title="Next page"
                type="button"
              >
                <ChevronRight aria-hidden="true" size={16} />
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

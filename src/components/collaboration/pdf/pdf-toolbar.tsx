import { MobileToolsMenu } from "@/components/collaboration/mobile-tools-menu";
import {
  DraftMark,
  MOBILE_PRIMARY_PDF_TOOLS,
  TOOL_LABELS,
} from "@/components/collaboration/pdf/types";
import { ButtonControl } from "@/components/ui/button";
import {
  AppIcon,
  Bookmark,
  Download,
  Hand,
  Upload,
  ZoomIn,
  ZoomOut,
} from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import type { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import { type PdfAnnotationType } from "@/lib/pdf-annotations/model";
import {
  annotationUsesComments,
  formatBytes,
} from "@/lib/pdf-annotations/study-tool";
import type { RoomPdfAsset } from "@/lib/rooms/repository";
import {
  PanelRightClose as PanelRightCloseData,
  PanelRightOpen as PanelRightOpenData,
} from "lucide";
import type { Dispatch, RefObject, SetStateAction } from "react";

export function PdfToolbar({
  scrollMode,
  setDraft,
  setScrollMode,
  commentsOpen,
  setCommentsOpen,
  selectedTool,
  canEdit,
  setSelectedTool,
  bookmarkedPages,
  page,
  toggleBookmark,
  zoom,
  setZoom,
  asset,
  isRefreshingAsset,
  canManageAsset,
  isUploading,
  fileInputRef,
  collaboration,
}: {
  scrollMode: boolean;
  setDraft: Dispatch<SetStateAction<DraftMark | null>>;
  setScrollMode: Dispatch<SetStateAction<boolean>>;
  commentsOpen: boolean;
  setCommentsOpen: Dispatch<SetStateAction<boolean>>;
  selectedTool: PdfAnnotationType;
  canEdit: boolean;
  setSelectedTool: Dispatch<SetStateAction<PdfAnnotationType>>;
  bookmarkedPages: Set<number>;
  page: number;
  toggleBookmark: () => void;
  zoom: number;
  setZoom: Dispatch<SetStateAction<number>>;
  asset: RoomPdfAsset | null;
  isRefreshingAsset: boolean;
  canManageAsset: boolean;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  collaboration: ReturnType<typeof useCollaborativeTool>;
}) {
  return (
    <div className="pdf-toolbar" aria-label="PDF annotation tools">
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-pressed={scrollMode}
        className={`pdf-toolbar__mobile-primary${scrollMode ? " is-active" : ""}`}
        onClick={() => {
          setDraft(null);
          setScrollMode(true);
        }}
        title="Scroll PDF"
        type="button"
      >
        <Hand aria-hidden="true" size={16} />
        <span>Scroll</span>
      </ButtonControl>
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-controls="pdf-comments-panel"
        aria-expanded={commentsOpen}
        aria-label={
          commentsOpen ? "Hide comments and notes" : "Show comments and notes"
        }
        className="pdf-comments-toggle pdf-toolbar__mobile-primary"
        onClick={() => setCommentsOpen((isOpen) => !isOpen)}
        title={
          commentsOpen ? "Hide comments and notes" : "Show comments and notes"
        }
        type="button"
      >
        {
          <AppIcon
            iconData={commentsOpen ? PanelRightCloseData : PanelRightOpenData}
            aria-hidden="true"
            size={18}
          />
        }
        <span className="pdf-comments-toggle__label">Notes &amp; comments</span>
      </ButtonControl>
      {TOOL_LABELS.map(({ icon: Icon, label, type }) => (
        <ButtonControl
          variant="ghost"
          size="sm"
          aria-pressed={!scrollMode && selectedTool === type}
          className={`${MOBILE_PRIMARY_PDF_TOOLS.has(type) ? "pdf-toolbar__mobile-primary" : "pdf-toolbar__mobile-secondary"}${!scrollMode && selectedTool === type ? " is-active" : ""}`}
          disabled={!canEdit}
          key={type}
          onClick={() => {
            setScrollMode(false);
            setSelectedTool(type);
            if (!annotationUsesComments(type)) {
              setCommentsOpen(false);
            }
          }}
          title={label}
          type="button"
        >
          <Icon aria-hidden="true" size={16} />
          <span>{label}</span>
        </ButtonControl>
      ))}
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-pressed={bookmarkedPages.has(page)}
        className={`pdf-toolbar__mobile-secondary${bookmarkedPages.has(page) ? " is-active" : ""}`}
        disabled={!canEdit}
        onClick={toggleBookmark}
        title="Bookmark page"
        type="button"
      >
        <Bookmark aria-hidden="true" size={16} />
        <span>Bookmark</span>
      </ButtonControl>
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-label="Zoom out"
        className="pdf-toolbar__mobile-secondary"
        disabled={zoom <= 0.75}
        onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
        title="Zoom out"
        type="button"
      >
        <ZoomOut aria-hidden="true" size={16} />
      </ButtonControl>
      <span className="pdf-zoom-value pdf-toolbar__mobile-secondary">
        {Math.round(zoom * 100)}%
      </span>
      <ButtonControl
        variant="ghost"
        size="sm"
        aria-label="Zoom in"
        className="pdf-toolbar__mobile-secondary"
        disabled={zoom >= 1.75}
        onClick={() => setZoom((value) => Math.min(1.75, value + 0.25))}
        title="Zoom in"
        type="button"
      >
        <ZoomIn aria-hidden="true" size={16} />
      </ButtonControl>
      <MobileToolsMenu
        active={
          (!scrollMode && !MOBILE_PRIMARY_PDF_TOOLS.has(selectedTool)) ||
          bookmarkedPages.has(page) ||
          zoom !== 1
        }
        description="Annotate, bookmark, or adjust the current PDF page."
        title="More PDF tools"
      >
        {(close) => (
          <div className="mobile-tools-dialog__grid">
            {TOOL_LABELS.filter(
              ({ type }) => !MOBILE_PRIMARY_PDF_TOOLS.has(type),
            ).map(({ icon: Icon, label, type }) => (
              <ButtonControl
                variant="ghost"
                size="sm"
                aria-pressed={!scrollMode && selectedTool === type}
                className={`mobile-tool-action${!scrollMode && selectedTool === type ? " is-active" : ""}`}
                disabled={!canEdit}
                key={type}
                onClick={() => {
                  setScrollMode(false);
                  setSelectedTool(type);
                  if (!annotationUsesComments(type)) {
                    setCommentsOpen(false);
                  }
                  close();
                }}
                type="button"
              >
                <Icon aria-hidden="true" size={18} />
                <span>{label}</span>
              </ButtonControl>
            ))}
            <ButtonControl
              variant="ghost"
              size="sm"
              aria-pressed={bookmarkedPages.has(page)}
              className={`mobile-tool-action${bookmarkedPages.has(page) ? " is-active" : ""}`}
              disabled={!canEdit}
              onClick={() => {
                toggleBookmark();
                close();
              }}
              type="button"
            >
              <Bookmark aria-hidden="true" size={18} />
              <span>
                {bookmarkedPages.has(page)
                  ? "Remove bookmark"
                  : "Bookmark page"}
              </span>
            </ButtonControl>
            <div className="mobile-tools-dialog__control mobile-tools-dialog__control--wide">
              <span>Page zoom</span>
              <div className="mobile-tools-dialog__stepper">
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  aria-label="Zoom out"
                  disabled={zoom <= 0.75}
                  onClick={() =>
                    setZoom((value) => Math.max(0.75, value - 0.25))
                  }
                  type="button"
                >
                  <ZoomOut aria-hidden="true" size={18} />
                </ButtonControl>
                <strong>{Math.round(zoom * 100)}%</strong>
                <ButtonControl
                  variant="ghost"
                  size="sm"
                  aria-label="Zoom in"
                  disabled={zoom >= 1.75}
                  onClick={() =>
                    setZoom((value) => Math.min(1.75, value + 0.25))
                  }
                  type="button"
                >
                  <ZoomIn aria-hidden="true" size={18} />
                </ButtonControl>
              </div>
            </div>
            {asset && !isRefreshingAsset ? (
              <a
                className="mobile-tool-action"
                download={asset.fileName}
                href={asset.signedUrl}
                onClick={close}
              >
                <Download aria-hidden="true" size={18} />
                <span>Download PDF</span>
              </a>
            ) : null}
            {canManageAsset ? (
              <ButtonControl
                variant="ghost"
                size="sm"
                className="mobile-tool-action"
                aria-busy={isUploading}
                disabled={isUploading}
                onClick={() => {
                  fileInputRef.current?.click();
                  close();
                }}
                type="button"
              >
                {isUploading ? (
                  <LoadingIndicator size="icon" />
                ) : (
                  <Upload aria-hidden="true" size={18} />
                )}
                <span>{asset ? "Replace PDF" : "Upload PDF"}</span>
              </ButtonControl>
            ) : null}
          </div>
        )}
      </MobileToolsMenu>
      <div className="pdf-toolbar__meta" role="status">
        <span
          className={`connection-badge connection-badge--${collaboration.status}`}
        >
          <span className="connection-dot" aria-hidden="true" />
          {collaboration.status === "synced"
            ? "Live"
            : collaboration.status === "viewing"
              ? "Read-only"
              : collaboration.status}
        </span>
        <span>
          {asset
            ? `${asset.fileName} · ${formatBytes(asset.size)}`
            : "No PDF shared"}
        </span>
        {(collaboration.status === "error" ||
          collaboration.status === "offline") &&
        canEdit ? (
          <ButtonControl
            variant="secondary"
            onClick={collaboration.reconnect}
            type="button"
          >
            Retry
          </ButtonControl>
        ) : null}
      </div>
    </div>
  );
}

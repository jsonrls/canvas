"use client";

import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Download,
  Hand,
  Highlighter,
  MessageSquare,
  Minus,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  RefreshCw,
  StickyNote,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useRouter } from "next/navigation";
import * as Y from "yjs";

import { MobileToolsMenu } from "@/components/collaboration/mobile-tools-menu";
import { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  clampUnit,
  type PdfAnnotation,
  type PdfAnnotationType,
  type PdfPoint,
  type PdfReply,
  readPdfAnnotation,
  readPdfReply,
} from "@/lib/pdf-annotations/model";
import { validatePdfUpload } from "@/lib/pdf-assets/validation";
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

interface UploadStartResponse {
  error?: unknown;
  fileName?: unknown;
  revision?: unknown;
  signedUrl?: unknown;
}

interface UploadFinishResponse {
  asset?: unknown;
  error?: unknown;
}

interface AssetRefreshResponse {
  asset?: unknown;
  error?: unknown;
}

interface DraftMark {
  current: PdfPoint;
  points: PdfPoint[];
  start: PdfPoint;
  type: Extract<PdfAnnotationType, "draw" | "highlight" | "underline">;
}

const TOOL_LABELS: Array<{
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
const MOBILE_PRIMARY_PDF_TOOLS = new Set<PdfAnnotationType>([
  "highlight",
  "draw",
]);

function annotationUsesComments(type: PdfAnnotationType): boolean {
  return type === "sticky" || type === "comment";
}

function isRoomPdfAsset(value: unknown): value is RoomPdfAsset {
  return Boolean(
    value &&
    typeof value === "object" &&
    "fileName" in value &&
    "revision" in value &&
    "signedUrl" in value &&
    "size" in value &&
    "storagePath" in value &&
    typeof value.fileName === "string" &&
    typeof value.revision === "string" &&
    typeof value.signedUrl === "string" &&
    typeof value.size === "number" &&
    typeof value.storagePath === "string",
  );
}

function getPoint(event: React.PointerEvent<HTMLElement>): PdfPoint {
  const bounds = event.currentTarget.getBoundingClientRect();
  return {
    x: clampUnit((event.clientX - bounds.left) / bounds.width),
    y: clampUnit((event.clientY - bounds.top) / bounds.height),
  };
}

function readError(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

function formatBytes(size: number): string {
  return size < 1024 * 1024
    ? `${Math.ceil(size / 1024)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  const router = useRouter();
  const apiPath = pdfApiPath ?? `/api/rooms/${roomId}/pdf`;
  const [asset, setAsset] = useState(initialAsset);
  const [annotations, setAnnotations] = useState<PdfAnnotation[]>([]);
  const [bookmarkedPages, setBookmarkedPages] = useState<Set<number>>(
    new Set(),
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState<DraftMark | null>(null);
  const [fileMessage, setFileMessage] = useState("");
  const [isRefreshingAsset, setIsRefreshingAsset] = useState(
    Boolean(initialAsset),
  );
  const [isUploading, setIsUploading] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageWidth, setPageWidth] = useState(720);
  const [replies, setReplies] = useState<PdfReply[]>([]);
  const [replyText, setReplyText] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scrollMode, setScrollMode] = useState(true);
  const [selectedTool, setSelectedTool] =
    useState<PdfAnnotationType>("highlight");
  const [textDraft, setTextDraft] = useState("");
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadRecoveryRevisionRef = useRef<string | null>(null);
  const pageHostRef = useRef<HTMLDivElement>(null);
  const collaboration = useCollaborativeTool({
    breakoutCode,
    canEdit,
    currentUser,
    initialState,
    kind: "pdf",
    roomId,
  });
  const revision = asset?.revision ?? "";

  const refreshPdfAsset = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      const response = await fetch(apiPath, {
        cache: "no-store",
        credentials: "same-origin",
        signal,
      });
      const payload = (await response.json()) as AssetRefreshResponse;

      if (!response.ok) {
        throw new Error(
          readError(payload, "The shared PDF access could not be refreshed."),
        );
      }

      if (payload.asset === null) {
        setAsset(null);
        return;
      }

      if (!isRoomPdfAsset(payload.asset)) {
        throw new Error("The refreshed PDF response was invalid.");
      }

      setAsset(payload.asset);
    },
    [apiPath],
  );

  useEffect(() => {
    const abortController = new AbortController();

    queueMicrotask(() => {
      if (abortController.signal.aborted) return;

      void refreshPdfAsset(abortController.signal)
        .then(() => {
          if (!abortController.signal.aborted) setFileMessage("");
        })
        .catch((error: unknown) => {
          if (abortController.signal.aborted) return;
          setAsset(null);
          setFileMessage(
            error instanceof Error
              ? error.message
              : "The shared PDF access could not be refreshed.",
          );
        })
        .finally(() => {
          if (!abortController.signal.aborted) setIsRefreshingAsset(false);
        });
    });

    return () => abortController.abort();
  }, [refreshPdfAsset]);

  const handlePdfLoadError = useCallback((): void => {
    if (
      !asset ||
      isRefreshingAsset ||
      loadRecoveryRevisionRef.current === asset.revision
    ) {
      setFileMessage("This PDF could not be rendered.");
      return;
    }

    loadRecoveryRevisionRef.current = asset.revision;
    setIsRefreshingAsset(true);
    setFileMessage("Refreshing secure PDF access…");

    void refreshPdfAsset()
      .then(() => setFileMessage(""))
      .catch((error: unknown) => {
        setAsset(null);
        setFileMessage(
          error instanceof Error
            ? error.message
            : "The shared PDF access could not be refreshed.",
        );
      })
      .finally(() => setIsRefreshingAsset(false));
  }, [asset, isRefreshingAsset, refreshPdfAsset]);

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

  useEffect(() => {
    const document = collaboration.connection?.document;

    if (!document) return;

    const annotationMap = document.getMap<unknown>("pdf-annotations");
    const replyMap = document.getMap<unknown>("pdf-replies");
    const bookmarkMap = document.getMap<unknown>("pdf-bookmarks");
    const refresh = (): void => {
      setAnnotations(
        Array.from(annotationMap.values())
          .map(readPdfAnnotation)
          .filter(
            (annotation): annotation is PdfAnnotation =>
              annotation?.revision === revision,
          )
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          ),
      );
      setReplies(
        Array.from(replyMap.values())
          .map(readPdfReply)
          .filter((reply): reply is PdfReply => reply?.revision === revision)
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          ),
      );
      const pages = new Set<number>();
      bookmarkMap.forEach((value, key) => {
        if (value === true && key.startsWith(`${revision}:`)) {
          const bookmarkedPage = Number(key.slice(revision.length + 1));
          if (Number.isInteger(bookmarkedPage) && bookmarkedPage > 0) {
            pages.add(bookmarkedPage);
          }
        }
      });
      setBookmarkedPages(pages);
    };

    refresh();
    annotationMap.observe(refresh);
    replyMap.observe(refresh);
    bookmarkMap.observe(refresh);
    return () => {
      annotationMap.unobserve(refresh);
      replyMap.unobserve(refresh);
      bookmarkMap.unobserve(refresh);
    };
  }, [collaboration.connection, revision]);

  const selectedAnnotation = useMemo(
    () =>
      annotations.find((annotation) => annotation.id === selectedId) ?? null,
    [annotations, selectedId],
  );
  const pageAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.page === page),
    [annotations, page],
  );
  const pageComments = useMemo(
    () =>
      pageAnnotations.filter(
        (annotation) =>
          annotation.type === "comment" || annotation.type === "sticky",
      ),
    [pageAnnotations],
  );

  const selectAnnotation = useCallback((annotation: PdfAnnotation): void => {
    setSelectedId(annotation.id);
    setTextDraft(annotation.text);
    setReplyText("");
    setCommentsOpen(annotationUsesComments(annotation.type));
  }, []);

  const transact = useCallback(
    (change: (document: Y.Doc) => void): void => {
      const document = collaboration.connection?.document;
      if (!canEdit || !document) return;
      document.transact(() => change(document), {
        boardprepUserId: currentUser.id,
      });
    },
    [canEdit, collaboration.connection, currentUser.id],
  );

  const addAnnotation = useCallback(
    (
      type: PdfAnnotationType,
      start: PdfPoint,
      end: PdfPoint,
      points: PdfPoint[] = [],
    ): void => {
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);

      if (
        (type === "highlight" || type === "underline") &&
        width < 0.008 &&
        height < 0.008
      ) {
        return;
      }

      const id = crypto.randomUUID();
      const annotation: PdfAnnotation = {
        authorId: currentUser.id,
        authorName: currentUser.displayName,
        color: collaboration.connection?.user.color ?? "#7352FA",
        createdAt: new Date().toISOString(),
        height:
          type === "sticky" || type === "comment"
            ? 0.055
            : Math.max(height, type === "underline" ? 0.006 : 0.012),
        id,
        page,
        points,
        revision,
        text: "",
        type,
        width:
          type === "sticky" || type === "comment"
            ? 0.045
            : Math.max(width, 0.01),
        x: type === "draw" ? 0 : Math.min(start.x, end.x),
        y: type === "draw" ? 0 : Math.min(start.y, end.y),
      };
      transact((document) =>
        document.getMap<PdfAnnotation>("pdf-annotations").set(id, annotation),
      );
      setSelectedId(id);
      setTextDraft("");
      setReplyText("");
      setCommentsOpen(annotationUsesComments(type));
    },
    [collaboration.connection, currentUser, page, revision, transact],
  );

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (scrollMode || !canEdit || !revision || event.button !== 0) return;
    const point = getPoint(event);

    if (selectedTool === "sticky" || selectedTool === "comment") {
      addAnnotation(selectedTool, point, point);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(null);
    setDraft({
      current: point,
      points: selectedTool === "draw" ? [point] : [],
      start: point,
      type: selectedTool,
    });
  };

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ): void => {
    if (!draft) return;
    const point = getPoint(event);
    setDraft((current) =>
      current
        ? {
            ...current,
            current: point,
            points:
              current.type === "draw"
                ? [...current.points, point].slice(-2_000)
                : current.points,
          }
        : null,
    );
  };

  const finishDraft = (): void => {
    if (!draft) return;
    addAnnotation(draft.type, draft.start, draft.current, draft.points);
    setDraft(null);
  };

  const saveAnnotationText = (): void => {
    if (!selectedAnnotation) return;
    transact((document) => {
      document
        .getMap<PdfAnnotation>("pdf-annotations")
        .set(selectedAnnotation.id, {
          ...selectedAnnotation,
          text: textDraft.trim().slice(0, 4_000),
        });
    });
  };

  const deleteSelected = (): void => {
    if (!selectedAnnotation) return;
    transact((document) => {
      document.getMap("pdf-annotations").delete(selectedAnnotation.id);
      const replyMap = document.getMap<unknown>("pdf-replies");
      replyMap.forEach((value, key) => {
        if (readPdfReply(value)?.annotationId === selectedAnnotation.id) {
          replyMap.delete(key);
        }
      });
    });
    setSelectedId(null);
  };

  const addReply = (): void => {
    const text = replyText.trim();
    if (!selectedAnnotation || !text) return;
    const id = crypto.randomUUID();
    const reply: PdfReply = {
      annotationId: selectedAnnotation.id,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      createdAt: new Date().toISOString(),
      id,
      revision,
      text: text.slice(0, 1_200),
    };
    transact((document) =>
      document.getMap<PdfReply>("pdf-replies").set(id, reply),
    );
    setReplyText("");
  };

  const toggleBookmark = (): void => {
    transact((document) => {
      const bookmarks = document.getMap<boolean>("pdf-bookmarks");
      const key = `${revision}:${page}`;
      if (bookmarks.get(key)) bookmarks.delete(key);
      else bookmarks.set(key, true);
    });
  };

  const uploadPdf = async (file: File): Promise<void> => {
    if (!canManageAsset) return;

    setIsUploading(true);
    setFileMessage("");

    try {
      const validated = await validatePdfUpload(file);
      const startResponse = await fetch(apiPath, {
        body: JSON.stringify({
          fileName: validated.fileName,
          mimeType: file.type,
          size: validated.size,
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const start = (await startResponse.json()) as UploadStartResponse;

      if (
        !startResponse.ok ||
        typeof start.signedUrl !== "string" ||
        typeof start.revision !== "string" ||
        typeof start.fileName !== "string"
      ) {
        throw new Error(readError(start, "The secure upload could not start."));
      }

      const uploadBody = new FormData();
      uploadBody.append("cacheControl", "3600");
      uploadBody.append("", file);
      const storageResponse = await fetch(start.signedUrl, {
        body: uploadBody,
        headers: { "x-upsert": "false" },
        method: "PUT",
      });

      if (!storageResponse.ok) {
        throw new Error("The PDF could not be uploaded to private storage.");
      }

      const finishResponse = await fetch(apiPath, {
        body: JSON.stringify({
          fileName: start.fileName,
          revision: start.revision,
          size: validated.size,
        }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const finish = (await finishResponse.json()) as UploadFinishResponse;

      if (!finishResponse.ok || !isRoomPdfAsset(finish.asset)) {
        throw new Error(
          readError(finish, "The uploaded PDF could not be published."),
        );
      }

      setAsset(finish.asset);
      setPage(1);
      setNumPages(0);
      setSelectedId(null);
      setFileMessage(`${finish.asset.fileName} is now shared with the room.`);
      router.refresh();
    } catch (error) {
      setFileMessage(
        error instanceof Error
          ? error.message
          : "The PDF could not be uploaded.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
              <button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {isUploading ? (
                  <RefreshCw className="spin" aria-hidden="true" size={16} />
                ) : (
                  <Upload aria-hidden="true" size={16} />
                )}
                {asset ? "Replace PDF" : "Upload PDF"}
              </button>
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
        <div className="pdf-empty-state" role="status">
          <RefreshCw aria-hidden="true" size={30} />
          <strong>Refreshing secure PDF access…</strong>
          <p>The shared document will open automatically.</p>
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
            <button onClick={() => fileInputRef.current?.click()} type="button">
              Choose PDF
            </button>
          ) : null}
        </div>
      ) : (
        <div
          className={`pdf-studio${commentsOpen ? "" : " pdf-studio--comments-collapsed"}`}
        >
          <div className="pdf-canvas-column">
            <div className="pdf-toolbar" aria-label="PDF annotation tools">
              <button
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
              </button>
              <button
                aria-controls="pdf-comments-panel"
                aria-expanded={commentsOpen}
                aria-label={
                  commentsOpen
                    ? "Hide comments and notes"
                    : "Show comments and notes"
                }
                className="pdf-comments-toggle pdf-toolbar__mobile-primary"
                onClick={() => setCommentsOpen((isOpen) => !isOpen)}
                title={
                  commentsOpen
                    ? "Hide comments and notes"
                    : "Show comments and notes"
                }
                type="button"
              >
                {commentsOpen ? (
                  <PanelRightClose aria-hidden="true" size={18} />
                ) : (
                  <PanelRightOpen aria-hidden="true" size={18} />
                )}
                <span className="pdf-comments-toggle__label">
                  Notes &amp; comments
                </span>
              </button>
              {TOOL_LABELS.map(({ icon: Icon, label, type }) => (
                <button
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
                </button>
              ))}
              <button
                aria-pressed={bookmarkedPages.has(page)}
                className={`pdf-toolbar__mobile-secondary${bookmarkedPages.has(page) ? " is-active" : ""}`}
                disabled={!canEdit}
                onClick={toggleBookmark}
                title="Bookmark page"
                type="button"
              >
                <Bookmark aria-hidden="true" size={16} />
                <span>Bookmark</span>
              </button>
              <button
                aria-label="Zoom out"
                className="pdf-toolbar__mobile-secondary"
                disabled={zoom <= 0.75}
                onClick={() => setZoom((value) => Math.max(0.75, value - 0.25))}
                title="Zoom out"
                type="button"
              >
                <ZoomOut aria-hidden="true" size={16} />
              </button>
              <span className="pdf-zoom-value pdf-toolbar__mobile-secondary">
                {Math.round(zoom * 100)}%
              </span>
              <button
                aria-label="Zoom in"
                className="pdf-toolbar__mobile-secondary"
                disabled={zoom >= 1.75}
                onClick={() => setZoom((value) => Math.min(1.75, value + 0.25))}
                title="Zoom in"
                type="button"
              >
                <ZoomIn aria-hidden="true" size={16} />
              </button>
              <MobileToolsMenu
                active={
                  (!scrollMode &&
                    !MOBILE_PRIMARY_PDF_TOOLS.has(selectedTool)) ||
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
                      <button
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
                      </button>
                    ))}
                    <button
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
                    </button>
                    <div className="mobile-tools-dialog__control mobile-tools-dialog__control--wide">
                      <span>Page zoom</span>
                      <div className="mobile-tools-dialog__stepper">
                        <button
                          aria-label="Zoom out"
                          disabled={zoom <= 0.75}
                          onClick={() =>
                            setZoom((value) => Math.max(0.75, value - 0.25))
                          }
                          type="button"
                        >
                          <ZoomOut aria-hidden="true" size={18} />
                        </button>
                        <strong>{Math.round(zoom * 100)}%</strong>
                        <button
                          aria-label="Zoom in"
                          disabled={zoom >= 1.75}
                          onClick={() =>
                            setZoom((value) => Math.min(1.75, value + 0.25))
                          }
                          type="button"
                        >
                          <ZoomIn aria-hidden="true" size={18} />
                        </button>
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
                      <button
                        className="mobile-tool-action"
                        disabled={isUploading}
                        onClick={() => {
                          fileInputRef.current?.click();
                          close();
                        }}
                        type="button"
                      >
                        {isUploading ? (
                          <RefreshCw
                            className="spin"
                            aria-hidden="true"
                            size={18}
                          />
                        ) : (
                          <Upload aria-hidden="true" size={18} />
                        )}
                        <span>{asset ? "Replace PDF" : "Upload PDF"}</span>
                      </button>
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
                  <button onClick={collaboration.reconnect} type="button">
                    Retry
                  </button>
                ) : null}
              </div>
            </div>

            <div className="pdf-page-host" ref={pageHostRef}>
              <Document
                error={
                  <p className="pdf-load-state">
                    This PDF could not be rendered.
                  </p>
                }
                file={asset.signedUrl}
                loading={<p className="pdf-load-state">Opening PDF…</p>}
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
                  <div
                    className={`pdf-annotation-layer pdf-annotation-layer--${scrollMode ? "scroll" : selectedTool}`}
                    onPointerCancel={finishDraft}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishDraft}
                  >
                    <svg
                      aria-hidden="true"
                      className="pdf-drawing-layer"
                      viewBox="0 0 1 1"
                      preserveAspectRatio="none"
                    >
                      {pageAnnotations
                        .filter((annotation) => annotation.type === "draw")
                        .map((annotation) => (
                          <polyline
                            className={
                              selectedId === annotation.id ? "is-selected" : ""
                            }
                            key={annotation.id}
                            onPointerDown={(event) => {
                              event.stopPropagation();
                              selectAnnotation(annotation);
                            }}
                            points={annotation.points
                              .map((point) => `${point.x},${point.y}`)
                              .join(" ")}
                            stroke={annotation.color}
                          />
                        ))}
                      {draft?.type === "draw" ? (
                        <polyline
                          className="is-draft"
                          points={draft.points
                            .map((point) => `${point.x},${point.y}`)
                            .join(" ")}
                        />
                      ) : null}
                    </svg>
                    {pageAnnotations
                      .filter((annotation) => annotation.type !== "draw")
                      .map((annotation) => (
                        <button
                          aria-label={`${annotation.type} by ${annotation.authorName}`}
                          className={`pdf-mark pdf-mark--${annotation.type}${selectedId === annotation.id ? " is-selected" : ""}`}
                          key={annotation.id}
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={() => selectAnnotation(annotation)}
                          style={
                            {
                              height: `${annotation.height * 100}%`,
                              left: `${annotation.x * 100}%`,
                              top: `${annotation.y * 100}%`,
                              width: `${annotation.width * 100}%`,
                              "--mark-color": annotation.color,
                            } as React.CSSProperties
                          }
                          type="button"
                        >
                          {annotation.type === "sticky" ? (
                            <StickyNote aria-hidden="true" size={14} />
                          ) : null}
                          {annotation.type === "comment" ? (
                            <MessageSquare aria-hidden="true" size={14} />
                          ) : null}
                        </button>
                      ))}
                    {draft && draft.type !== "draw" ? (
                      <span
                        className={`pdf-mark pdf-mark--${draft.type} is-draft`}
                        style={{
                          height: `${Math.max(Math.abs(draft.current.y - draft.start.y), 0.006) * 100}%`,
                          left: `${Math.min(draft.start.x, draft.current.x) * 100}%`,
                          top: `${Math.min(draft.start.y, draft.current.y) * 100}%`,
                          width: `${Math.max(Math.abs(draft.current.x - draft.start.x), 0.01) * 100}%`,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </Document>
            </div>

            <div className="pdf-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" size={16} /> Previous
              </button>
              <span>
                Page {page} of {numPages || "…"}
              </span>
              <button
                disabled={page >= numPages}
                onClick={() => setPage((value) => value + 1)}
                type="button"
              >
                Next <ChevronRight aria-hidden="true" size={16} />
              </button>
            </div>
          </div>

          {commentsOpen ? (
            <aside
              className="pdf-comments"
              id="pdf-comments-panel"
              aria-label="PDF comments"
            >
              <div className="pdf-comments__heading">
                <div>
                  <p className="sidebar-label">Page {page}</p>
                  <h2>Comments & notes</h2>
                </div>
                <div className="pdf-comments__heading-actions">
                  <span>{pageComments.length}</span>
                  <button
                    aria-label="Close comments and notes"
                    className="pdf-comments__close"
                    onClick={() => setCommentsOpen(false)}
                    type="button"
                  >
                    <PanelRightClose aria-hidden="true" size={18} />
                  </button>
                </div>
              </div>
              {bookmarkedPages.size ? (
                <div className="pdf-bookmarks">
                  <strong>Bookmarks</strong>
                  <div>
                    {[...bookmarkedPages]
                      .sort((a, b) => a - b)
                      .map((bookmarkedPage) => (
                        <button
                          key={bookmarkedPage}
                          onClick={() => setPage(bookmarkedPage)}
                          type="button"
                        >
                          {bookmarkedPage}
                        </button>
                      ))}
                  </div>
                </div>
              ) : null}
              <div className="pdf-comment-list">
                {pageComments.map((annotation) => (
                  <button
                    className={selectedId === annotation.id ? "is-active" : ""}
                    key={annotation.id}
                    onClick={() => selectAnnotation(annotation)}
                    type="button"
                  >
                    <span style={{ background: annotation.color }}>
                      {annotation.authorName.charAt(0)}
                    </span>
                    <div>
                      <strong>{annotation.authorName}</strong>
                      <p>{annotation.text || "Add a note…"}</p>
                    </div>
                  </button>
                ))}
                {pageComments.length === 0 ? (
                  <p className="pdf-comment-empty">No page comments yet.</p>
                ) : null}
              </div>

              {selectedAnnotation ? (
                <div className="pdf-comment-editor">
                  <div className="pdf-comment-editor__heading">
                    <strong>{selectedAnnotation.type}</strong>
                    {canEdit ? (
                      <button
                        aria-label="Delete annotation"
                        onClick={deleteSelected}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    ) : null}
                  </div>
                  <textarea
                    disabled={!canEdit}
                    maxLength={4000}
                    onChange={(event) => setTextDraft(event.target.value)}
                    placeholder="Add context for your study partners…"
                    value={textDraft}
                  />
                  {canEdit ? (
                    <button onClick={saveAnnotationText} type="button">
                      Save note
                    </button>
                  ) : null}
                  <div className="pdf-replies">
                    {replies
                      .filter(
                        (reply) => reply.annotationId === selectedAnnotation.id,
                      )
                      .map((reply) => (
                        <div key={reply.id}>
                          <strong>{reply.authorName}</strong>
                          <p>{reply.text}</p>
                        </div>
                      ))}
                  </div>
                  {canEdit ? (
                    <div className="pdf-reply-form">
                      <input
                        maxLength={1200}
                        onChange={(event) => setReplyText(event.target.value)}
                        placeholder="Reply…"
                        value={replyText}
                      />
                      <button
                        disabled={!replyText.trim()}
                        onClick={addReply}
                        type="button"
                      >
                        Reply
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="pdf-comment-empty">
                  Select a mark to view its details.
                </p>
              )}
            </aside>
          ) : null}
        </div>
      )}
    </section>
  );
}

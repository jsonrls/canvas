import type * as Y from "yjs";
import { DraftMark } from "@/components/collaboration/pdf/types";
import type { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  type PdfAnnotation,
  type PdfAnnotationType,
  type PdfPoint,
  type PdfReply,
  readPdfReply,
} from "@/lib/pdf-annotations/model";
import {
  annotationUsesComments,
  getPoint,
} from "@/lib/pdf-annotations/study-tool";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo, useState } from "react";

export function usePdfAnnotations({
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
}: {
  annotations: PdfAnnotation[];
  selectedId: string | null;
  page: number;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setCommentsOpen: Dispatch<SetStateAction<boolean>>;
  currentUser: { displayName: string; id: string };
  collaboration: ReturnType<typeof useCollaborativeTool>;
  transact: (change: (document: Y.Doc) => void) => void;
  revision: string;
  scrollMode: boolean;
  canEdit: boolean;
  selectedTool: PdfAnnotationType;
}) {
  const [draft, setDraft] = useState<DraftMark | null>(null);

  const [replyText, setReplyText] = useState("");

  const [textDraft, setTextDraft] = useState("");

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

  const selectAnnotation = useCallback(
    (annotation: PdfAnnotation): void => {
      setSelectedId(annotation.id);
      setTextDraft(annotation.text);
      setReplyText("");
      setCommentsOpen(annotationUsesComments(annotation.type));
    },
    [setCommentsOpen, setSelectedId],
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
    [
      collaboration.connection,
      currentUser,
      page,
      revision,
      transact,
      setCommentsOpen,
      setSelectedId,
    ],
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
  return {
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
  };
}

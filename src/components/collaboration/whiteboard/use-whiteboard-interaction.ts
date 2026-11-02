import {
  DraftElement,
  MoveSession,
  ResizeSession,
  WhiteboardTool,
} from "@/components/collaboration/whiteboard/types";
import {
  getBoardPoint,
  moveWhiteboardElement,
} from "@/lib/whiteboard/geometry";
import {
  panCamera,
  resizeWhiteboardElement,
  type ResizeHandle,
  type ViewportSize,
  type WhiteboardCamera,
  type WhiteboardElement,
  type WhiteboardElementType,
  type WhiteboardPoint,
} from "@/lib/whiteboard/model";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

export function useWhiteboardInteraction({
  currentUser,
  drawingColor,
  upsertElement,
  autoAnswerTriggerRef,
  setSelectedId,
  svgRef,
  hasInteractedWithBoardRef,
  canEdit,
  camera,
  viewport,
  laserEnabled,
  publishLaser,
  tool,
  setTextPlacement,
  pendingImage,
  setPendingImage,
  setImageMessage,
  setTool,
  setCamera,
  elements,
}: {
  currentUser: { displayName: string; id: string };
  drawingColor: string;
  upsertElement: (element: WhiteboardElement) => void;
  autoAnswerTriggerRef: RefObject<{
    id: string;
    type: WhiteboardElementType;
  } | null>;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  svgRef: RefObject<SVGSVGElement | null>;
  hasInteractedWithBoardRef: RefObject<boolean>;
  canEdit: boolean;
  camera: WhiteboardCamera;
  viewport: ViewportSize;
  laserEnabled: boolean;
  publishLaser: (point: WhiteboardPoint) => void;
  tool: WhiteboardTool;
  setTextPlacement: Dispatch<SetStateAction<WhiteboardPoint | null>>;
  pendingImage: string;
  setPendingImage: Dispatch<SetStateAction<string>>;
  setImageMessage: Dispatch<SetStateAction<string>>;
  setTool: Dispatch<SetStateAction<WhiteboardTool>>;
  setCamera: Dispatch<SetStateAction<WhiteboardCamera>>;
  elements: WhiteboardElement[];
}) {
  const [draft, setDraft] = useState<DraftElement | null>(null);

  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(
    null,
  );

  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);

  const [isPanning, setIsPanning] = useState(false);

  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(
    null,
  );

  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const insertElement = useCallback(
    (
      type: WhiteboardElementType,
      start: WhiteboardPoint,
      end: WhiteboardPoint,
      points: WhiteboardPoint[] = [],
      text = "",
      src = "",
    ): WhiteboardElement => {
      const id = crypto.randomUUID();
      const isLine = type === "line" || type === "arrow";
      const element: WhiteboardElement = {
        authorId: currentUser.id,
        authorName: currentUser.displayName || "Study partner",
        color: drawingColor,
        createdAt: new Date().toISOString(),
        height: isLine
          ? end.y - start.y
          : Math.max(8, Math.abs(end.y - start.y)),
        id,
        points,
        src,
        text,
        type,
        width: isLine
          ? end.x - start.x
          : Math.max(8, Math.abs(end.x - start.x)),
        x: isLine ? start.x : Math.min(start.x, end.x),
        y: isLine ? start.y : Math.min(start.y, end.y),
      };
      upsertElement(element);
      autoAnswerTriggerRef.current = { id, type };
      setSelectedId(id);
      return element;
    },
    [
      currentUser.displayName,
      currentUser.id,
      drawingColor,
      upsertElement,
      autoAnswerTriggerRef,
      setSelectedId,
    ],
  );

  const handlePointerDown = (
    event: React.PointerEvent<SVGSVGElement>,
  ): void => {
    if (!svgRef.current) return;
    hasInteractedWithBoardRef.current = true;

    // Middle mouse or space+click for panning
    if (event.button === 1 || (event.button === 0 && isSpacePressed)) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsPanning(true);
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }

    if (!canEdit || event.button !== 0) return;
    const point = getBoardPoint(
      camera,
      viewport,
      svgRef.current,
      event.clientX,
      event.clientY,
    );
    setSelectedId(null);
    setResizeSession(null);

    if (laserEnabled) publishLaser(point);

    if (tool === "select") return;
    if (tool === "text") {
      setTextPlacement(point);
      return;
    }
    if (tool === "image") {
      if (pendingImage) {
        insertElement(
          "image",
          point,
          { x: point.x + 280, y: point.y + 180 },
          [],
          "",
          pendingImage,
        );
        setPendingImage("");
        setImageMessage("");
        setTool("select");
      }
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraft({
      current: point,
      points: tool === "draw" ? [point] : [],
      start: point,
      type: tool,
    });
  };

  const handlePointerMove = (
    event: React.PointerEvent<SVGSVGElement>,
  ): void => {
    if (!svgRef.current) return;

    // Handle panning
    if (
      isPanning &&
      panStart &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      const deltaX = event.clientX - panStart.x;
      const deltaY = event.clientY - panStart.y;
      setCamera((current) => panCamera(current, viewport, deltaX, deltaY));
      setPanStart({ x: event.clientX, y: event.clientY });
      return;
    }

    const point = getBoardPoint(
      camera,
      viewport,
      svgRef.current,
      event.clientX,
      event.clientY,
    );

    if (laserEnabled) publishLaser(point);

    if (moveSession) {
      const element = elements.find((el) => el.id === moveSession.elementId);
      if (element) {
        upsertElement(moveWhiteboardElement(element, moveSession, point));
      }
      return;
    }

    if (resizeSession) {
      const next = resizeWhiteboardElement(
        resizeSession.origin,
        resizeSession.handle,
        point,
      );
      upsertElement(next);
      return;
    }

    if (!draft) return;
    setDraft((current) =>
      current
        ? {
            ...current,
            current: point,
            points:
              current.type === "draw"
                ? [...current.points, point].slice(-4_000)
                : current.points,
          }
        : null,
    );
  };

  const finishPointer = (event: React.PointerEvent<SVGSVGElement>): void => {
    // Release pointer capture if it is held
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore potential DOMException if pointer capture wasn't active
    }

    if (moveSession) {
      setMoveSession(null);
      return;
    }
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    if (resizeSession) {
      setResizeSession(null);
      return;
    }
    if (!draft) return;
    insertElement(draft.type, draft.start, draft.current, draft.points);
    setDraft(null);
  };

  const selectElement = (
    event: React.PointerEvent<SVGElement>,
    id: string,
  ): void => {
    if (tool !== "select") return;
    event.stopPropagation();
    setSelectedId(id);
    setResizeSession(null);

    const element = elements.find((el) => el.id === id);
    if (element && canEdit) {
      const svg = event.currentTarget.ownerSVGElement;
      if (!svg) return;
      const point = getBoardPoint(
        camera,
        viewport,
        svg,
        event.clientX,
        event.clientY,
      );
      setMoveSession({
        elementId: id,
        initialPoints: element.points || [],
        initialX: element.x,
        initialY: element.y,
        startPoint: point,
      });
      svg.setPointerCapture(event.pointerId);
    }
  };

  const beginResize = (
    event: React.PointerEvent<SVGRectElement>,
    element: WhiteboardElement,
    handle: ResizeHandle,
  ): void => {
    if (!canEdit || tool !== "select") return;
    event.stopPropagation();
    event.preventDefault();
    setSelectedId(element.id);
    setResizeSession({ handle, origin: element });
    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.code === "Space") {
        const active = document.activeElement;
        if (
          active &&
          (active.tagName === "INPUT" ||
            active.tagName === "TEXTAREA" ||
            (active instanceof HTMLElement && active.isContentEditable))
        ) {
          return;
        }
        event.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (event.code === "Space") {
        setIsSpacePressed(false);
      }
    };

    const handleBlur = (): void => {
      setIsSpacePressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  return {
    draft,
    setDraft,
    resizeSession,
    setResizeSession,
    moveSession,
    setMoveSession,
    isPanning,
    isSpacePressed,
    insertElement,
    handlePointerDown,
    handlePointerMove,
    finishPointer,
    selectElement,
    beginResize,
  };
}

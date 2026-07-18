"use client";

import {
  ArrowRight,
  Circle,
  Eraser,
  Maximize2,
  HelpCircle,
  ImagePlus,
  Minus,
  MousePointer2,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Square,
  Trash2,
  Type,
  Undo2,
  Redo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import { useCollaborativeTool } from "@/hooks/use-collaborative-tool";
import {
  cameraViewBox,
  clampBoardPoint,
  clampCamera,
  createInitialCamera,
  getElementBounds,
  MAX_ZOOM,
  MIN_ZOOM,
  panCamera,
  readWhiteboardElement,
  resizeWhiteboardElement,
  screenToWorld,
  type ResizeHandle,
  type ViewportSize,
  type WhiteboardCamera,
  type WhiteboardElement,
  type WhiteboardElementType,
  type WhiteboardPoint,
  WHITEBOARD_HEIGHT,
  WHITEBOARD_MAX_X,
  WHITEBOARD_MAX_Y,
  WHITEBOARD_MIN_X,
  WHITEBOARD_MIN_Y,
  WHITEBOARD_WIDTH,
  zoomCameraAt,
} from "@/lib/whiteboard/model";

interface WhiteboardStudyToolProps {
  canEdit: boolean;
  currentUser: { displayName: string; id: string };
  initialState: string | null;
  roomId: string;
}

type WhiteboardTool =
  | "select"
  | "draw"
  | "rectangle"
  | "ellipse"
  | "arrow"
  | "line"
  | "text"
  | "image"
  | "laser";

interface DraftElement {
  current: WhiteboardPoint;
  points: WhiteboardPoint[];
  start: WhiteboardPoint;
  type: Extract<
    WhiteboardElementType,
    "arrow" | "draw" | "ellipse" | "line" | "rectangle"
  >;
}

interface ResizeSession {
  handle: ResizeHandle;
  origin: WhiteboardElement;
}

interface MoveSession {
  elementId: string;
  initialPoints: WhiteboardPoint[];
  initialX: number;
  initialY: number;
  startPoint: WhiteboardPoint;
}

const TOOLS: Array<{
  icon: typeof MousePointer2;
  label: string;
  tool: WhiteboardTool;
}> = [
  { icon: MousePointer2, label: "Select", tool: "select" },
  { icon: Pencil, label: "Draw", tool: "draw" },
  { icon: Square, label: "Rectangle", tool: "rectangle" },
  { icon: Circle, label: "Ellipse", tool: "ellipse" },
  { icon: ArrowRight, label: "Arrow", tool: "arrow" },
  { icon: Minus, label: "Line", tool: "line" },
  { icon: Type, label: "Text", tool: "text" },
  { icon: ImagePlus, label: "Image", tool: "image" },
  { icon: Radio, label: "Laser", tool: "laser" },
];
const SAFE_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const HANDLE_SIZE = 12;

function getBoardPoint(
  camera: WhiteboardCamera,
  _viewport: ViewportSize,
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): WhiteboardPoint {
  const bounds = svg.getBoundingClientRect();
  const originX = bounds.left;
  const originY = bounds.top;
  // Use the rendered SVG size for pointer conversion. The ResizeObserver
  // value can briefly lag during responsive/sidebar layout changes, which
  // disproportionately misplaces strokes near the canvas edges.
  const viewport = {
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
  };
  const worldPoint = screenToWorld(
    camera,
    viewport,
    clientX,
    clientY,
    originX,
    originY,
  );
  return clampBoardPoint(worldPoint);
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });
}

function getResizeHandles(
  element: WhiteboardElement,
): Array<{ handle: ResizeHandle; x: number; y: number }> {
  if (element.type === "line" || element.type === "arrow") {
    return [
      { handle: "start", x: element.x, y: element.y },
      {
        handle: "end",
        x: element.x + element.width,
        y: element.y + element.height,
      },
    ];
  }

  const bounds = getElementBounds(element);
  return [
    { handle: "nw", x: bounds.x, y: bounds.y },
    { handle: "ne", x: bounds.x + bounds.width, y: bounds.y },
    { handle: "sw", x: bounds.x, y: bounds.y + bounds.height },
    {
      handle: "se",
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    },
  ];
}

function handleCursor(handle: ResizeHandle): string {
  switch (handle) {
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "start":
    case "end":
      return "move";
  }
}

export default function WhiteboardStudyTool({
  canEdit,
  currentUser,
  initialState,
  roomId,
}: WhiteboardStudyToolProps): React.ReactElement {
  const [draft, setDraft] = useState<DraftElement | null>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [imageMessage, setImageMessage] = useState("");
  const [pendingImage, setPendingImage] = useState("");
  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(
    null,
  );
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [textPlacement, setTextPlacement] = useState<WhiteboardPoint | null>(
    null,
  );
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");
  const [tool, setTool] = useState<WhiteboardTool>("select");
  const [camera, setCamera] = useState<WhiteboardCamera>({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [viewport, setViewport] = useState<ViewportSize>({
    width: 1_600,
    height: 960,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#3871c2");
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const collaboration = useCollaborativeTool({
    canEdit,
    currentUser,
    initialState,
    kind: "whiteboard",
    roomId,
  });

  useEffect(() => {
    const document = collaboration.connection?.document;
    if (!document) return;
    const elementMap = document.getMap<unknown>("whiteboard-elements");
    const undoManager = new Y.UndoManager(elementMap);
    undoManagerRef.current = undoManager;
    const refreshHistory = (): void => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    };
    undoManager.on("stack-item-added", refreshHistory);
    undoManager.on("stack-item-popped", refreshHistory);
    undoManager.on("stack-cleared", refreshHistory);
    const refresh = (): void => {
      setElements(
        Array.from(elementMap.values())
          .map(readWhiteboardElement)
          .filter((element): element is WhiteboardElement => element !== null)
          .sort((first, second) =>
            first.createdAt.localeCompare(second.createdAt),
          ),
      );
    };
    refresh();
    elementMap.observe(refresh);
    return () => {
      elementMap.unobserve(refresh);
      undoManager.destroy();
      if (undoManagerRef.current === undoManager) undoManagerRef.current = null;
    };
  }, [collaboration.connection]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewport({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize camera on mount
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setViewport({ width, height });
      setCamera(createInitialCamera({ width, height }));
    }
  }, []);

  // Spacebar key tracking for panning
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

  // Laser clean-up when switching tools
  useEffect(() => {
    if (tool !== "laser") {
      collaboration.setAwarenessField("laser", null);
    }
  }, [tool, collaboration]);

  const selectedElement = useMemo(
    () => elements.find((element) => element.id === selectedId) ?? null,
    [elements, selectedId],
  );

  const transact = useCallback(
    (change: (document: Y.Doc) => void): void => {
      const document = collaboration.connection?.document;
      if (!canEdit || !document) return;
      document.transact(() => change(document));
      const undoManager = undoManagerRef.current;
      if (undoManager) {
        setCanUndo(undoManager.canUndo());
        setCanRedo(undoManager.canRedo());
      }
    },
    [canEdit, collaboration.connection],
  );

  const upsertElement = useCallback(
    (element: WhiteboardElement): void => {
      transact((document) =>
        document
          .getMap<WhiteboardElement>("whiteboard-elements")
          .set(element.id, element),
      );
    },
    [transact],
  );

  const insertElement = useCallback(
    (
      type: WhiteboardElementType,
      start: WhiteboardPoint,
      end: WhiteboardPoint,
      points: WhiteboardPoint[] = [],
      text = "",
      src = "",
    ): void => {
      const id = crypto.randomUUID();
      const isLine = type === "line" || type === "arrow";
      const element: WhiteboardElement = {
        authorId: currentUser.id,
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
      setSelectedId(id);
    },
    [currentUser.id, drawingColor, upsertElement],
  );

  const handlePointerDown = (
    event: React.PointerEvent<SVGSVGElement>,
  ): void => {
    if (!svgRef.current) return;

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

    if (tool === "select") return;
    if (tool === "laser") {
      collaboration.setAwarenessField("laser", point);
      return;
    }
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

    if (tool === "laser") {
      collaboration.setAwarenessField("laser", point);
      return;
    }

    if (moveSession) {
      const element = elements.find((el) => el.id === moveSession.elementId);
      if (element) {
        const deltaX = point.x - moveSession.startPoint.x;
        const deltaY = point.y - moveSession.startPoint.y;

        const isLine = element.type === "line" || element.type === "arrow";
        let nextX = moveSession.initialX + deltaX;
        let nextY = moveSession.initialY + deltaY;

        // Clamp element bounds within board boundaries
        if (isLine) {
          const startX = nextX;
          const startY = nextY;
          const endX = nextX + element.width;
          const endY = nextY + element.height;

          const minX = Math.min(startX, endX);
          const maxX = Math.max(startX, endX);
          const minY = Math.min(startY, endY);
          const maxY = Math.max(startY, endY);

          if (minX < WHITEBOARD_MIN_X) {
            nextX += WHITEBOARD_MIN_X - minX;
          } else if (maxX > WHITEBOARD_MAX_X) {
            nextX -= maxX - WHITEBOARD_MAX_X;
          }

          if (minY < WHITEBOARD_MIN_Y) {
            nextY += WHITEBOARD_MIN_Y - minY;
          } else if (maxY > WHITEBOARD_MAX_Y) {
            nextY -= maxY - WHITEBOARD_MAX_Y;
          }
        } else {
          nextX = Math.max(
            WHITEBOARD_MIN_X,
            Math.min(WHITEBOARD_MAX_X - element.width, nextX),
          );
          nextY = Math.max(
            WHITEBOARD_MIN_Y,
            Math.min(WHITEBOARD_MAX_Y - element.height, nextY),
          );
        }

        const updatedPoints = moveSession.initialPoints.map((p) =>
          clampBoardPoint({
            x: p.x + deltaX,
            y: p.y + deltaY,
          }),
        );

        upsertElement({
          ...element,
          points: updatedPoints,
          x: nextX,
          y: nextY,
        });
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
    if (tool !== "laser") {
      collaboration.setAwarenessField("laser", null);
    }

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

  const handleWheel = (event: React.WheelEvent<SVGSVGElement>): void => {
    if (!svgRef.current) return;
    event.preventDefault();

    const bounds = svgRef.current.getBoundingClientRect();
    const originX = bounds.left;
    const originY = bounds.top;

    // Zoom if Ctrl (Windows/Linux) or Cmd (Mac) key is held down
    if (event.ctrlKey || event.metaKey) {
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      const nextZoom = camera.zoom * zoomFactor;

      setCamera((current) =>
        zoomCameraAt(
          current,
          viewport,
          nextZoom,
          event.clientX,
          event.clientY,
          originX,
          originY,
        ),
      );
    } else {
      // Pan otherwise (scroll wheel/swipe pans the canvas)
      setCamera((current) =>
        panCamera(current, viewport, -event.deltaX, -event.deltaY),
      );
    }
  };

  const handleZoomIn = (): void => {
    if (!svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const originX = bounds.left;
    const originY = bounds.top;

    setCamera((current) =>
      zoomCameraAt(
        current,
        viewport,
        current.zoom * 1.15,
        centerX,
        centerY,
        originX,
        originY,
      ),
    );
  };

  const handleZoomOut = (): void => {
    if (!svgRef.current) return;
    const bounds = svgRef.current.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const originX = bounds.left;
    const originY = bounds.top;

    setCamera((current) =>
      zoomCameraAt(
        current,
        viewport,
        current.zoom / 1.15,
        centerX,
        centerY,
        originX,
        originY,
      ),
    );
  };

  const handleResetView = (): void => {
    setCamera(clampCamera({ x: 0, y: 0, zoom: 1 }, viewport));
  };

  const handleAutoFit = (): void => {
    if (elements.length === 0) {
      handleResetView();
      return;
    }
    const bounds = elements.reduce(
      (current, element) => {
        const next = getElementBounds(element);
        return {
          minX: Math.min(current.minX, next.x),
          minY: Math.min(current.minY, next.y),
          maxX: Math.max(current.maxX, next.x + next.width),
          maxY: Math.max(current.maxY, next.y + next.height),
        };
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
    const padding = 120;
    const contentWidth = Math.max(1, bounds.maxX - bounds.minX + padding * 2);
    const contentHeight = Math.max(1, bounds.maxY - bounds.minY + padding * 2);
    const zoom = Math.min(
      MAX_ZOOM,
      viewport.width / contentWidth,
      viewport.height / contentHeight,
    );
    setCamera(
      clampCamera(
        {
          x: bounds.minX - padding,
          y: bounds.minY - padding,
          zoom,
        },
        viewport,
      ),
    );
  };

  const handleUndo = (): void => {
    undoManagerRef.current?.undo();
    setCanUndo(undoManagerRef.current?.canUndo() ?? false);
    setCanRedo(undoManagerRef.current?.canRedo() ?? false);
  };
  const handleRedo = (): void => {
    undoManagerRef.current?.redo();
    setCanUndo(undoManagerRef.current?.canUndo() ?? false);
    setCanRedo(undoManagerRef.current?.canRedo() ?? false);
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

  const commitText = (): void => {
    const value = (editingTextValue || textValue).trim().slice(0, 600);
    if (!value) return;
    if (editingTextId) {
      const element = elements.find((item) => item.id === editingTextId);
      if (element) upsertElement({ ...element, text: value });
      setEditingTextId(null);
    } else if (textPlacement) {
      insertElement(
        "text",
        textPlacement,
        { x: textPlacement.x + 280, y: textPlacement.y + 48 },
        [],
        value,
      );
      setTextPlacement(null);
      setTextValue("");
    }
  };

  const beginTextEdit = (
    event: React.MouseEvent<SVGTextElement>,
    element: WhiteboardElement,
  ): void => {
    if (!canEdit) return;
    event.stopPropagation();
    setMoveSession(null);
    setResizeSession(null);
    setSelectedId(element.id);
    setEditingTextId(element.id);
    setEditingTextValue(element.text);
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

  const deleteSelected = (): void => {
    if (!selectedElement) return;
    transact((document) =>
      document.getMap("whiteboard-elements").delete(selectedElement.id),
    );
    setSelectedId(null);
    setResizeSession(null);
  };

  const clearAllDrawings = (): void => {
    if (!canEdit || elements.length === 0) return;
    const confirmed = window.confirm(
      "Clear all drawings on this whiteboard? This cannot be undone.",
    );
    if (!confirmed) return;
    transact((document) => {
      const elementMap = document.getMap("whiteboard-elements");
      for (const key of Array.from(elementMap.keys())) {
        elementMap.delete(key);
      }
    });
    setSelectedId(null);
    setResizeSession(null);
    setDraft(null);
  };

  const chooseImage = async (file: File): Promise<void> => {
    setImageMessage("");
    if (!SAFE_IMAGE_TYPES.has(file.type) || file.size > 1024 * 1024) {
      setImageMessage("Choose a PNG, JPEG, WebP, or GIF no larger than 1 MB.");
      return;
    }

    try {
      setPendingImage(await readImage(file));
      setTool("image");
      setImageMessage("Click the board to place the image.");
    } catch (error) {
      setImageMessage(
        error instanceof Error ? error.message : "The image could not be read.",
      );
    } finally {
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const draftElement = draft
    ? {
        authorId: currentUser.id,
        color: collaboration.connection?.user.color ?? "#3871c2",
        createdAt: "",
        height:
          draft.type === "line" || draft.type === "arrow"
            ? draft.current.y - draft.start.y
            : Math.abs(draft.current.y - draft.start.y),
        id: "draft",
        points: draft.points,
        src: "",
        text: "",
        type: draft.type,
        width:
          draft.type === "line" || draft.type === "arrow"
            ? draft.current.x - draft.start.x
            : Math.abs(draft.current.x - draft.start.x),
        x:
          draft.type === "line" || draft.type === "arrow"
            ? draft.start.x
            : Math.min(draft.start.x, draft.current.x),
        y:
          draft.type === "line" || draft.type === "arrow"
            ? draft.start.y
            : Math.min(draft.start.y, draft.current.y),
      }
    : null;

  const renderElement = (
    element: WhiteboardElement,
    isDraft = false,
  ): React.ReactNode => {
    const className = `${selectedId === element.id ? "is-selected" : ""}${isDraft ? " is-draft" : ""}`;
    const common = {
      className,
      onPointerDown: (event: React.PointerEvent<SVGElement>) =>
        selectElement(event, element.id),
      stroke: element.color,
    };

    switch (element.type) {
      case "draw":
        return (
          <polyline
            {...common}
            fill="none"
            key={element.id}
            points={element.points
              .map((point) => `${point.x},${point.y}`)
              .join(" ")}
          />
        );
      case "rectangle":
        return (
          <rect
            {...common}
            fill="transparent"
            height={element.height}
            key={element.id}
            width={element.width}
            x={element.x}
            y={element.y}
          />
        );
      case "ellipse":
        return (
          <ellipse
            {...common}
            cx={element.x + element.width / 2}
            cy={element.y + element.height / 2}
            fill="transparent"
            key={element.id}
            rx={element.width / 2}
            ry={element.height / 2}
          />
        );
      case "line":
        return (
          <line
            {...common}
            key={element.id}
            x1={element.x}
            x2={element.x + element.width}
            y1={element.y}
            y2={element.y + element.height}
          />
        );
      case "arrow":
        return (
          <line
            {...common}
            key={element.id}
            markerEnd="url(#board-arrow)"
            x1={element.x}
            x2={element.x + element.width}
            y1={element.y}
            y2={element.y + element.height}
          />
        );
      case "text":
        return (
          <text
            {...common}
            fill={element.color}
            key={element.id}
            onDoubleClick={(event) => beginTextEdit(event, element)}
            onClick={(event) => {
              if (event.detail === 2) beginTextEdit(event, element);
            }}
            stroke="none"
            x={element.x}
            y={element.y + 30}
          >
            {element.text}
          </text>
        );
      case "image":
        return (
          <image
            className={className}
            height={element.height}
            href={element.src}
            key={element.id}
            onPointerDown={(event) => selectElement(event, element.id)}
            preserveAspectRatio="xMidYMid meet"
            width={element.width}
            x={element.x}
            y={element.y}
          />
        );
    }
  };

  const renderSelectionOverlay = (
    element: WhiteboardElement,
  ): React.ReactNode => {
    if (tool !== "select") return null;

    const isLine = element.type === "line" || element.type === "arrow";
    const bounds = getElementBounds(element);
    const handles = getResizeHandles(element);

    return (
      <g className="whiteboard-selection" key={`selection-${element.id}`}>
        {!isLine ? (
          <rect
            className="whiteboard-selection__box"
            fill="none"
            height={bounds.height}
            pointerEvents="none"
            width={bounds.width}
            x={bounds.x}
            y={bounds.y}
          />
        ) : null}
        {canEdit
          ? handles.map(({ handle, x, y }) => (
              <rect
                aria-label={`Resize ${handle}`}
                className="whiteboard-resize-handle"
                fill="#ffffff"
                height={HANDLE_SIZE}
                key={handle}
                onPointerDown={(event) => beginResize(event, element, handle)}
                rx={2}
                stroke="#3871c2"
                strokeWidth={2}
                style={{ cursor: handleCursor(handle) }}
                width={HANDLE_SIZE}
                x={x - HANDLE_SIZE / 2}
                y={y - HANDLE_SIZE / 2}
              />
            ))
          : null}
      </g>
    );
  };

  return (
    <section
      className="study-tool study-tool--visual study-tool--whiteboard"
      aria-label="Whiteboard workspace"
    >
      <div className="study-tool__heading">
        <div className="study-tool__header-right">
          <div className="tool-status-row" role="status">
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
            <span>{collaboration.participants.length} active</span>
            {(collaboration.status === "error" ||
              collaboration.status === "offline") &&
            canEdit ? (
              <button onClick={collaboration.reconnect} type="button">
                <RefreshCw aria-hidden="true" size={14} /> Retry
              </button>
            ) : null}

            <button
              className="whiteboard-shortcuts-help"
              type="button"
              aria-label="Whiteboard keyboard shortcuts"
            >
              <HelpCircle size={18} />
              <div className="whiteboard-shortcuts-tooltip" role="tooltip">
                <div className="tooltip-title">Keyboard Shortcuts</div>
                <div className="tooltip-row">
                  <span>
                    <kbd>Space</kbd> + Drag / Swipe
                  </span>
                  <span className="tooltip-desc">Pan Canvas</span>
                </div>
                <div className="tooltip-row">
                  <span>
                    <kbd>Middle Click</kbd> + Drag
                  </span>
                  <span className="tooltip-desc">Pan Canvas</span>
                </div>
                <div className="tooltip-row">
                  <span>
                    <kbd>⌘/Ctrl</kbd> + Scroll
                  </span>
                  <span className="tooltip-desc">Zoom at cursor</span>
                </div>
                <div className="tooltip-row">
                  <span>Drag selected shape</span>
                  <span className="tooltip-desc">Move element</span>
                </div>
                <div className="tooltip-row">
                  <span>Drag corner handles</span>
                  <span className="tooltip-desc">Resize element</span>
                </div>
                <p className="tooltip-help-copy">
                  Select a shape to resize it with the corner handles. Scroll to
                  zoom, drag with middle mouse or Space+click to pan. Changes
                  sync live and remain available offline on this device.
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="whiteboard-toolbar" aria-label="Whiteboard tools">
        <button
          disabled={!canUndo || !canEdit}
          onClick={handleUndo}
          title="Undo"
          type="button"
        >
          <Undo2 aria-hidden="true" size={17} />
          <span>Undo</span>
        </button>
        <button
          disabled={!canRedo || !canEdit}
          onClick={handleRedo}
          title="Redo"
          type="button"
        >
          <Redo2 aria-hidden="true" size={17} />
          <span>Redo</span>
        </button>
        {TOOLS.map(({ icon: Icon, label, tool: nextTool }) => (
          <button
            aria-pressed={tool === nextTool}
            className={tool === nextTool ? "is-active" : ""}
            disabled={!canEdit}
            key={nextTool}
            onClick={() => {
              if (nextTool === "image") imageInputRef.current?.click();
              else setTool(nextTool);
            }}
            title={label}
            type="button"
          >
            <Icon aria-hidden="true" size={17} />
            <span>{label}</span>
          </button>
        ))}
        <input
          ref={imageInputRef}
          accept="image/png,image/jpeg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
          className="visually-hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void chooseImage(file);
          }}
          type="file"
        />
        <label className="whiteboard-color-picker" title="Drawing color">
          <span>Color</span>
          <input
            aria-label="Drawing color"
            disabled={!canEdit}
            onChange={(event) => setDrawingColor(event.target.value)}
            type="color"
            value={drawingColor}
          />
        </label>
        <div className="whiteboard-toolbar__zoom">
          <button
            disabled={camera.zoom <= MIN_ZOOM}
            onClick={handleZoomOut}
            title="Zoom out"
            type="button"
          >
            <Minus aria-hidden="true" size={17} />
          </button>
          <span className="zoom-level">{Math.round(camera.zoom * 100)}%</span>
          <button
            disabled={camera.zoom >= MAX_ZOOM}
            onClick={handleZoomIn}
            title="Zoom in"
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
          </button>
          <button onClick={handleResetView} title="Reset view" type="button">
            <RefreshCw aria-hidden="true" size={17} />
          </button>
          <button onClick={handleAutoFit} title="Auto-fit" type="button">
            <Maximize2 aria-hidden="true" size={17} />
          </button>
        </div>
        <div className="whiteboard-toolbar__meta" role="status">
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
          <span>{collaboration.participants.length} active</span>
          <button
            className="whiteboard-shortcuts-help"
            type="button"
            aria-label="Whiteboard keyboard shortcuts"
          >
            <HelpCircle size={18} />
            <div className="whiteboard-shortcuts-tooltip" role="tooltip">
              <div className="tooltip-title">Keyboard Shortcuts</div>
              <div className="tooltip-row">
                <span>
                  <kbd>Space</kbd> + Drag / Swipe
                </span>
                <span className="tooltip-desc">Pan Canvas</span>
              </div>
              <div className="tooltip-row">
                <span>
                  <kbd>⌘/Ctrl</kbd> + Scroll
                </span>
                <span className="tooltip-desc">Zoom at cursor</span>
              </div>
            </div>
          </button>
        </div>
        {canEdit && (selectedElement || elements.length > 0) ? (
          <div className="whiteboard-toolbar__actions">
            {selectedElement ? (
              <button
                className="whiteboard-delete"
                onClick={deleteSelected}
                type="button"
              >
                <Trash2 aria-hidden="true" size={16} /> Delete
              </button>
            ) : null}
            {elements.length > 0 ? (
              <button
                className="whiteboard-clear"
                onClick={clearAllDrawings}
                type="button"
              >
                <Eraser aria-hidden="true" size={16} /> Clear all
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {imageMessage || collaboration.message ? (
        <p className="study-tool__message" role="status">
          {imageMessage || collaboration.message}
        </p>
      ) : null}

      <div
        ref={containerRef}
        className={`whiteboard-stage whiteboard-stage--${tool}${resizeSession ? " whiteboard-stage--resizing" : ""}${isPanning ? " whiteboard-stage--panning" : ""}${isSpacePressed ? " whiteboard-stage--space-pressed" : ""}${moveSession ? " whiteboard-stage--moving" : ""}`}
      >
        <svg
          ref={svgRef}
          aria-label="Collaborative whiteboard canvas"
          onPointerCancel={finishPointer}
          onPointerDown={handlePointerDown}
          onPointerLeave={() => collaboration.setAwarenessField("laser", null)}
          onPointerMove={handlePointerMove}
          onPointerUp={finishPointer}
          onWheel={handleWheel}
          role="img"
          viewBox={cameraViewBox(camera, viewport)}
        >
          <defs>
            <marker
              id="board-arrow"
              markerHeight="8"
              markerWidth="8"
              orient="auto-start-reverse"
              refX="7"
              refY="4"
              viewBox="0 0 8 8"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="context-stroke" />
            </marker>
            <pattern
              height="24"
              id="board-grid"
              patternUnits="userSpaceOnUse"
              width="24"
            >
              <circle cx="1" cy="1" fill="#d8d1c7" r="1" />
            </pattern>
          </defs>
          <rect
            fill="url(#board-grid)"
            x={WHITEBOARD_MIN_X}
            y={WHITEBOARD_MIN_Y}
            height={WHITEBOARD_HEIGHT}
            width={WHITEBOARD_WIDTH}
          />
          {elements.map((element) => renderElement(element))}
          {draftElement ? renderElement(draftElement, true) : null}
          {selectedElement ? renderSelectionOverlay(selectedElement) : null}
          {textPlacement || editingTextId ? (
            <foreignObject
              height={52}
              width={320}
              x={
                textPlacement?.x ??
                elements.find((element) => element.id === editingTextId)?.x ??
                0
              }
              y={
                textPlacement?.y ??
                elements.find((element) => element.id === editingTextId)?.y ??
                0
              }
            >
              <input
                autoFocus
                className="whiteboard-text-editor"
                maxLength={600}
                onChange={(event) => {
                  if (editingTextId) setEditingTextValue(event.target.value);
                  else setTextValue(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitText();
                  }
                  if (event.key === "Escape") {
                    setTextPlacement(null);
                    setEditingTextId(null);
                  }
                }}
                onBlur={commitText}
                placeholder="Type text…"
                value={editingTextId ? editingTextValue : textValue}
              />
            </foreignObject>
          ) : null}
          {collaboration.participants.map((participant) => {
            const isSelf =
              participant.clientId === collaboration.connection?.user.clientId;
            return participant.laser ? (
              <g
                className="whiteboard-laser"
                key={participant.clientId}
                transform={`translate(${participant.laser.x} ${participant.laser.y})`}
              >
                <circle fill="#ef4444" r="9" />
                {!isSelf ? (
                  <text fill={participant.color} x="14" y="-12">
                    {participant.name}
                  </text>
                ) : null}
              </g>
            ) : null;
          })}
        </svg>
      </div>
    </section>
  );
}

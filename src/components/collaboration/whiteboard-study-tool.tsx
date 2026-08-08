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
  Sparkles,
  Square,
  Trash2,
  Type,
  Undo2,
  Redo2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import { MobileToolsMenu } from "@/components/collaboration/mobile-tools-menu";
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
  breakoutCode?: string;
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
  | "image";

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

interface WhiteboardAnswerPayload {
  answer?: unknown;
  error?: unknown;
}

interface WhiteboardAnswerPlacement {
  question: string;
  targetBounds: { height: number; width: number; x: number; y: number };
  targetId: string;
}

interface HoveredWhiteboardAuthor {
  authorId: string;
  color: string;
  elementId: string;
  left: number;
  name: string;
  top: number;
}

interface CollaboratorNamesPayload {
  collaborators?: unknown;
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
];
const MOBILE_PRIMARY_WHITEBOARD_TOOLS = new Set<WhiteboardTool>([
  "select",
  "draw",
  "text",
]);
const SAFE_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const HANDLE_SIZE = 12;
const LASER_TRAIL_LENGTH = 16;
const LASER_IDLE_TIMEOUT_MS = 650;
const AUTOMATIC_FIT_MAX_ZOOM = 1.5;
const AUTO_FIT_PADDING = 80;

function fitCameraToElements(
  elements: WhiteboardElement[],
  viewport: ViewportSize,
  maxZoom = MAX_ZOOM,
): WhiteboardCamera {
  if (elements.length === 0) return createInitialCamera(viewport);

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
  const contentWidth = Math.max(
    1,
    bounds.maxX - bounds.minX + AUTO_FIT_PADDING * 2,
  );
  const contentHeight = Math.max(
    1,
    bounds.maxY - bounds.minY + AUTO_FIT_PADDING * 2,
  );
  const zoom = Math.max(
    MIN_ZOOM,
    Math.min(
      maxZoom,
      viewport.width / contentWidth,
      viewport.height / contentHeight,
    ),
  );
  const viewWidth = viewport.width / zoom;
  const viewHeight = viewport.height / zoom;

  return clampCamera(
    {
      x: (bounds.minX + bounds.maxX - viewWidth) / 2,
      y: (bounds.minY + bounds.maxY - viewHeight) / 2,
      zoom,
    },
    viewport,
  );
}

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

function boundsCenter(bounds: {
  height: number;
  width: number;
  x: number;
  y: number;
}): WhiteboardPoint {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

function pointDistance(
  first: WhiteboardPoint,
  second: WhiteboardPoint,
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function distanceToBounds(
  point: WhiteboardPoint,
  bounds: { height: number; width: number; x: number; y: number },
): number {
  const dx = Math.max(
    bounds.x - point.x,
    0,
    point.x - (bounds.x + bounds.width),
  );
  const dy = Math.max(
    bounds.y - point.y,
    0,
    point.y - (bounds.y + bounds.height),
  );
  return Math.hypot(dx, dy);
}

function isPointNearBounds(
  point: WhiteboardPoint,
  bounds: { height: number; width: number; x: number; y: number },
  padding: number,
): boolean {
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  );
}

function drawPathLength(points: WhiteboardPoint[]): number {
  return points
    .slice(1)
    .reduce(
      (length, point, index) => length + pointDistance(points[index], point),
      0,
    );
}

function isCircleLikeElement(element: WhiteboardElement): boolean {
  if (element.type === "ellipse") {
    const bounds = getElementBounds(element);
    return bounds.width >= 44 && bounds.height >= 32;
  }

  if (element.type !== "draw" || element.points.length < 12) return false;

  const bounds = getElementBounds(element);
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const ratio = width / height;
  const diagonal = Math.hypot(width, height);
  const pathLength = drawPathLength(element.points);
  const endpoints = [element.points[0], element.points.at(-1)].filter(
    (point): point is WhiteboardPoint => Boolean(point),
  );
  const endpointGap =
    endpoints.length === 2
      ? pointDistance(endpoints[0], endpoints[1])
      : Infinity;

  return (
    width >= 64 &&
    height >= 40 &&
    ratio >= 0.18 &&
    ratio <= 8 &&
    (endpointGap <= diagonal * 0.38 || pathLength >= diagonal * 1.75)
  );
}

function textCenter(element: WhiteboardElement): WhiteboardPoint {
  const bounds = getElementBounds(element);
  return {
    x: bounds.x + Math.max(120, bounds.width) / 2,
    y: bounds.y + Math.max(36, bounds.height) / 2,
  };
}

function textInsideBounds(
  textElement: WhiteboardElement,
  bounds: { height: number; width: number; x: number; y: number },
): boolean {
  return isPointNearBounds(textCenter(textElement), bounds, 18);
}

function getDirectedElementEndpoints(
  element: WhiteboardElement,
): Array<{ end: WhiteboardPoint; start: WhiteboardPoint }> {
  if (element.type === "arrow" || element.type === "line") {
    const start = { x: element.x, y: element.y };
    const end = { x: element.x + element.width, y: element.y + element.height };
    return [
      { start, end },
      { start: end, end: start },
    ];
  }

  if (
    element.type === "draw" &&
    !isCircleLikeElement(element) &&
    element.points.length >= 2
  ) {
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const bounds = getElementBounds(element);
    if (
      drawPathLength(element.points) < 48 ||
      Math.hypot(bounds.width, bounds.height) < 48
    ) {
      return [];
    }
    return [
      { start, end },
      { start: end, end: start },
    ];
  }

  return [];
}

function findWhiteboardAnswerPlacement(
  elements: WhiteboardElement[],
  selectedId: string | null,
): WhiteboardAnswerPlacement | null {
  const textElements = elements.filter(
    (element) => element.type === "text" && element.text.trim().length > 0,
  );
  const circleElements = elements.filter(isCircleLikeElement);

  if (textElements.length === 0 || circleElements.length < 2) return null;

  const questionCandidates = circleElements.flatMap((circle) => {
    const bounds = getElementBounds(circle);
    return textElements
      .filter((textElement) => textInsideBounds(textElement, bounds))
      .map((textElement) => ({
        circle,
        circleBounds: bounds,
        question: textElement.text.trim(),
        textElement,
      }));
  });

  if (questionCandidates.length === 0) return null;

  const selectedElement = selectedId
    ? (elements.find((element) => element.id === selectedId) ?? null)
    : null;
  const prioritizedQuestions = [...questionCandidates].sort((first, second) => {
    const firstSelected =
      first.circle.id === selectedId || first.textElement.id === selectedId;
    const secondSelected =
      second.circle.id === selectedId || second.textElement.id === selectedId;
    if (firstSelected !== secondSelected) return firstSelected ? -1 : 1;
    return second.circle.createdAt.localeCompare(first.circle.createdAt);
  });
  const possibleTargets = circleElements.filter((circle) => {
    if (circle.id === selectedId && selectedElement?.type !== "text")
      return false;
    const bounds = getElementBounds(circle);
    return !textElements.some((textElement) =>
      textInsideBounds(textElement, bounds),
    );
  });

  let best: {
    placement: WhiteboardAnswerPlacement;
    score: number;
  } | null = null;

  for (const question of prioritizedQuestions) {
    for (const target of possibleTargets) {
      if (target.id === question.circle.id) continue;

      const targetBounds = getElementBounds(target);
      const sourcePadding = Math.max(
        88,
        Math.hypot(question.circleBounds.width, question.circleBounds.height) *
          0.25,
      );
      const targetPadding = Math.max(
        96,
        Math.hypot(targetBounds.width, targetBounds.height) * 0.24,
      );

      for (const connector of elements.flatMap(getDirectedElementEndpoints)) {
        if (
          !isPointNearBounds(
            connector.start,
            question.circleBounds,
            sourcePadding,
          ) ||
          !isPointNearBounds(connector.end, targetBounds, targetPadding)
        ) {
          continue;
        }

        const score =
          distanceToBounds(connector.start, question.circleBounds) +
          distanceToBounds(connector.end, targetBounds) * 1.6;
        if (!best || score < best.score) {
          best = {
            placement: {
              question: question.question,
              targetBounds,
              targetId: target.id,
            },
            score,
          };
        }
      }

      if (!best && possibleTargets.length === 1) {
        const sourceCenter = boundsCenter(question.circleBounds);
        const targetCenter = boundsCenter(targetBounds);
        if (
          targetCenter.x > sourceCenter.x ||
          targetCenter.y > sourceCenter.y
        ) {
          best = {
            placement: {
              question: question.question,
              targetBounds,
              targetId: target.id,
            },
            score: 10_000 + pointDistance(sourceCenter, targetCenter),
          };
        }
      }
    }
  }

  return best?.placement ?? null;
}

function wrapAnswerForTarget(answer: string, targetWidth: number): string {
  const maxLineLength = Math.max(
    18,
    Math.min(58, Math.floor(Math.max(160, targetWidth - 48) / 13)),
  );
  const sourceLines = answer
    .replace(/\s+\n/gu, "\n")
    .split(/\n+/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const wrapped: string[] = [];

  for (const sourceLine of sourceLines) {
    const words = sourceLine.split(/\s+/u);
    let line = "";

    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxLineLength && line) {
        wrapped.push(line);
        line = word;
      } else {
        line = next;
      }
    }

    if (line) wrapped.push(line);
  }

  return wrapped.slice(0, 7).join("\n");
}

export default function WhiteboardStudyTool({
  breakoutCode,
  canEdit,
  currentUser,
  initialState,
  roomId,
}: WhiteboardStudyToolProps): React.ReactElement {
  const [draft, setDraft] = useState<DraftElement | null>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [imageMessage, setImageMessage] = useState("");
  const [aiAnswerMessage, setAiAnswerMessage] = useState("");
  const [aiAnswerLoading, setAiAnswerLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [resizeSession, setResizeSession] = useState<ResizeSession | null>(
    null,
  );
  const [moveSession, setMoveSession] = useState<MoveSession | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"delete" | "clear" | null>(
    null,
  );
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
  const [drawingColor, setDrawingColor] = useState("#7352FA");
  const [collaboratorNames, setCollaboratorNames] = useState<
    Record<string, string>
  >({
    [currentUser.id]: currentUser.displayName || "Study partner",
  });
  const [hoveredAuthor, setHoveredAuthor] =
    useState<HoveredWhiteboardAuthor | null>(null);
  const [laserEnabled, setLaserEnabled] = useState(false);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);
  const laserIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const laserTrailRef = useRef<WhiteboardPoint[]>([]);
  const autoAnswerTriggerRef = useRef<{
    id: string;
    type: WhiteboardElementType;
  } | null>(null);
  const pendingAnswerKeysRef = useRef<Set<string>>(new Set());
  const imageInputRef = useRef<HTMLInputElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMeasuredViewportRef = useRef(false);
  const hasSettledInitialCameraRef = useRef(false);
  const hasInteractedWithBoardRef = useRef(false);
  const previousViewportRef = useRef<ViewportSize | null>(null);
  const collaboration = useCollaborativeTool({
    breakoutCode,
    canEdit,
    currentUser,
    initialState,
    kind: "whiteboard",
    roomId,
  });
  const { setAwarenessField } = collaboration;

  useEffect(() => {
    const abortController = new AbortController();

    const loadCollaboratorNames = async (): Promise<void> => {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(roomId)}/collaborator-names`,
        {
          cache: "no-store",
          credentials: "same-origin",
          signal: abortController.signal,
        },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as CollaboratorNamesPayload;

      if (!Array.isArray(payload.collaborators)) return;

      const names: Record<string, string> = {};

      for (const collaborator of payload.collaborators) {
        if (
          collaborator &&
          typeof collaborator === "object" &&
          "id" in collaborator &&
          "name" in collaborator &&
          typeof collaborator.id === "string" &&
          typeof collaborator.name === "string" &&
          collaborator.name.trim()
        ) {
          names[collaborator.id] = collaborator.name.trim();
        }
      }

      setCollaboratorNames((current) => ({ ...current, ...names }));
    };

    void loadCollaboratorNames().catch(() => {
      // Stored author names remain available if profile resolution is offline.
    });

    return () => abortController.abort();
  }, [roomId]);

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
    const container = containerRef.current;
    if (!container) return;

    const updateViewport = (width: number, height: number): void => {
      if (width <= 0 || height <= 0) return;
      hasMeasuredViewportRef.current = true;
      setViewport((current) =>
        Math.abs(current.width - width) < 0.5 &&
        Math.abs(current.height - height) < 0.5
          ? current
          : { width, height },
      );
    };

    const initialBounds = container.getBoundingClientRect();
    updateViewport(initialBounds.width, initialBounds.height);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateViewport(width, height);
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!hasMeasuredViewportRef.current) return;

    const previousViewport = previousViewportRef.current;
    const viewportChanged = Boolean(
      previousViewport &&
      (Math.abs(previousViewport.width - viewport.width) >= 0.5 ||
        Math.abs(previousViewport.height - viewport.height) >= 0.5),
    );
    let nextCamera: WhiteboardCamera | null = null;
    let settlesInitialCamera = false;

    if (!hasSettledInitialCameraRef.current) {
      if (elements.length > 0) {
        if (!hasInteractedWithBoardRef.current) {
          nextCamera = fitCameraToElements(
            elements,
            viewport,
            AUTOMATIC_FIT_MAX_ZOOM,
          );
          settlesInitialCamera = true;
        } else {
          hasSettledInitialCameraRef.current = true;
        }
      } else if (collaboration.status === "synced") {
        nextCamera = createInitialCamera(viewport);
        settlesInitialCamera = true;
      }
    } else if (viewportChanged) {
      nextCamera =
        elements.length > 0
          ? fitCameraToElements(elements, viewport, AUTOMATIC_FIT_MAX_ZOOM)
          : createInitialCamera(viewport);
    }

    if (!nextCamera) {
      previousViewportRef.current = viewport;
      return;
    }

    const cameraForViewport = nextCamera;
    const frame = requestAnimationFrame(() => {
      setCamera(cameraForViewport);
      previousViewportRef.current = viewport;
      if (settlesInitialCamera) {
        hasSettledInitialCameraRef.current = true;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [collaboration.status, elements, viewport]);

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

  const clearLaser = useCallback((): void => {
    if (laserIdleTimerRef.current) {
      clearTimeout(laserIdleTimerRef.current);
      laserIdleTimerRef.current = null;
    }
    laserTrailRef.current = [];
    setAwarenessField("laser", null);
  }, [setAwarenessField]);

  const publishLaser = useCallback(
    (point: WhiteboardPoint): void => {
      const previous = laserTrailRef.current.at(-1);
      const minimumDistance = 3 / camera.zoom;
      if (
        previous &&
        Math.hypot(point.x - previous.x, point.y - previous.y) < minimumDistance
      ) {
        return;
      }

      laserTrailRef.current = [...laserTrailRef.current, point].slice(
        -LASER_TRAIL_LENGTH,
      );
      setAwarenessField("laser", {
        x: point.x,
        y: point.y,
        trail: laserTrailRef.current,
      });

      if (laserIdleTimerRef.current) clearTimeout(laserIdleTimerRef.current);
      laserIdleTimerRef.current = setTimeout(clearLaser, LASER_IDLE_TIMEOUT_MS);
    },
    [camera.zoom, clearLaser, setAwarenessField],
  );

  useEffect(() => {
    if (!laserEnabled) clearLaser();
    return () => {
      if (laserIdleTimerRef.current) clearTimeout(laserIdleTimerRef.current);
    };
  }, [clearLaser, laserEnabled]);

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
    [currentUser.displayName, currentUser.id, drawingColor, upsertElement],
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
    setCamera(fitCameraToElements(elements, viewport));
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
    setConfirmAction("delete");
  };

  const confirmDeleteSelected = (): void => {
    if (!selectedElement) return;
    transact((document) =>
      document.getMap("whiteboard-elements").delete(selectedElement.id),
    );
    setSelectedId(null);
    setResizeSession(null);
    setConfirmAction(null);
  };

  const clearAllDrawings = (): void => {
    if (!canEdit || elements.length === 0) return;
    setConfirmAction("clear");
  };

  const confirmClearAll = (): void => {
    transact((document) => {
      const elementMap = document.getMap("whiteboard-elements");
      for (const key of Array.from(elementMap.keys())) {
        elementMap.delete(key);
      }
    });
    setSelectedId(null);
    setResizeSession(null);
    setDraft(null);
    setConfirmAction(null);
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

  const answerWhiteboardQuestion = useCallback(
    async (
      candidateElements = elements,
      candidateSelectedId = selectedId,
      mode: "auto" | "manual" = "manual",
    ): Promise<void> => {
      if (!canEdit || aiAnswerLoading) return;

      const placement = findWhiteboardAnswerPlacement(
        candidateElements,
        candidateSelectedId,
      );
      if (!placement) {
        if (mode === "manual") {
          setAiAnswerMessage(
            "Circle a question and draw an arrow to one blank circle.",
          );
        }
        return;
      }

      const answerKey = `${placement.targetId}:${placement.question}`;
      if (pendingAnswerKeysRef.current.has(answerKey)) return;
      pendingAnswerKeysRef.current.add(answerKey);
      setAiAnswerLoading(true);
      setAiAnswerMessage(
        mode === "auto" ? "Answering inside the blank circle..." : "",
      );

      try {
        const response = await fetch(`/api/rooms/${roomId}/whiteboard-answer`, {
          body: JSON.stringify({ question: placement.question }),
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload = (await response.json()) as WhiteboardAnswerPayload;

        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "The AI answer could not be generated.",
          );
        }

        if (typeof payload.answer !== "string" || !payload.answer.trim()) {
          throw new Error("The AI answer was empty. Try again.");
        }

        const answerText = wrapAnswerForTarget(
          payload.answer.trim(),
          placement.targetBounds.width,
        );
        const lines = answerText.split("\n").filter(Boolean);
        const textHeight = Math.max(36, lines.length * 32);
        const textWidth = Math.max(160, placement.targetBounds.width - 48);
        const id = crypto.randomUUID();

        upsertElement({
          authorId: currentUser.id,
          authorName: currentUser.displayName || "Study partner",
          color: "#7352FA",
          createdAt: new Date().toISOString(),
          height: textHeight,
          id,
          points: [],
          src: "",
          text: answerText,
          type: "text",
          width: textWidth,
          x:
            placement.targetBounds.x +
            Math.max(18, (placement.targetBounds.width - textWidth) / 2),
          y:
            placement.targetBounds.y +
            Math.max(18, (placement.targetBounds.height - textHeight) / 2),
        });
        setSelectedId(id);
        setTool("select");
        setAiAnswerMessage("AI answer added inside the blank circle.");
      } catch (error) {
        setAiAnswerMessage(
          error instanceof Error
            ? error.message
            : "The AI answer could not be generated.",
        );
      } finally {
        pendingAnswerKeysRef.current.delete(answerKey);
        setAiAnswerLoading(false);
      }
    },
    [
      aiAnswerLoading,
      canEdit,
      currentUser.displayName,
      currentUser.id,
      elements,
      roomId,
      selectedId,
      upsertElement,
    ],
  );

  useEffect(() => {
    const trigger = autoAnswerTriggerRef.current;
    if (!trigger || !canEdit || aiAnswerLoading) return;

    if (!elements.some((element) => element.id === trigger.id)) return;

    autoAnswerTriggerRef.current = null;
    if (
      trigger.type !== "arrow" &&
      trigger.type !== "draw" &&
      trigger.type !== "ellipse" &&
      trigger.type !== "line" &&
      trigger.type !== "text"
    ) {
      return;
    }

    void answerWhiteboardQuestion(elements, trigger.id, "auto");
  }, [aiAnswerLoading, answerWhiteboardQuestion, canEdit, elements]);

  const draftElement = draft
    ? {
        authorId: currentUser.id,
        authorName: currentUser.displayName || "Study partner",
        color: collaboration.connection?.user.color ?? "#7352FA",
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
    const showAuthor = (event: React.PointerEvent<SVGElement>): void => {
      if (isDraft || !containerRef.current) return;

      const bounds = containerRef.current.getBoundingClientRect();
      const registeredName =
        collaboratorNames[element.authorId] ?? element.authorName;
      setHoveredAuthor({
        authorId: element.authorId,
        color: element.color,
        elementId: element.id,
        left: Math.min(
          Math.max(12, event.clientX - bounds.left + 12),
          Math.max(12, bounds.width - 172),
        ),
        name: registeredName,
        top: Math.min(
          Math.max(12, event.clientY - bounds.top + 12),
          Math.max(12, bounds.height - 58),
        ),
      });
    };
    const hideAuthor = (): void => {
      setHoveredAuthor((current) =>
        current?.elementId === element.id ? null : current,
      );
    };
    const common = {
      "aria-label": `${element.type} by ${
        collaboratorNames[element.authorId] ?? element.authorName
      }`,
      className,
      onPointerEnter: showAuthor,
      onPointerLeave: hideAuthor,
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
            {element.text.split("\n").map((line, index) => (
              <tspan dy={index === 0 ? 0 : 32} key={index} x={element.x}>
                {line}
              </tspan>
            ))}
          </text>
        );
      case "image":
        return (
          <image
            aria-label={`image by ${
              collaboratorNames[element.authorId] ?? element.authorName
            }`}
            className={className}
            height={element.height}
            href={element.src}
            key={element.id}
            onPointerEnter={showAuthor}
            onPointerLeave={hideAuthor}
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
                stroke="#7352FA"
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
                  <span>
                    <kbd>Scroll</kbd>
                  </span>
                  <span className="tooltip-desc">Pan Canvas</span>
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
          className="whiteboard-toolbar__mobile-primary"
          disabled={!canUndo || !canEdit}
          onClick={handleUndo}
          title="Undo"
          type="button"
        >
          <Undo2 aria-hidden="true" size={17} />
          <span>Undo</span>
        </button>
        <button
          className="whiteboard-toolbar__mobile-primary"
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
            className={`${MOBILE_PRIMARY_WHITEBOARD_TOOLS.has(nextTool) ? "whiteboard-toolbar__mobile-primary" : "whiteboard-toolbar__mobile-secondary"}${tool === nextTool ? " is-active" : ""}`}
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
        <button
          aria-pressed={laserEnabled}
          className={`whiteboard-laser-toggle whiteboard-toolbar__mobile-secondary${laserEnabled ? " is-active" : ""}`}
          disabled={!canEdit}
          onClick={() => setLaserEnabled((enabled) => !enabled)}
          title={
            laserEnabled
              ? `Turn laser off (using ${tool})`
              : `Use laser with ${tool}`
          }
          type="button"
        >
          <Radio aria-hidden="true" size={17} />
          <span>Laser</span>
          <span
            aria-hidden="true"
            className="whiteboard-laser-toggle__status"
          />
        </button>
        <button
          aria-busy={aiAnswerLoading}
          className="whiteboard-ai-answer whiteboard-toolbar__mobile-secondary"
          disabled={!canEdit || aiAnswerLoading || elements.length === 0}
          onClick={() => void answerWhiteboardQuestion()}
          title="AI answer"
          type="button"
        >
          <Sparkles aria-hidden="true" size={17} />
          <span>{aiAnswerLoading ? "Answering" : "AI answer"}</span>
        </button>
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
        <label
          className="whiteboard-color-picker whiteboard-toolbar__mobile-secondary"
          title="Drawing color"
        >
          <span>Color</span>
          <input
            aria-label="Drawing color"
            disabled={!canEdit}
            onChange={(event) => setDrawingColor(event.target.value)}
            type="color"
            value={drawingColor}
          />
        </label>
        <div className="whiteboard-toolbar__zoom whiteboard-toolbar__mobile-secondary">
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
        <MobileToolsMenu
          active={
            !MOBILE_PRIMARY_WHITEBOARD_TOOLS.has(tool) ||
            laserEnabled ||
            camera.zoom !== 1
          }
          description="Add shapes and media, change the view, or manage the board."
          title="More whiteboard tools"
        >
          {(close) => (
            <div className="mobile-tools-dialog__grid">
              {TOOLS.filter(
                ({ tool: nextTool }) =>
                  !MOBILE_PRIMARY_WHITEBOARD_TOOLS.has(nextTool),
              ).map(({ icon: Icon, label, tool: nextTool }) => (
                <button
                  aria-pressed={tool === nextTool}
                  className={`mobile-tool-action${tool === nextTool ? " is-active" : ""}`}
                  disabled={!canEdit}
                  key={nextTool}
                  onClick={() => {
                    if (nextTool === "image") {
                      imageInputRef.current?.click();
                    } else {
                      setTool(nextTool);
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
                aria-pressed={laserEnabled}
                className={`mobile-tool-action${laserEnabled ? " is-active" : ""}`}
                disabled={!canEdit}
                onClick={() => {
                  setLaserEnabled((enabled) => !enabled);
                  close();
                }}
                type="button"
              >
                <Radio aria-hidden="true" size={18} />
                <span>{laserEnabled ? "Turn laser off" : "Laser pointer"}</span>
              </button>
              <button
                aria-busy={aiAnswerLoading}
                className="mobile-tool-action"
                disabled={!canEdit || aiAnswerLoading || elements.length === 0}
                onClick={() => {
                  void answerWhiteboardQuestion();
                  close();
                }}
                type="button"
              >
                <Sparkles aria-hidden="true" size={18} />
                <span>{aiAnswerLoading ? "Answering…" : "AI answer"}</span>
              </button>
              <label className="mobile-tools-dialog__control">
                <span>Drawing color</span>
                <input
                  aria-label="Drawing color"
                  disabled={!canEdit}
                  onChange={(event) => setDrawingColor(event.target.value)}
                  type="color"
                  value={drawingColor}
                />
              </label>
              <div className="mobile-tools-dialog__control mobile-tools-dialog__control--wide mobile-tools-dialog__control--canvas">
                <span>Canvas view</span>
                <div className="mobile-tools-dialog__stepper mobile-tools-dialog__stepper--wide">
                  <button
                    aria-label="Zoom out"
                    disabled={camera.zoom <= MIN_ZOOM}
                    onClick={handleZoomOut}
                    type="button"
                  >
                    <Minus aria-hidden="true" size={18} />
                  </button>
                  <strong>{Math.round(camera.zoom * 100)}%</strong>
                  <button
                    aria-label="Zoom in"
                    disabled={camera.zoom >= MAX_ZOOM}
                    onClick={handleZoomIn}
                    type="button"
                  >
                    <Plus aria-hidden="true" size={18} />
                  </button>
                  <button
                    aria-label="Reset view"
                    onClick={handleResetView}
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" size={18} />
                  </button>
                  <button
                    aria-label="Auto-fit whiteboard"
                    onClick={handleAutoFit}
                    type="button"
                  >
                    <Maximize2 aria-hidden="true" size={18} />
                  </button>
                </div>
              </div>
              {canEdit && selectedElement ? (
                <button
                  className="mobile-tool-action mobile-tool-action--danger"
                  onClick={() => {
                    deleteSelected();
                    close();
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={18} />
                  <span>Delete selected</span>
                </button>
              ) : null}
              {canEdit && elements.length > 0 ? (
                <button
                  className="mobile-tool-action mobile-tool-action--danger"
                  onClick={() => {
                    clearAllDrawings();
                    close();
                  }}
                  type="button"
                >
                  <Eraser aria-hidden="true" size={18} />
                  <span>Clear board</span>
                </button>
              ) : null}
            </div>
          )}
        </MobileToolsMenu>
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
              <div className="tooltip-row">
                <span>
                  <kbd>Scroll</kbd>
                </span>
                <span className="tooltip-desc">Pan Canvas</span>
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

      {imageMessage || aiAnswerMessage || collaboration.message ? (
        <p className="study-tool__message" role="status">
          {imageMessage || aiAnswerMessage || collaboration.message}
        </p>
      ) : null}

      {confirmAction ? (
        <div className="whiteboard-confirm-backdrop" role="presentation">
          <div
            aria-labelledby="whiteboard-confirm-title"
            aria-modal="true"
            className="whiteboard-confirm-dialog"
            role="dialog"
          >
            <h2 id="whiteboard-confirm-title">
              {confirmAction === "delete"
                ? "Delete selected item?"
                : "Clear the whiteboard?"}
            </h2>
            <p>
              {confirmAction === "delete"
                ? "This item will be removed for everyone in the room."
                : "All drawings and objects will be removed for everyone in the room."}
            </p>
            <div className="whiteboard-confirm-actions">
              <button onClick={() => setConfirmAction(null)} type="button">
                Cancel
              </button>
              <button
                className="whiteboard-confirm-danger"
                onClick={
                  confirmAction === "delete"
                    ? confirmDeleteSelected
                    : confirmClearAll
                }
                type="button"
              >
                {confirmAction === "delete" ? "Delete" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={`whiteboard-stage whiteboard-stage--${tool}${laserEnabled ? " whiteboard-stage--laser-enabled" : ""}${resizeSession ? " whiteboard-stage--resizing" : ""}${isPanning ? " whiteboard-stage--panning" : ""}${isSpacePressed ? " whiteboard-stage--space-pressed" : ""}${moveSession ? " whiteboard-stage--moving" : ""}`}
      >
        <svg
          ref={svgRef}
          aria-label="Collaborative whiteboard canvas"
          onPointerCancel={finishPointer}
          onPointerDown={handlePointerDown}
          onPointerLeave={clearLaser}
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
            <radialGradient id="laser-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="24%" stopColor="#fff4f1" />
              <stop offset="52%" stopColor="#ff3b30" />
              <stop offset="100%" stopColor="#d60909" />
            </radialGradient>
            <filter
              id="laser-glow"
              height="460%"
              width="460%"
              x="-180%"
              y="-180%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
              <g className="whiteboard-laser" key={participant.clientId}>
                {participant.laser.trail.slice(1).map((point, index, trail) => {
                  const previous = participant.laser?.trail[index];
                  if (!previous) return null;
                  const progress = (index + 1) / Math.max(1, trail.length);
                  return (
                    <line
                      className="whiteboard-laser__trail"
                      key={`${participant.clientId}-${index}`}
                      opacity={0.08 + progress * 0.58}
                      strokeWidth={1.5 + progress * 4.5}
                      x1={previous.x}
                      x2={point.x}
                      y1={previous.y}
                      y2={point.y}
                    />
                  );
                })}
                <g
                  transform={`translate(${participant.laser.x} ${participant.laser.y})`}
                >
                  <circle className="whiteboard-laser__halo" r="15" />
                  <circle
                    className="whiteboard-laser__dot"
                    fill="url(#laser-core)"
                    filter="url(#laser-glow)"
                    r="6.5"
                  />
                </g>
                {!isSelf ? (
                  <text
                    fill={participant.color}
                    x={participant.laser.x + 14}
                    y={participant.laser.y - 12}
                  >
                    {participant.name}
                  </text>
                ) : null}
              </g>
            ) : null;
          })}
        </svg>
        {hoveredAuthor &&
        elements.some((element) => element.id === hoveredAuthor.elementId) ? (
          <div
            className="whiteboard-author-tooltip"
            role="tooltip"
            style={{ left: hoveredAuthor.left, top: hoveredAuthor.top }}
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: hoveredAuthor.color }}
            >
              {(collaboratorNames[hoveredAuthor.authorId] ?? hoveredAuthor.name)
                .charAt(0)
                .toUpperCase()}
            </span>
            <div>
              <strong>
                {collaboratorNames[hoveredAuthor.authorId] ??
                  hoveredAuthor.name}
              </strong>
              <small>Created this</small>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export type WhiteboardElementType =
  "arrow" | "draw" | "ellipse" | "image" | "line" | "rectangle" | "text";

export interface WhiteboardPoint {
  x: number;
  y: number;
}

export interface WhiteboardElement {
  authorId: string;
  color: string;
  createdAt: string;
  height: number;
  id: string;
  points: WhiteboardPoint[];
  src: string;
  text: string;
  type: WhiteboardElementType;
  width: number;
  x: number;
  y: number;
}

/** Large Figma-style infinite-feeling canvas (world units). */
export const WHITEBOARD_MIN_X = -10_000;
export const WHITEBOARD_MAX_X = 10_000;
export const WHITEBOARD_MIN_Y = -7_200;
export const WHITEBOARD_MAX_Y = 7_200;
export const WHITEBOARD_WIDTH = WHITEBOARD_MAX_X - WHITEBOARD_MIN_X;
export const WHITEBOARD_HEIGHT = WHITEBOARD_MAX_Y - WHITEBOARD_MIN_Y;

/** Comfortable default framing region (legacy board size). */
export const WHITEBOARD_HOME_WIDTH = 1_600;
export const WHITEBOARD_HOME_HEIGHT = 960;

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const ZOOM_STEP = 1.15;

export interface WhiteboardCamera {
  /** World X of the top-left visible corner. */
  x: number;
  /** World Y of the top-left visible corner. */
  y: number;
  /** Screen pixels per world unit. */
  zoom: number;
}

export interface ViewportSize {
  height: number;
  width: number;
}

const ELEMENT_TYPES = new Set<WhiteboardElementType>([
  "arrow",
  "draw",
  "ellipse",
  "image",
  "line",
  "rectangle",
  "text",
]);
const SAFE_IMAGE_DATA_URL = /^data:image\/(?:gif|jpeg|png|webp);base64,/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isCoordinate(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -maximum &&
    value <= maximum
  );
}

function isDimension(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Math.abs(value) <= maximum
  );
}

function isString(value: unknown, limit: number): value is string {
  return typeof value === "string" && value.length <= limit;
}

export const MIN_ELEMENT_SIZE = 8;

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end";

export interface ElementBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

export function clampBoardPoint(point: WhiteboardPoint): WhiteboardPoint {
  return {
    x: Math.min(WHITEBOARD_MAX_X, Math.max(WHITEBOARD_MIN_X, point.x)),
    y: Math.min(WHITEBOARD_MAX_Y, Math.max(WHITEBOARD_MIN_Y, point.y)),
  };
}

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function getViewSize(
  viewport: ViewportSize,
  zoom: number,
): ViewportSize {
  const safeZoom = clampZoom(zoom);
  return {
    width: Math.max(1, viewport.width / safeZoom),
    height: Math.max(1, viewport.height / safeZoom),
  };
}

export function clampCamera(
  camera: WhiteboardCamera,
  viewport: ViewportSize,
): WhiteboardCamera {
  const zoom = clampZoom(camera.zoom);
  const view = getViewSize(viewport, zoom);
  // Soft bounds: keep at least 25% of the viewport over the board.
  const minX = WHITEBOARD_MIN_X - view.width * 0.75;
  const minY = WHITEBOARD_MIN_Y - view.height * 0.75;
  const maxX = WHITEBOARD_MAX_X - view.width * 0.25;
  const maxY = WHITEBOARD_MAX_Y - view.height * 0.25;

  return {
    x: Math.min(Math.max(camera.x, minX), Math.max(minX, maxX)),
    y: Math.min(Math.max(camera.y, minY), Math.max(minY, maxY)),
    zoom,
  };
}

export function createInitialCamera(viewport: ViewportSize): WhiteboardCamera {
  const zoom = 1;
  const view = getViewSize(viewport, zoom);
  return clampCamera(
    {
      // Keep the initial drawing surface inside the board. Centering a
      // viewport wider than the legacy home region creates a negative-world
      // gutter on the left/top where pointer coordinates are clamped to 0,
      // making that visible space appear blank and undrawable.
      x: Math.max(0, (WHITEBOARD_HOME_WIDTH - view.width) / 2),
      y: Math.max(0, (WHITEBOARD_HOME_HEIGHT - view.height) / 2),
      zoom,
    },
    viewport,
  );
}

export function screenToWorld(
  camera: WhiteboardCamera,
  viewport: ViewportSize,
  clientX: number,
  clientY: number,
  originX: number,
  originY: number,
): WhiteboardPoint {
  const view = getViewSize(viewport, camera.zoom);
  return {
    x:
      camera.x +
      ((clientX - originX) / Math.max(1, viewport.width)) * view.width,
    y:
      camera.y +
      ((clientY - originY) / Math.max(1, viewport.height)) * view.height,
  };
}

export function zoomCameraAt(
  camera: WhiteboardCamera,
  viewport: ViewportSize,
  nextZoom: number,
  clientX: number,
  clientY: number,
  originX: number,
  originY: number,
): WhiteboardCamera {
  const world = screenToWorld(
    camera,
    viewport,
    clientX,
    clientY,
    originX,
    originY,
  );
  const zoom = clampZoom(nextZoom);
  const view = getViewSize(viewport, zoom);
  const relX = (clientX - originX) / Math.max(1, viewport.width);
  const relY = (clientY - originY) / Math.max(1, viewport.height);

  return clampCamera(
    {
      x: world.x - relX * view.width,
      y: world.y - relY * view.height,
      zoom,
    },
    viewport,
  );
}

export function panCamera(
  camera: WhiteboardCamera,
  viewport: ViewportSize,
  deltaScreenX: number,
  deltaScreenY: number,
): WhiteboardCamera {
  return clampCamera(
    {
      x: camera.x - deltaScreenX / camera.zoom,
      y: camera.y - deltaScreenY / camera.zoom,
      zoom: camera.zoom,
    },
    viewport,
  );
}

export function cameraViewBox(
  camera: WhiteboardCamera,
  viewport: ViewportSize,
): string {
  const view = getViewSize(viewport, camera.zoom);
  return `${camera.x} ${camera.y} ${view.width} ${view.height}`;
}

export function getElementBounds(element: WhiteboardElement): ElementBounds {
  if (element.type === "line" || element.type === "arrow") {
    const endX = element.x + element.width;
    const endY = element.y + element.height;
    return {
      x: Math.min(element.x, endX),
      y: Math.min(element.y, endY),
      width: Math.max(MIN_ELEMENT_SIZE, Math.abs(element.width)),
      height: Math.max(MIN_ELEMENT_SIZE, Math.abs(element.height)),
    };
  }

  if (element.type === "draw" && element.points.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of element.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    return {
      x: minX,
      y: minY,
      width: Math.max(MIN_ELEMENT_SIZE, maxX - minX),
      height: Math.max(MIN_ELEMENT_SIZE, maxY - minY),
    };
  }

  return {
    x: element.x,
    y: element.y,
    width: Math.max(MIN_ELEMENT_SIZE, element.width),
    height: Math.max(MIN_ELEMENT_SIZE, element.height),
  };
}

export function resizeWhiteboardElement(
  origin: WhiteboardElement,
  handle: ResizeHandle,
  point: WhiteboardPoint,
): WhiteboardElement {
  if (origin.type === "line" || origin.type === "arrow") {
    if (handle === "start") {
      const endX = origin.x + origin.width;
      const endY = origin.y + origin.height;
      const start = clampBoardPoint(point);
      return {
        ...origin,
        height: endY - start.y,
        width: endX - start.x,
        x: start.x,
        y: start.y,
      };
    }
    if (handle === "end") {
      const end = clampBoardPoint(point);
      return {
        ...origin,
        height: end.y - origin.y,
        width: end.x - origin.x,
      };
    }
  }

  const bounds = getElementBounds(origin);
  const right = bounds.x + bounds.width;
  const bottom = bounds.y + bounds.height;
  const next = clampBoardPoint(point);
  let x = bounds.x;
  let y = bounds.y;
  let width = bounds.width;
  let height = bounds.height;

  switch (handle) {
    case "nw":
      x = Math.min(next.x, right - MIN_ELEMENT_SIZE);
      y = Math.min(next.y, bottom - MIN_ELEMENT_SIZE);
      width = right - x;
      height = bottom - y;
      break;
    case "ne":
      y = Math.min(next.y, bottom - MIN_ELEMENT_SIZE);
      width = Math.max(MIN_ELEMENT_SIZE, next.x - bounds.x);
      height = bottom - y;
      break;
    case "sw":
      x = Math.min(next.x, right - MIN_ELEMENT_SIZE);
      width = right - x;
      height = Math.max(MIN_ELEMENT_SIZE, next.y - bounds.y);
      break;
    case "se":
      width = Math.max(MIN_ELEMENT_SIZE, next.x - bounds.x);
      height = Math.max(MIN_ELEMENT_SIZE, next.y - bounds.y);
      break;
    default:
      return origin;
  }

  x = Math.max(
    WHITEBOARD_MIN_X,
    Math.min(x, WHITEBOARD_MAX_X - MIN_ELEMENT_SIZE),
  );
  y = Math.max(
    WHITEBOARD_MIN_Y,
    Math.min(y, WHITEBOARD_MAX_Y - MIN_ELEMENT_SIZE),
  );
  width = Math.min(width, WHITEBOARD_MAX_X - x);
  height = Math.min(height, WHITEBOARD_MAX_Y - y);

  if (origin.type === "draw") {
    const scaleX = width / bounds.width;
    const scaleY = height / bounds.height;
    return {
      ...origin,
      height,
      points: origin.points.map((drawPoint) =>
        clampBoardPoint({
          x: x + (drawPoint.x - bounds.x) * scaleX,
          y: y + (drawPoint.y - bounds.y) * scaleY,
        }),
      ),
      width,
      x,
      y,
    };
  }

  return {
    ...origin,
    height,
    width,
    x,
    y,
  };
}

export function readWhiteboardElement(
  value: unknown,
): WhiteboardElement | null {
  if (
    !isRecord(value) ||
    !ELEMENT_TYPES.has(value.type as WhiteboardElementType)
  ) {
    return null;
  }

  const points = Array.isArray(value.points)
    ? value.points.filter(
        (point): point is WhiteboardPoint =>
          isRecord(point) &&
          isCoordinate(point.x, WHITEBOARD_WIDTH) &&
          isCoordinate(point.y, WHITEBOARD_HEIGHT),
      )
    : [];

  if (
    !isString(value.id, 80) ||
    !isString(value.authorId, 80) ||
    !isString(value.color, 32) ||
    !isString(value.createdAt, 40) ||
    !isString(value.text, 600) ||
    !isString(value.src, 1_500_000) ||
    (value.src !== "" && !SAFE_IMAGE_DATA_URL.test(value.src)) ||
    !isCoordinate(value.x, WHITEBOARD_WIDTH) ||
    !isCoordinate(value.y, WHITEBOARD_HEIGHT) ||
    !isDimension(value.width, WHITEBOARD_WIDTH) ||
    !isDimension(value.height, WHITEBOARD_HEIGHT) ||
    points.length > 4_000
  ) {
    return null;
  }

  return {
    authorId: value.authorId,
    color: value.color,
    createdAt: value.createdAt,
    height: value.height,
    id: value.id,
    points,
    src: value.src,
    text: value.text,
    type: value.type as WhiteboardElementType,
    width: value.width,
    x: value.x,
    y: value.y,
  };
}

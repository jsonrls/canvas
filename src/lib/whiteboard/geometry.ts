import {
  clampBoardPoint,
  clampCamera,
  createInitialCamera,
  getElementBounds,
  MAX_ZOOM,
  MIN_ZOOM,
  screenToWorld,
  type ResizeHandle,
  type ViewportSize,
  type WhiteboardCamera,
  type WhiteboardElement,
  type WhiteboardPoint,
} from "@/lib/whiteboard/model";
import {
  WHITEBOARD_MAX_X,
  WHITEBOARD_MAX_Y,
  WHITEBOARD_MIN_X,
  WHITEBOARD_MIN_Y,
} from "./model";

const AUTO_FIT_PADDING = 80;

export function fitCameraToElements(
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

export function getBoardPoint(
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

export function readImage(file: File): Promise<string> {
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

export function getResizeHandles(
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

export function handleCursor(handle: ResizeHandle): string {
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

export function moveWhiteboardElement(
  element: WhiteboardElement,
  moveSession: {
    initialX: number;
    initialY: number;
    initialPoints: WhiteboardPoint[];
    startPoint: WhiteboardPoint;
  },
  point: WhiteboardPoint,
): WhiteboardElement {
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

  return {
    ...element,
    points: updatedPoints,
    x: nextX,
    y: nextY,
  };
}

import {
  ArrowRight,
  Circle,
  ImagePlus,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Type,
} from "@/components/ui/icons";
import {
  type ResizeHandle,
  type WhiteboardElement,
  type WhiteboardElementType,
  type WhiteboardPoint,
} from "@/lib/whiteboard/model";

export type WhiteboardTool =
  | "select"
  | "draw"
  | "rectangle"
  | "ellipse"
  | "arrow"
  | "line"
  | "text"
  | "image";

export interface DraftElement {
  current: WhiteboardPoint;
  points: WhiteboardPoint[];
  start: WhiteboardPoint;
  type: Extract<
    WhiteboardElementType,
    "arrow" | "draw" | "ellipse" | "line" | "rectangle"
  >;
}

export interface ResizeSession {
  handle: ResizeHandle;
  origin: WhiteboardElement;
}

export interface MoveSession {
  elementId: string;
  initialPoints: WhiteboardPoint[];
  initialX: number;
  initialY: number;
  startPoint: WhiteboardPoint;
}

export interface WhiteboardAnswerPayload {
  answer?: unknown;
  error?: unknown;
}

export interface HoveredWhiteboardAuthor {
  authorId: string;
  color: string;
  elementId: string;
  left: number;
  name: string;
  top: number;
}

export interface CollaboratorNamesPayload {
  collaborators?: unknown;
}

export const TOOLS: Array<{
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
export const MOBILE_PRIMARY_WHITEBOARD_TOOLS = new Set<WhiteboardTool>([
  "select",
  "draw",
  "text",
]);
export const SAFE_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const HANDLE_SIZE = 12;
export const LASER_TRAIL_LENGTH = 16;
export const LASER_IDLE_TIMEOUT_MS = 650;
export const AUTOMATIC_FIT_MAX_ZOOM = 1.5;

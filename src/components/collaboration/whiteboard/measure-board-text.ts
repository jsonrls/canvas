import { BOARD_TEXT_FONT_SIZE } from "@/lib/whiteboard/text-layout";

let context: CanvasRenderingContext2D | null | undefined;

/**
 * Width of a line of board text in board units, measured with the same font
 * the SVG uses. Falls back to an average glyph width when no canvas exists.
 */
export function measureBoardText(text: string): number {
  if (context === undefined) {
    context =
      typeof document === "undefined"
        ? null
        : document.createElement("canvas").getContext("2d");
    if (context) {
      const family =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--font-display")
          .trim() || "sans-serif";
      context.font = `600 ${BOARD_TEXT_FONT_SIZE}px ${family}, sans-serif`;
    }
  }
  return context
    ? context.measureText(text).width
    : text.length * BOARD_TEXT_FONT_SIZE * 0.58;
}

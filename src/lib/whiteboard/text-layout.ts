/** Board text is 28px (see `.whiteboard-stage svg > text`), one line per 32px. */
export const BOARD_TEXT_FONT_SIZE = 28;
export const BOARD_TEXT_LINE_HEIGHT = 32;
/** New text wraps past this width instead of running off across the board. */
export const BOARD_TEXT_MAX_WIDTH = 520;
export const BOARD_TEXT_MIN_WIDTH = 48;
/** Room under the last line for descenders (g, p, y), at the default size. */
const BOARD_TEXT_BOTTOM_PADDING = 10;
/** Smallest and largest size an answer may take to fit its circle. */
const FIT_MIN_FONT_SIZE = 12;
const FIT_MAX_FONT_SIZE = 56;

/** Width of a line of text at the default board size. */
export type MeasureText = (text: string) => number;

/** Everything scales with the font: width, line height and padding. */
function sizeRatio(fontSize: number): number {
  return fontSize / BOARD_TEXT_FONT_SIZE;
}

export function boardLineHeight(fontSize = BOARD_TEXT_FONT_SIZE): number {
  return BOARD_TEXT_LINE_HEIGHT * sizeRatio(fontSize);
}

/** Offset from the box top to the first baseline. */
export function boardTextBaseline(fontSize = BOARD_TEXT_FONT_SIZE): number {
  return 30 * sizeRatio(fontSize);
}

function measureAtSize(measure: MeasureText, fontSize: number): MeasureText {
  const ratio = sizeRatio(fontSize);
  return ratio === 1 ? measure : (text) => measure(text) * ratio;
}

/** Splits one word that is wider than the box into pieces that fit. */
function breakLongWord(
  word: string,
  maxWidth: number,
  measure: MeasureText,
): string[] {
  const pieces: string[] = [];
  let piece = "";
  for (const character of word) {
    if (piece && measure(piece + character) > maxWidth) {
      pieces.push(piece);
      piece = character;
    } else {
      piece += character;
    }
  }
  if (piece) pieces.push(piece);
  return pieces;
}

/**
 * Greedy word wrap. Typed line breaks are kept; a word wider than the box
 * is broken across lines so nothing spills outside it.
 */
export function wrapBoardText(
  text: string,
  maxWidth: number,
  measure: MeasureText,
  fontSize = BOARD_TEXT_FONT_SIZE,
): string[] {
  const width = Math.max(BOARD_TEXT_MIN_WIDTH * sizeRatio(fontSize), maxWidth);
  const measureLine = measureAtSize(measure, fontSize);
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/u).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (measureLine(next) <= width) {
        line = next;
        continue;
      }
      if (line) lines.push(line);
      const pieces =
        measureLine(word) > width
          ? breakLongWord(word, width, measureLine)
          : [word];
      line = pieces.pop() ?? "";
      lines.push(...pieces);
    }
    lines.push(line);
  }

  return lines;
}

export function boardTextHeight(
  lineCount: number,
  fontSize = BOARD_TEXT_FONT_SIZE,
): number {
  return (
    Math.max(1, lineCount) * boardLineHeight(fontSize) +
    BOARD_TEXT_BOTTOM_PADDING * sizeRatio(fontSize)
  );
}

export interface BoardTextBox {
  fontSize: number;
  height: number;
  lines: string[];
  width: number;
}

/**
 * The smallest box that holds the text: as wide as its longest line, up to
 * `maxWidth`, and as tall as its wrapped lines.
 */
export function fitBoardTextBox(
  text: string,
  measure: MeasureText,
  maxWidth = BOARD_TEXT_MAX_WIDTH,
  fontSize = BOARD_TEXT_FONT_SIZE,
): BoardTextBox {
  const minWidth = BOARD_TEXT_MIN_WIDTH * sizeRatio(fontSize);
  const limit = Math.max(minWidth, maxWidth);
  const lines = wrapBoardText(text, limit, measure, fontSize);
  const measureLine = measureAtSize(measure, fontSize);
  const longest = Math.max(0, ...lines.map((line) => measureLine(line)));
  return {
    fontSize,
    height: boardTextHeight(lines.length, fontSize),
    lines,
    width: Math.ceil(Math.max(minWidth, Math.min(limit, longest + 4))),
  };
}

/**
 * The largest text size whose wrapped block fits inside an ellipse of this
 * size. A box fits when its corners are inside: (w/W)² + (h/H)² ≤ 1. The
 * ellipse is shrunk a little so text keeps clear of the stroke.
 */
export function fitBoardTextInEllipse(
  text: string,
  measure: MeasureText,
  ellipse: { height: number; width: number },
): BoardTextBox {
  const innerWidth = ellipse.width * 0.9;
  const innerHeight = ellipse.height * 0.9;
  const fits = (box: BoardTextBox): boolean =>
    (box.width / innerWidth) ** 2 + (box.height / innerHeight) ** 2 <= 1;

  for (
    let fontSize = FIT_MAX_FONT_SIZE;
    fontSize >= FIT_MIN_FONT_SIZE;
    fontSize -= 1
  ) {
    // Wider lines suit flat ellipses, narrower ones tall circles: try both.
    for (let share = 0.95; share >= 0.4; share -= 0.05) {
      const box = fitBoardTextBox(text, measure, innerWidth * share, fontSize);
      if (fits(box)) return box;
    }
  }

  return fitBoardTextBox(text, measure, innerWidth * 0.7, FIT_MIN_FONT_SIZE);
}

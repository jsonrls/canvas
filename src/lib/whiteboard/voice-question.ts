import {
  MAX_WHITEBOARD_QUESTION_CHARACTERS,
  MIN_WHITEBOARD_QUESTION_CHARACTERS,
} from "../ai/whiteboard-answer";
import {
  getElementBounds,
  WHITEBOARD_MAX_X,
  WHITEBOARD_MAX_Y,
  WHITEBOARD_MIN_X,
  WHITEBOARD_MIN_Y,
  type ElementBounds,
  type ViewportSize,
  type WhiteboardElement,
  type WhiteboardPoint,
} from "./model";
import {
  BOARD_TEXT_FONT_SIZE,
  boardTextHeight,
  fitBoardTextBox,
  wrapBoardText,
  type MeasureText,
} from "./text-layout";

/** The board keeps at most this much text in one element. */
const MAX_BOARD_TEXT_CHARACTERS = 600;

/** Tried in order: the usual text size first, then smaller to fit the view. */
const FONT_SIZES = [BOARD_TEXT_FONT_SIZE, 22, 18, 14];
const WRAP_WIDTHS = [520, 380, 280, 200];
/** Kept clear around whatever is already on the board. */
const MARGIN = 28;
/** Room for the arrow between the two circles. */
const ARROW_GAP = 96;
/** The arrow stops short of each circle's edge. */
const ARROW_INSET = 10;
const ANSWER_MIN_SIZE = { width: 280, height: 160 };
const ANSWER_MAX_HEIGHT = 240;
const SCAN_STEP = 24;

export interface VoiceQuestionLayout {
  /** Null when the words are placed without asking for an answer. */
  answer: ElementBounds | null;
  arrow: { end: WhiteboardPoint; start: WhiteboardPoint } | null;
  fontSize: number;
  /** False when the view had no room, so the camera should move. */
  inView: boolean;
  question: ElementBounds | null;
  text: ElementBounds;
}

export interface VoiceQuestion {
  kind: "empty" | "long" | "question" | "short";
  text: string;
}

/** Speech samples per second, as the speech model expects. */
export const VOICE_SAMPLE_RATE = 16_000;
export const MAX_VOICE_SECONDS = 60;
/** Quietest level, in a tenth of a second, that can be someone speaking. */
const SPEECH_LEVEL = 0.005;

/**
 * The part with speech in it, with a little room either side; empty when there
 * is none. The model makes up words for silence, so silence never reaches it.
 */
export function trimSilence(samples: Float32Array): Float32Array {
  const size = VOICE_SAMPLE_RATE / 10;
  let first = -1;
  let last = -1;
  for (let start = 0; start < samples.length; start += size) {
    const window = samples.subarray(start, start + size);
    const power = window.reduce((sum, value) => sum + value * value, 0);
    if (Math.sqrt(power / window.length) < SPEECH_LEVEL) continue;
    if (first < 0) first = start;
    last = start + size;
  }
  if (first < 0) return new Float32Array(0);
  const room = VOICE_SAMPLE_RATE / 2;
  return samples.slice(Math.max(0, first - room), last + room);
}

/** Drops the model's sound notes, such as [BLANK_AUDIO] or (applause). */
export function cleanTranscript(text: string): string {
  return text
    .replace(/\[[^\]]*\]|\([^)]*\)|[*♪]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Sorts what was heard by the limits of the whiteboard answer route. */
export function readVoiceQuestion(transcript: string): VoiceQuestion {
  const clean = transcript.replace(/\s+/gu, " ").trim();
  if (!clean) return { kind: "empty", text: "" };
  const text = clean.charAt(0).toUpperCase() + clean.slice(1);
  if (text.length < MIN_WHITEBOARD_QUESTION_CHARACTERS) {
    return { kind: "short", text };
  }
  if (text.length <= MAX_WHITEBOARD_QUESTION_CHARACTERS) {
    return { kind: "question", text };
  }
  return {
    kind: "long",
    text:
      text.length <= MAX_BOARD_TEXT_CHARACTERS
        ? text
        : `${text.slice(0, MAX_BOARD_TEXT_CHARACTERS - 1).trimEnd()}…`,
  };
}

function overlaps(first: ElementBounds, second: ElementBounds): boolean {
  return (
    first.x < second.x + second.width &&
    second.x < first.x + first.width &&
    first.y < second.y + second.height &&
    second.y < first.y + first.height
  );
}

/** The element and a margin. Older text can be taller than its saved box. */
function occupiedBounds(
  element: WhiteboardElement,
  measure: MeasureText,
): ElementBounds {
  const { height, width, x, y } = getElementBounds(element);
  const drawnHeight =
    element.type === "text"
      ? boardTextHeight(
          wrapBoardText(element.text, element.width, measure, element.fontSize)
            .length,
          element.fontSize,
        )
      : 0;
  return {
    x: x - MARGIN,
    y: y - MARGIN,
    width: width + MARGIN * 2,
    height: Math.max(height, drawnHeight) + MARGIN * 2,
  };
}

/** First free spot in reading order, or null when the view has none. */
function findFreeSpot(
  size: ViewportSize,
  occupied: ElementBounds[],
  view: ElementBounds,
): WhiteboardPoint | null {
  const maxX = view.x + view.width - size.width;
  const maxY = view.y + view.height - size.height;
  for (let y = view.y; y <= maxY; y += SCAN_STEP) {
    for (let x = view.x; x <= maxX; x += SCAN_STEP) {
      const spot = { x, y, ...size };
      if (!occupied.some((bounds) => overlaps(spot, bounds))) return { x, y };
    }
  }
  return null;
}

/** Next to everything on the board: below, right, above, then left. */
function findSpotOutside(
  size: ViewportSize,
  occupied: ElementBounds[],
  view: ElementBounds,
): WhiteboardPoint {
  if (occupied.length === 0) return { x: view.x, y: view.y };
  const left = Math.min(...occupied.map(({ x }) => x));
  const top = Math.min(...occupied.map(({ y }) => y));
  const right = Math.max(...occupied.map(({ x, width }) => x + width));
  const bottom = Math.max(...occupied.map(({ y, height }) => y + height));
  const spots = [
    { x: view.x, y: bottom },
    { x: right, y: view.y },
    { x: view.x, y: top - size.height },
    { x: left - size.width, y: view.y },
  ];
  return (
    spots.find(
      ({ x, y }) =>
        x >= WHITEBOARD_MIN_X &&
        y >= WHITEBOARD_MIN_Y &&
        x + size.width <= WHITEBOARD_MAX_X &&
        y + size.height <= WHITEBOARD_MAX_Y,
    ) ?? spots[0]
  );
}

interface Candidate {
  answer: ViewportSize | null;
  arrangement: "below" | "beside";
  block: ViewportSize;
  fontSize: number;
  question: ViewportSize;
  text: ViewportSize;
}

function listCandidates(
  words: string,
  measure: MeasureText,
  withAnswer: boolean,
): Candidate[] {
  return FONT_SIZES.flatMap((fontSize) =>
    WRAP_WIDTHS.flatMap((wrapWidth): Candidate[] => {
      const box = fitBoardTextBox(words, measure, wrapWidth, fontSize);
      const text = { height: box.height, width: box.width };
      if (!withAnswer) {
        return [
          {
            answer: null,
            arrangement: "below",
            block: text,
            fontSize,
            question: text,
            text,
          },
        ];
      }
      // Smallest ellipse of the same shape that holds the box, plus a little.
      const question = {
        height: Math.ceil(text.height * Math.SQRT2) + 16,
        width: Math.ceil(text.width * Math.SQRT2) + 16,
      };
      const answer = {
        height: Math.min(
          ANSWER_MAX_HEIGHT,
          Math.max(ANSWER_MIN_SIZE.height, question.height),
        ),
        width: Math.max(ANSWER_MIN_SIZE.width, question.width),
      };
      const common = { answer, fontSize, question, text };
      return [
        {
          ...common,
          arrangement: "below",
          block: {
            height: question.height + ARROW_GAP + answer.height,
            width: Math.max(question.width, answer.width),
          },
        },
        {
          ...common,
          arrangement: "beside",
          block: {
            height: Math.max(question.height, answer.height),
            width: question.width + ARROW_GAP + answer.width,
          },
        },
      ];
    }),
  );
}

function centreOn(size: ViewportSize, centre: WhiteboardPoint): ElementBounds {
  return {
    ...size,
    x: centre.x - size.width / 2,
    y: centre.y - size.height / 2,
  };
}

function positionCandidate(
  { answer, arrangement, block, fontSize, question, text }: Candidate,
  origin: WhiteboardPoint,
  inView: boolean,
): VoiceQuestionLayout {
  const middle = {
    x: origin.x + block.width / 2,
    y: origin.y + block.height / 2,
  };
  if (!answer) {
    return {
      answer: null,
      arrow: null,
      fontSize,
      inView,
      question: null,
      text: { ...origin, ...text },
    };
  }

  if (arrangement === "below") {
    const questionCentre = { x: middle.x, y: origin.y + question.height / 2 };
    const answerTop = origin.y + question.height + ARROW_GAP;
    return {
      answer: centreOn(answer, {
        x: middle.x,
        y: answerTop + answer.height / 2,
      }),
      arrow: {
        start: { x: middle.x, y: origin.y + question.height + ARROW_INSET },
        end: { x: middle.x, y: answerTop - ARROW_INSET },
      },
      fontSize,
      inView,
      question: centreOn(question, questionCentre),
      text: centreOn(text, questionCentre),
    };
  }

  const questionCentre = { x: origin.x + question.width / 2, y: middle.y };
  const answerLeft = origin.x + question.width + ARROW_GAP;
  return {
    answer: centreOn(answer, { x: answerLeft + answer.width / 2, y: middle.y }),
    arrow: {
      start: { x: origin.x + question.width + ARROW_INSET, y: middle.y },
      end: { x: answerLeft - ARROW_INSET, y: middle.y },
    },
    fontSize,
    inView,
    question: centreOn(question, questionCentre),
    text: centreOn(text, questionCentre),
  };
}

/**
 * Finds room in the view for the spoken question, its arrow and a blank answer
 * circle, without covering anything. When the view is full the set goes next
 * to the board's content and `inView` is false.
 */
export function layoutVoiceQuestion({
  elements,
  measure,
  text,
  view,
  withAnswer,
}: {
  elements: WhiteboardElement[];
  measure: MeasureText;
  text: string;
  view: ElementBounds;
  withAnswer: boolean;
}): VoiceQuestionLayout {
  const occupied = elements.map((element) => occupiedBounds(element, measure));
  const candidates = listCandidates(text, measure, withAnswer);
  for (const candidate of candidates) {
    const spot = findFreeSpot(candidate.block, occupied, view);
    if (spot) return positionCandidate(candidate, spot, true);
  }
  const [fallback] = candidates;
  return positionCandidate(
    fallback,
    findSpotOutside(fallback.block, occupied, view),
    false,
  );
}

/** The elements to add: circle, words, arrow, then the blank answer circle. */
export function voiceQuestionElements({
  author,
  layout,
  newId,
  now,
  text,
}: {
  author: { color: string; id: string; name: string };
  layout: VoiceQuestionLayout;
  newId: () => string;
  now: number;
  text: string;
}): WhiteboardElement[] {
  const { answer, arrow, fontSize, question } = layout;
  const words = {
    ...layout.text,
    ...(fontSize === BOARD_TEXT_FONT_SIZE ? {} : { fontSize }),
    text,
    type: "text" as const,
  };
  const parts =
    answer && arrow && question
      ? [
          { ...question, type: "ellipse" as const },
          words,
          {
            ...arrow.start,
            height: arrow.end.y - arrow.start.y,
            type: "arrow" as const,
            width: arrow.end.x - arrow.start.x,
          },
          { ...answer, type: "ellipse" as const },
        ]
      : [words];
  return parts.map((part, index) => ({
    authorId: author.id,
    authorName: author.name,
    color: author.color,
    // The board draws in this order, so the words stay above their circle.
    createdAt: new Date(now + index).toISOString(),
    id: newId(),
    points: [],
    src: "",
    text: "",
    ...part,
  }));
}

/** What to tell the teacher when the words could not be had. */
export function voiceErrorMessage(code: string): string {
  switch (code) {
    case "NotAllowedError":
    case "SecurityError":
      return "The microphone is blocked. Allow it for this site in your browser settings, then try again.";
    case "NotFoundError":
      return "No microphone was found. Connect one and try again.";
    case "NotReadableError":
      return "The microphone is being used by another app. Close it there and try again.";
    case "unsupported":
      return "This browser cannot record from a microphone here. Update it, and open the room over https.";
    case "model":
      return "The speech model could not be downloaded. Check your connection and try again.";
    default:
      return "Your words could not be turned into text. Try again.";
  }
}

import assert from "node:assert/strict";

import { findWhiteboardAnswerPlacement } from "../src/lib/whiteboard/answer-placement";
import {
  readWhiteboardElement,
  type WhiteboardElement,
} from "../src/lib/whiteboard/model";
import {
  boardLineHeight,
  boardTextHeight,
  fitBoardTextBox,
  fitBoardTextInEllipse,
  wrapBoardText,
} from "../src/lib/whiteboard/text-layout";

let clock = 0;
function element(
  partial: Partial<WhiteboardElement> & Pick<WhiteboardElement, "id" | "type">,
): WhiteboardElement {
  return {
    authorId: "u1",
    authorName: "Sample",
    color: "#7352FA",
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, clock++)).toISOString(),
    height: 0,
    points: [],
    src: "",
    text: "",
    width: 0,
    x: 0,
    y: 0,
    ...partial,
  } as WhiteboardElement;
}

/** A hand-drawn loop: wobbly radius, and the stroke can stop short of closing. */
function handDrawnLoop(
  id: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  sweep = 1,
): WhiteboardElement {
  const points = Array.from({ length: 60 }, (_, index) => {
    const angle = (index / 59) * Math.PI * 2 * sweep;
    const wobble = 1 + 0.08 * Math.sin(index * 1.7);
    return {
      x: cx + Math.cos(angle) * rx * wobble,
      y: cy + Math.sin(angle) * ry * wobble,
    };
  });
  return element({ id, type: "draw", points });
}

/** A hand-drawn arrow: a slightly bent shaft ending in a small hook. */
function handDrawnArrow(
  id: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
): WhiteboardElement {
  const shaft = Array.from({ length: 20 }, (_, index) => {
    const t = index / 19;
    return {
      x: from.x + (to.x - from.x) * t + Math.sin(t * Math.PI) * 6,
      y: from.y + (to.y - from.y) * t,
    };
  });
  return element({
    id,
    type: "draw",
    points: [...shaft, { x: to.x - 10, y: to.y - 12 }],
  });
}

const QUESTION =
  "What is the most common bacterium associated with canine pyometra?";

// 1. The reported board: shapes from the toolbar, empty circle drawn last.
{
  const elements = [
    element({
      id: "q",
      type: "ellipse",
      x: 40,
      y: 20,
      width: 850,
      height: 110,
    }),
    element({
      id: "t",
      type: "text",
      x: 80,
      y: 55,
      width: 160,
      height: 36,
      text: QUESTION,
    }),
    element({ id: "a", type: "arrow", x: 468, y: 145, width: 2, height: 110 }),
    element({
      id: "b",
      type: "ellipse",
      x: 45,
      y: 245,
      width: 890,
      height: 235,
    }),
  ];
  for (const selected of [null, "q", "t", "a", "b"]) {
    const placement = findWhiteboardAnswerPlacement(elements, selected);
    assert.equal(
      placement?.targetId,
      "b",
      `toolbar shapes, selected=${selected}`,
    );
    assert.equal(placement?.question, QUESTION);
  }
}

// 2. Everything hand drawn: wobbly loops (one not closed) and a drawn arrow.
{
  const elements = [
    handDrawnLoop("q", 460, 80, 420, 70),
    element({
      id: "t",
      type: "text",
      x: 120,
      y: 62,
      width: 160,
      height: 36,
      text: QUESTION,
    }),
    handDrawnArrow("a", { x: 460, y: 160 }, { x: 462, y: 260 }),
    handDrawnLoop("b", 470, 380, 400, 110, 0.86),
  ];
  for (const selected of [null, "a", "b"]) {
    const placement = findWhiteboardAnswerPlacement(elements, selected);
    assert.equal(placement?.targetId, "b", `hand drawn, selected=${selected}`);
  }
}

// 3. Mixed: toolbar circle for the question, hand-drawn answer circle.
{
  const elements = [
    element({
      id: "q",
      type: "ellipse",
      x: 40,
      y: 20,
      width: 600,
      height: 110,
    }),
    element({
      id: "t",
      type: "text",
      x: 80,
      y: 55,
      width: 160,
      height: 36,
      text: QUESTION,
    }),
    element({ id: "a", type: "line", x: 340, y: 140, width: 0, height: 120 }),
    handDrawnLoop("b", 340, 360, 260, 90),
  ];
  assert.equal(findWhiteboardAnswerPlacement(elements, "b")?.targetId, "b");
}

// 4. No answer circle, or the only other circle already holds text: nothing.
{
  const lonely = [
    element({
      id: "q",
      type: "ellipse",
      x: 40,
      y: 20,
      width: 600,
      height: 110,
    }),
    element({
      id: "t",
      type: "text",
      x: 80,
      y: 55,
      width: 160,
      height: 36,
      text: QUESTION,
    }),
  ];
  assert.equal(findWhiteboardAnswerPlacement(lonely, null), null);
  const bothFull = [
    ...lonely,
    element({
      id: "b",
      type: "ellipse",
      x: 40,
      y: 260,
      width: 600,
      height: 160,
    }),
    element({
      id: "t2",
      type: "text",
      x: 80,
      y: 320,
      width: 160,
      height: 36,
      text: "Already answered",
    }),
  ];
  assert.equal(findWhiteboardAnswerPlacement(bothFull, "b"), null);
}

// Text boxes: wrap to the width, hug short text, never spill a long word.
{
  const measure = (text: string): number => text.length * 10;
  const question =
    "What is the most common bacterium associated with canine pyometra?";

  const box = fitBoardTextBox(question, measure, 300);
  assert.ok(box.lines.length > 1, "long text wraps");
  for (const line of box.lines) assert.ok(measure(line) <= 300, line);
  assert.equal(box.lines.join(" "), question, "wrapping keeps every word");
  assert.equal(box.height, boardTextHeight(box.lines.length));
  assert.ok(box.width <= 300);

  const short = fitBoardTextBox("Hi there", measure, 300);
  assert.deepEqual(short.lines, ["Hi there"]);
  assert.equal(short.width, 84, "short text hugs its width");

  assert.deepEqual(
    wrapBoardText("one\ntwo", 300, measure),
    ["one", "two"],
    "typed line breaks stay",
  );
  const longWord = wrapBoardText("x".repeat(25), 100, measure);
  assert.deepEqual(longWord, ["x".repeat(10), "x".repeat(10), "x".repeat(5)]);
}

// Answers fit their circle: big for a short answer, smaller for a long one,
// and the box corners always stay inside the ellipse.
{
  const measure = (text: string): number => text.length * 15;
  const circle = { width: 880, height: 290 };
  const insideEllipse = (box: { height: number; width: number }): boolean =>
    (box.width / circle.width) ** 2 + (box.height / circle.height) ** 2 <= 1;

  const short = fitBoardTextInEllipse("Escherichia coli", measure, circle);
  const long = fitBoardTextInEllipse(
    "Escherichia coli\n• Ascends from vaginal flora\n• Progesterone aids infection\n• Also Staphylococcus, Streptococcus",
    measure,
    circle,
  );
  assert.ok(insideEllipse(short), "short answer fits");
  assert.ok(insideEllipse(long), "long answer fits");
  assert.ok(short.fontSize > long.fontSize, "short answers get bigger text");
  assert.ok(short.fontSize > 28, "a short answer grows past the default");

  const tiny = fitBoardTextInEllipse("x".repeat(400), measure, {
    width: 90,
    height: 60,
  });
  assert.equal(tiny.fontSize, 12, "falls back to the smallest size");

  // Height and line height scale with the size.
  assert.equal(boardTextHeight(2, 56), boardTextHeight(2) * 2);
  assert.equal(boardLineHeight(14), 16);
}

// The board keeps a valid text size and drops a bad one.
{
  const base = element({ id: "t", type: "text", text: "Hi" });
  assert.equal(readWhiteboardElement({ ...base, fontSize: 40 })?.fontSize, 40);
  assert.equal(
    readWhiteboardElement({ ...base, fontSize: 9_999 })?.fontSize,
    undefined,
  );
  assert.equal(
    "fontSize" in (readWhiteboardElement(base) ?? {}),
    false,
    "older text has no size field",
  );
}

console.log("Whiteboard answer placement and text layout checks passed.");

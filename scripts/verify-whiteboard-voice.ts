import assert from "node:assert/strict";

import { findWhiteboardAnswerPlacement } from "../src/lib/whiteboard/answer-placement";
import {
  getElementBounds,
  readWhiteboardElement,
  type ElementBounds,
  type WhiteboardElement,
} from "../src/lib/whiteboard/model";
import {
  cleanTranscript,
  layoutVoiceQuestion,
  readVoiceQuestion,
  trimSilence,
  voiceErrorMessage,
  voiceQuestionElements,
} from "../src/lib/whiteboard/voice-question";

const measure = (text: string): number => text.length * 14;
const author = { color: "#7352FA", id: "u1", name: "Sample" };
const QUESTION = "What is the most common cause of canine pyometra?";
const DESKTOP: ElementBounds = { x: 0, y: 0, width: 1_200, height: 760 };
const PHONE: ElementBounds = { x: -50, y: 40, width: 375, height: 620 };

let clock = 0;
function element(
  partial: Partial<WhiteboardElement> & Pick<WhiteboardElement, "type">,
): WhiteboardElement {
  clock += 1;
  return {
    authorId: "u1",
    authorName: "Sample",
    color: "#7352FA",
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, clock)).toISOString(),
    height: 0,
    id: `e${clock}`,
    points: [],
    src: "",
    text: "",
    width: 0,
    x: 0,
    y: 0,
    ...partial,
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

function contains(outer: ElementBounds, inner: ElementBounds): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function place(
  elements: WhiteboardElement[],
  view: ElementBounds,
  text = QUESTION,
  withAnswer = true,
) {
  let next = 0;
  const layout = layoutVoiceQuestion({
    elements,
    measure,
    text,
    view,
    withAnswer,
  });
  const placed = voiceQuestionElements({
    author,
    layout,
    newId: () => `voice-${(next += 1)}`,
    now: Date.UTC(2026, 5, 1),
    text,
  });
  return { layout, placed };
}

// Silence is kept from the model; quiet speech is not.
const tone = (level: number, seconds: number): Float32Array =>
  Float32Array.from(
    { length: seconds * 16_000 },
    (_, index) => level * Math.sin(index / 10),
  );
assert.equal(trimSilence(new Float32Array(0)).length, 0);
assert.equal(trimSilence(new Float32Array(16_000)).length, 0);
assert.equal(trimSilence(tone(0.002, 2)).length, 0, "room noise");
assert.equal(trimSilence(tone(0.02, 1)).length, 16_000, "quiet speech");
{
  const mostlyQuiet = new Float32Array(10 * 16_000);
  mostlyQuiet.set(tone(0.05, 1), 4 * 16_000);
  assert.equal(
    trimSilence(mostlyQuiet).length,
    2 * 16_000,
    "one second of speech in ten, with half a second either side",
  );
}

// The model's notes about sounds are not words.
assert.equal(cleanTranscript(" [BLANK_AUDIO] "), "");
assert.equal(cleanTranscript("(applause) What is  DNA? ♪"), "What is DNA?");
assert.equal(cleanTranscript(" What is an enzyme?"), "What is an enzyme?");

// Limits match the answer route: 4 to 500 characters.
assert.equal(readVoiceQuestion("  ").kind, "empty");
assert.equal(readVoiceQuestion("Why").kind, "short");
assert.equal(readVoiceQuestion("Why?").kind, "question");
assert.equal(readVoiceQuestion("x".repeat(500)).kind, "question");
assert.equal(readVoiceQuestion("x".repeat(501)).kind, "long");
const long = readVoiceQuestion("word ".repeat(200));
assert.equal(long.kind, "long");
assert.ok(long.text.length <= 600, "fits the board's text limit");
assert.match(long.text, /…$/u, "says that it was cut");
assert.equal(
  readVoiceQuestion("  what is \n an enzyme ").text,
  "What is an enzyme",
  "starts with a capital, one line",
);

// Every placement: new, inside the view, off everything else, one clean set,
// and still found by the board's own "AI answer" button for a retry.
function checkPlacement(
  name: string,
  elements: WhiteboardElement[],
  view: ElementBounds,
  text = QUESTION,
): void {
  const { layout, placed } = place(elements, view, text);
  assert.equal(layout.inView, true, `${name}: stays in view`);
  assert.deepEqual(
    placed.map(({ type }) => type),
    ["ellipse", "text", "arrow", "ellipse"],
    name,
  );
  for (const item of placed) {
    assert.ok(readWhiteboardElement(item), `${name}: ${item.type} is valid`);
    assert.ok(
      contains(view, getElementBounds(item)),
      `${name}: ${item.type} is inside the view`,
    );
    for (const other of elements) {
      assert.ok(
        !overlaps(getElementBounds(item), getElementBounds(other)),
        `${name}: ${item.type} covers nothing`,
      );
    }
  }
  const [question, words, arrow, answer] = placed;
  const w = getElementBounds(words);
  const q = getElementBounds(question);
  assert.ok(
    (w.width / q.width) ** 2 + (w.height / q.height) ** 2 <= 1,
    `${name}: the words fit their circle`,
  );
  assert.ok(
    !overlaps(getElementBounds(question), getElementBounds(answer)),
    `${name}: circles are apart`,
  );
  assert.ok(
    Math.hypot(arrow.width, arrow.height) >= 40,
    `${name}: the arrow is long enough to see`,
  );
  assert.ok(words.createdAt > question.createdAt, "words draw over the circle");
  for (const selected of [null, words.id]) {
    const found = findWhiteboardAnswerPlacement(
      [...elements, ...placed],
      selected,
    );
    assert.equal(found?.targetId, answer.id, `${name}: retry finds the circle`);
    assert.equal(found?.question, text);
  }
}

checkPlacement("empty desktop", [], DESKTOP);
checkPlacement("empty phone", [], PHONE);
checkPlacement("long question", [], DESKTOP, "Explain it. ".repeat(40).trim());
checkPlacement("long on phone", [], PHONE, "Explain it. ".repeat(20).trim());
checkPlacement("short question", [], DESKTOP, "Why?");
checkPlacement(
  "drawing on the left",
  [element({ type: "rectangle", x: 20, y: 20, width: 420, height: 700 })],
  DESKTOP,
);
checkPlacement(
  "drawing across the top",
  [element({ type: "rectangle", x: 20, y: 10, width: 1_160, height: 200 })],
  DESKTOP,
);

// A second question goes beside or below the first, not over it.
{
  const first = place([], DESKTOP).placed;
  const { placed } = place(first, DESKTOP);
  for (const item of placed) {
    for (const other of first) {
      assert.ok(!overlaps(getElementBounds(item), getElementBounds(other)));
    }
  }
}

// Old text can be taller than its saved box; its real lines are avoided.
{
  const old = element({
    type: "text",
    x: 100,
    y: 100,
    width: 160,
    height: 36,
    text: QUESTION.repeat(2),
  });
  const { placed } = place([old], DESKTOP);
  for (const item of placed) {
    assert.ok(
      !overlaps(getElementBounds(item), {
        ...getElementBounds(old),
        height: 300,
      }),
      "clear of every wrapped line",
    );
  }
}

// A full view: goes next to the board's content and asks for the camera.
{
  const wall = element({
    type: "rectangle",
    x: -20,
    y: -20,
    width: 1_300,
    height: 900,
  });
  const { layout, placed } = place([wall], DESKTOP);
  assert.equal(layout.inView, false);
  for (const item of placed) {
    assert.ok(!overlaps(getElementBounds(item), getElementBounds(wall)));
    assert.ok(readWhiteboardElement(item));
  }
}

// Zoomed in so far that nothing fits: still placed.
{
  const tiny: ElementBounds = { x: 10, y: 10, width: 60, height: 40 };
  assert.equal(place([], tiny).layout.inView, false);
  assert.equal(place([], tiny).placed.length, 4);
}

// Content at the bottom edge of the board: placed inside the board instead.
{
  const bottom = element({
    type: "rectangle",
    x: 0,
    y: 6_400,
    width: 1_300,
    height: 780,
  });
  const { placed } = place([bottom], {
    x: 0,
    y: 6_400,
    width: 1_200,
    height: 760,
  });
  for (const item of placed) {
    const bounds = getElementBounds(item);
    assert.ok(bounds.y + bounds.height <= 7_200, "inside the board");
    assert.ok(!overlaps(bounds, getElementBounds(bottom)));
  }
}

// Words that cannot be answered are placed on their own, as plain board text.
{
  const { placed } = place([], DESKTOP, "Why", false);
  assert.deepEqual(
    placed.map(({ type }) => type),
    ["text"],
  );
  assert.equal(placed[0].fontSize, undefined, "the usual text size");
}

// Errors speak plainly.
assert.match(voiceErrorMessage("NotAllowedError"), /blocked/u);
assert.match(voiceErrorMessage("NotFoundError"), /No microphone/u);
assert.match(voiceErrorMessage("NotReadableError"), /another app/u);
assert.match(voiceErrorMessage("unsupported"), /https/u);
assert.match(voiceErrorMessage("model"), /downloaded/u);
assert.ok(voiceErrorMessage("something-new"), "unknown errors still speak");

console.log("Whiteboard voice question checks passed.");

import assert from "node:assert/strict";

import type { PdfAnnotation } from "../src/lib/pdf-annotations/model";
import {
  fitPageWidth,
  isVisualMark,
  visualMarkIds,
} from "../src/lib/pdf-annotations/study-tool";

function mark(
  id: string,
  type: PdfAnnotation["type"],
  page = 1,
): PdfAnnotation {
  return {
    authorId: "u1",
    authorName: "Sample",
    color: "#7352FA",
    createdAt: "2026-11-24T00:00:00Z",
    height: 0.1,
    id,
    page,
    points: [],
    revision: "r1",
    text: "",
    type,
    width: 0.1,
    x: 0,
    y: 0,
  };
}

assert.equal(isVisualMark("draw"), true);
assert.equal(isVisualMark("highlight"), true);
assert.equal(isVisualMark("underline"), true);
assert.equal(isVisualMark("sticky"), false);
assert.equal(isVisualMark("comment"), false);

const annotations = [
  mark("a", "draw", 1),
  mark("b", "highlight", 3),
  mark("c", "sticky", 1),
  mark("d", "underline", 12),
  mark("e", "comment", 2),
];
assert.deepEqual(visualMarkIds(annotations), ["a", "b", "d"]);
assert.deepEqual(visualMarkIds([mark("x", "sticky")]), []);
assert.deepEqual(visualMarkIds([]), []);

// Fit page: a 16:9 slide in a 1600 x 800 space is limited by height,
// and in a 1300 x 800 space by width.
const slide = 16 / 9;
assert.equal(
  fitPageWidth({ width: 1600, height: 800 }, slide, false),
  800 * slide,
);
assert.equal(fitPageWidth({ width: 1300, height: 800 }, slide, false), 1300);
// A portrait page in the same space is also limited by height.
assert.equal(
  fitPageWidth({ width: 1300, height: 800 }, 612 / 792, false),
  800 * (612 / 792),
);
// A wide space with plenty of height is limited by width.
assert.equal(fitPageWidth({ width: 600, height: 2000 }, slide, false), 600);
// Phones fit the width only.
assert.equal(fitPageWidth({ width: 358, height: 300 }, slide, true), 358);
// Not measured yet: fall back to the width. Never below 280px.
assert.equal(fitPageWidth({ width: 720, height: 0 }, slide, false), 720);
assert.equal(fitPageWidth({ width: 900, height: 100 }, slide, false), 280);

console.log("PDF clear-marks and fit-page checks passed.");

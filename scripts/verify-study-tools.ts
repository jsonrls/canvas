import {
  createStudyRequestScope,
  runStudyRequest,
} from "../src/lib/ai/study-request";
import assert from "node:assert/strict";
import {
  fitCameraToElements,
  getBoardPoint,
  getResizeHandles,
  moveWhiteboardElement,
} from "../src/lib/whiteboard/geometry";
import {
  findWhiteboardAnswerPlacement,
  wrapAnswerForTarget,
} from "../src/lib/whiteboard/answer-placement";
import {
  createInitialCamera,
  getElementBounds,
  WHITEBOARD_MAX_X,
  WHITEBOARD_MIN_Y,
  type WhiteboardElement,
} from "../src/lib/whiteboard/model";
import {
  annotationUsesComments,
  isRoomPdfAsset,
  readError,
  formatBytes,
} from "../src/lib/pdf-annotations/study-tool";
import {
  readApiPayload,
  readSavedGuidesPayload,
  readErrorMessage,
} from "../src/lib/ai/study-tool-payload";
import {
  quizScore,
  studyTabIndex,
  toggleRevealedCard,
} from "../src/lib/ai/study-view-state";

function element(overrides: Partial<WhiteboardElement>): WhiteboardElement {
  return {
    authorId: "author",
    authorName: "Study partner",
    color: "blue",
    createdAt: "2026-01-01",
    height: 100,
    id: "shape",
    points: [],
    src: "",
    text: "",
    type: "rectangle",
    width: 200,
    x: 0,
    y: 0,
    ...overrides,
  };
}
const viewport = { width: 800, height: 600 };
assert.deepEqual(
  fitCameraToElements([], viewport),
  createInitialCamera(viewport),
);
const content = element({ x: 300, y: 200 });
const camera = fitCameraToElements([content], viewport, 1.5);
assert.equal(camera.zoom, 1.5);
assert.equal(camera.x + viewport.width / camera.zoom / 2, 400);
assert.equal(camera.y + viewport.height / camera.zoom / 2, 250);
const svg = {
  getBoundingClientRect: () => ({ left: 20, top: 30, width: 400, height: 300 }),
} as SVGSVGElement;
assert.deepEqual(
  getBoardPoint({ x: 100, y: 200, zoom: 2 }, viewport, svg, 220, 130),
  { x: 200, y: 250 },
);
const line = element({ type: "arrow", x: 40, y: 50, width: -100, height: -70 });
assert.deepEqual(getResizeHandles(line), [
  { handle: "start", x: 40, y: 50 },
  { handle: "end", x: -60, y: -20 },
]);
const moved = moveWhiteboardElement(
  line,
  { initialX: 40, initialY: 50, initialPoints: [], startPoint: { x: 0, y: 0 } },
  { x: 20_000, y: -20_000 },
);
const movedBounds = getElementBounds(moved);
assert.equal(movedBounds.x + movedBounds.width, WHITEBOARD_MAX_X);
assert.equal(movedBounds.y, WHITEBOARD_MIN_Y);
assert.equal(line.x, 40);
const source = element({
  id: "source",
  type: "ellipse",
  width: 250,
  height: 150,
});
const question = element({
  id: "question",
  type: "text",
  x: 30,
  y: 30,
  width: 160,
  height: 36,
  text: " Why? ",
});
const target = element({
  id: "target",
  type: "ellipse",
  x: 500,
  width: 250,
  height: 150,
});
const arrow = element({
  id: "arrow",
  type: "arrow",
  x: 250,
  y: 75,
  width: 250,
  height: 0,
});
assert.equal(
  findWhiteboardAnswerPlacement([source, question, target, arrow], "question")
    ?.targetId,
  "target",
);
assert.equal(
  findWhiteboardAnswerPlacement([source, question, target, arrow], "question")
    ?.question,
  "Why?",
);
assert.equal(findWhiteboardAnswerPlacement([source, question], null), null);
assert.equal(
  findWhiteboardAnswerPlacement(
    [
      source,
      question,
      target,
      element({ ...question, id: "occupied", x: 530 }),
      arrow,
    ],
    null,
  ),
  null,
);
assert.equal(wrapAnswerForTarget("one\n\n two  three", 500), "one\ntwo three");
assert.equal(
  wrapAnswerForTarget(Array(20).fill("line").join("\n"), 500).split("\n")
    .length,
  7,
);
assert.equal(annotationUsesComments("sticky"), true);
assert.equal(annotationUsesComments("draw"), false);
assert.equal(
  isRoomPdfAsset({
    fileName: "notes.pdf",
    revision: "r1",
    signedUrl: "/private",
    size: 123,
    storagePath: "room/pdf",
  }),
  true,
);
assert.equal(isRoomPdfAsset({ fileName: "notes.pdf" }), false);
assert.equal(readError({ error: "expired" }, "fallback"), "expired");
assert.equal(readError(null, "fallback"), "fallback");
assert.equal(formatBytes(1024), "1 KB");
assert.equal(formatBytes(1024 * 1024), "1.0 MB");
assert.equal(readApiPayload(null), null);
assert.equal(readApiPayload({ generatedAt: "today" }), null);
const payload = { generatedAt: "today", sourceCharacters: 80, studyPack: {} };
assert.equal(readApiPayload(payload), payload);
const guide = {
  id: "guide",
  title: "Guide",
  generatedAt: "today",
  createdAt: "today",
  sourceCharacters: 80,
};
assert.deepEqual(
  readSavedGuidesPayload({ guides: [guide, null, { id: "invalid" }] }),
  [guide],
);
assert.equal(readErrorMessage({ error: "retry" }), "retry");
assert.equal(readErrorMessage({ error: 123 }), null);
assert.equal(studyTabIndex("ArrowLeft", 0, 5), 4);
assert.equal(studyTabIndex("ArrowRight", 4, 5), 0);
assert.equal(studyTabIndex("Home", 3, 5), 0);
assert.equal(studyTabIndex("End", 1, 5), 4);
assert.equal(studyTabIndex("Tab", 1, 5), null);
const revealed = new Set([1]);
assert.deepEqual(toggleRevealedCard(revealed, 1), new Set());
assert.deepEqual(toggleRevealedCard(revealed, 2), new Set([1, 2]));
assert.deepEqual(revealed, new Set([1]));
assert.deepEqual(
  quizScore(
    [
      {
        question: "Question",
        options: ["a", "b", "c", "d"],
        answerIndex: 1,
        explanation: "Explanation",
      },
    ],
    { 0: 1 },
  ),
  { answeredCount: 1, correctCount: 1 },
);
console.log(
  "Study tool geometry, placement, payload, and view-state checks passed.",
);

async function verifyRequestLifecycles() {
  function deferred<T>() {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    return { promise, resolve, reject };
  }
  const scope = createStudyRequestScope();
  const writes: string[] = [];
  let pending = true;
  const handlers = {
    success: (value: string) => {
      writes.push(value);
    },
    error: () => {
      writes.push("error");
    },
    settled: () => {
      pending = false;
    },
  };
  // JSON decoding can resolve even after a fetch signal was aborted.
  const oldJson = deferred<string>();
  const oldRequest = scope.start()!;
  const oldRun = runStudyRequest(oldRequest, () => oldJson.promise, handlers);
  const newJson = deferred<string>();
  const newRequest = scope.start()!;
  const newRun = runStudyRequest(newRequest, () => newJson.promise, handlers);
  assert.equal(oldRequest.signal.aborted, true);
  oldJson.resolve("stale generation or PDF refresh");
  await oldRun;
  assert.deepEqual(writes, []);
  assert.equal(pending, true, "old finally must not clear replacement loading");
  newJson.resolve("replacement asset or study pack");
  await newRun;
  assert.deepEqual(writes, ["replacement asset or study pack"]);
  assert.equal(pending, false);

  // A disposed refresh/upload cannot publish success, errors, toasts, or resets.
  for (const reject of [false, true]) {
    scope.activate();
    const late = deferred<string>();
    const request = scope.start()!;
    const run = runStudyRequest(request, () => late.promise, handlers);
    const before: string[] = [...writes];
    pending = true;
    scope.dispose();
    assert.equal(scope.start(), null);
    if (reject) late.reject(new Error("late storage failure"));
    else late.resolve("late uploaded asset");
    await run;
    assert.deepEqual(writes, before);
    assert.equal(pending, true);
  }

  // Strict Mode setup after cleanup gets a fresh identity; old completion stays stale.
  scope.activate();
  const previous = scope.start()!;
  scope.dispose();
  scope.activate();
  const resumed = scope.start()!;
  previous.finish();
  assert.equal(previous.isCurrent(), false);
  assert.equal(resumed.isCurrent(), true);
  scope.cancel();
  assert.equal(resumed.isCurrent(), false);

  // Upload validation/decoding that ignores abort must not launch its next stage.
  scope.activate();
  const validation = deferred<string>();
  const upload = scope.start()!;
  let storageWrites = 0;
  const uploading = runStudyRequest(
    upload,
    async () => {
      await validation.promise;
      upload.signal.throwIfAborted();
      storageWrites++;
      return "published";
    },
    handlers,
  );
  scope.start();
  validation.resolve("valid PDF");
  await uploading;
  assert.equal(storageWrites, 0);

  // Library operations remain independent, but all are invalidated on room exit.
  const library = Array.from({ length: 4 }, createStudyRequestScope);
  const libraryResponses = library.map(() => deferred<string>());
  const libraryRequests = library.map((operation) => operation.start()!);
  const libraryRuns = libraryRequests.map((request, index) =>
    runStudyRequest(request, () => libraryResponses[index].promise, handlers),
  );
  const beforeRoomChange: string[] = [...writes];
  for (const operation of library) {
    operation.dispose();
    operation.activate();
  }
  const nextRoom = library[0].start()!;
  for (const [index, response] of libraryResponses.entries()) {
    assert.equal(libraryRequests[index].signal.aborted, true);
    response.resolve(["old list", "old load", "old save", "old delete"][index]);
  }
  await Promise.all(libraryRuns);
  assert.deepEqual(writes, beforeRoomChange);
  assert.equal(nextRoom.isCurrent(), true);
  await runStudyRequest(nextRoom, async () => "new room library", handlers);
  assert.equal(writes.at(-1), "new room library");

  const failed = scope.start()!;
  pending = true;
  await runStudyRequest(
    failed,
    async () => {
      throw new Error("active failure");
    },
    handlers,
  );
  assert.equal(writes.at(-1), "error");
  assert.equal(pending, false);
  console.log(
    "Study request cancellation, replacement, disposal, and late-result checks passed.",
  );
}
void verifyRequestLifecycles().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

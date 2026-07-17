import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Y from "yjs";

import { ConflictReviewPanel } from "../src/components/collaboration/conflict-review-panel";
import {
  captureOfflineDraft,
  createConflictCheckpointLabel,
  createDraftExcerpt,
  createReconciliationWindow,
  finalizeConflictReview,
  isReconciliationUpdateRelevant,
  recordReconciliationUpdate,
  type EditorDraft,
} from "../src/lib/collaboration/conflict-review";

function createDraft(text: string): EditorDraft {
  return {
    content: {
      content: [{ content: [{ text, type: "text" }], type: "paragraph" }],
      type: "doc",
    },
    text,
  };
}

assert.equal(isReconciliationUpdateRelevant("local", false), false);
assert.equal(isReconciliationUpdateRelevant("local", true), true);
assert.equal(isReconciliationUpdateRelevant("remote", false), true);

const localOnly = createReconciliationWindow();
recordReconciliationUpdate(localOnly, "local");
captureOfflineDraft(localOnly, createDraft("Local mechanism note"));
assert.equal(
  finalizeConflictReview(localOnly, createDraft("Local mechanism note"), 1),
  null,
  "local-only edits must not create a conflict review",
);

const remoteOnly = createReconciliationWindow();
recordReconciliationUpdate(remoteOnly, "remote");
assert.equal(
  finalizeConflictReview(remoteOnly, createDraft("Remote exam clue"), 2),
  null,
  "remote-only updates must not create a conflict review",
);

const missingDraft = createReconciliationWindow();
recordReconciliationUpdate(missingDraft, "local");
recordReconciliationUpdate(missingDraft, "remote");
assert.equal(
  finalizeConflictReview(missingDraft, createDraft("Merged note"), 3),
  null,
  "overlap without a pre-remote draft must fail closed",
);

const overlap = createReconciliationWindow();
recordReconciliationUpdate(overlap, "local");
recordReconciliationUpdate(overlap, "local");
captureOfflineDraft(overlap, createDraft("Offline beta blocker note"));
captureOfflineDraft(overlap, createDraft("A later draft must not replace it"));
recordReconciliationUpdate(overlap, "remote");
const review = finalizeConflictReview(
  overlap,
  createDraft("Offline beta blocker note plus a shared exam clue"),
  4,
);

assert.ok(review, "overlapping local and remote document updates need review");
assert.equal(review.id, 4);
assert.equal(review.localUpdateCount, 2);
assert.equal(review.remoteUpdateCount, 1);
assert.equal(review.offlineDraft.text, "Offline beta blocker note");
assert.match(review.mergedDraft.text, /shared exam clue/u);

assert.equal(
  createDraftExcerpt("  alpha\n\n beta\t clue  "),
  "alpha beta clue",
);
assert.equal(createDraftExcerpt(" \n\t "), "No text in this draft.");
assert.equal(createDraftExcerpt("123456789", 6), "12345…");

const checkpointLabel = createConflictCheckpointLabel(
  new Date("2026-07-17T04:15:00.000Z"),
  "UTC",
);
assert.match(
  checkpointLabel,
  /^Merged before offline draft · Jul 17, 4:15 AM$/u,
);
assert.ok(checkpointLabel.length <= 80);

const providerOrigin = {};
const localDocument = new Y.Doc();
const remoteDocument = new Y.Doc();
const localText = localDocument.getText("notes");
const remoteText = remoteDocument.getText("notes");
localText.insert(0, "Shared baseline");
Y.applyUpdate(remoteDocument, Y.encodeStateAsUpdate(localDocument));
const yjsWindow = createReconciliationWindow();

localDocument.on("beforeTransaction", (transaction) => {
  if (transaction.origin === providerOrigin) {
    captureOfflineDraft(yjsWindow, createDraft(localText.toString()));
  }
});
localDocument.on("update", (_update, origin) => {
  recordReconciliationUpdate(
    yjsWindow,
    origin === providerOrigin ? "remote" : "local",
  );
});

localText.insert(localText.length, " + offline clue");
remoteText.insert(0, "Shared collaborator clue + ");
const remoteDifference = Y.encodeStateAsUpdate(
  remoteDocument,
  Y.encodeStateVector(localDocument),
);
Y.applyUpdate(localDocument, remoteDifference, providerOrigin);
const yjsReview = finalizeConflictReview(
  yjsWindow,
  createDraft(localText.toString()),
  5,
);

assert.ok(yjsReview, "provider-origin Yjs overlap must create a review");
assert.match(yjsReview.offlineDraft.text, /offline clue/u);
assert.doesNotMatch(yjsReview.offlineDraft.text, /collaborator clue/u);
assert.match(yjsReview.mergedDraft.text, /offline clue/u);
assert.match(yjsReview.mergedDraft.text, /collaborator clue/u);

const reviewMarkup = renderToStaticMarkup(
  createElement(ConflictReviewPanel, {
    canUseOfflineDraft: true,
    onKeepMerged: () => undefined,
    onResolved: () => undefined,
    onUseOfflineDraft: async () => ({ message: "Restored", ok: true }),
    review: yjsReview,
  }),
);

assert.match(reviewMarkup, /Reconnection review/u);
assert.match(reviewMarkup, /Your offline draft/u);
assert.match(reviewMarkup, /Current merged note/u);
assert.match(reviewMarkup, /Recommended/u);
assert.match(reviewMarkup, /Keep merged note/u);
assert.match(reviewMarkup, /Use my offline draft/u);
assert.match(reviewMarkup, /aria-labelledby="conflict-review-title-5"/u);
assert.match(reviewMarkup, /aria-busy="false"/u);

localDocument.destroy();
remoteDocument.destroy();

console.log("Conflict review verification passed.");

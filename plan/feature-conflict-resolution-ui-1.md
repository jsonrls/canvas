---
goal: Add an accessible reconnection review for overlapping offline and remote note changes
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-17
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, collaboration, conflict-review, yjs, accessibility]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Add a focused conflict resolution UI to the collaborative notes canvas. Yjs remains the only document merge engine. BoardPrep detects a review-worthy reconnection only when the current browser produced local document updates while remote sync was unavailable and then received remote document updates during reconciliation. The UI compares the pre-reconnect local draft with the resulting live merge, recommends the non-destructive merged result, and protects an explicit local-draft override with a durable checkpoint.

Closure note: the environment exposed neither its documented browser CLI nor an interactive browser backend after three checks. On 2026-07-17, the product owner accepted the passing production build, authenticated two-client CRDT merge, real Yjs transaction-origin detector, static accessible panel rendering, strict types, and lint as the closure gate. This records an explicit verification exception and does not claim that interactive browser acceptance ran.

## 1. Requirements & Constraints

- **REQ-001**: Start a transient reconciliation window while the first remote connection is pending and whenever an established provider loses sync, disconnects, or errors.
- **REQ-002**: Count document updates by Yjs transaction origin: updates whose origin is the room's `WebsocketProvider` are remote; other updates count as local only while the editor is focused so initialization and persistence activity cannot create a false review.
- **REQ-003**: Capture the local editor draft immediately before the first remote Yjs transaction is applied, and finalize the review only after the provider reports synchronization.
- **REQ-004**: Render a conflict review only when the same reconciliation window contains at least one local update, at least one remote update, and a valid pre-reconnect draft. Presence and awareness updates must never trigger it.
- **REQ-005**: Compare concise plain-text excerpts of `Your offline draft` and `Current merged note`, label the merged result as recommended, and describe counts as update batches rather than authored edits.
- **REQ-006**: Make `Keep merged note` the primary action. Dismissing the review keeps the Yjs merge unchanged and announces the outcome.
- **REQ-007**: Gate `Use my offline draft` behind an inline confirmation that explains the shared replacement and safety checkpoint before running any mutation.
- **REQ-008**: Before restoring the offline draft, capture the latest merged editor snapshot and save it through the existing authenticated version-history action. Do not restore if checkpoint creation fails.
- **REQ-009**: Restore a confirmed offline draft through the existing editor command so the replacement becomes a normal Yjs update, remains locally persistent, and synchronizes to collaborators.
- **REQ-010**: Keep the editor available while review is open; the review is an inline region, not a blocking modal.
- **REQ-011**: Provide keyboard-operable controls, visible focus, text-plus-icon status, polite result announcements, and an alert only for actionable restore failures.
- **SEC-001**: Keep draft comparison data in transient in-memory React/ref state. Never persist access tokens, identity data, or a separate conflict queue.
- **SEC-002**: Require the existing authenticated Server Action and room membership checks for the safety checkpoint; the client cannot bypass version-history authorization.
- **CON-001**: Do not implement character-level authorship, a semantic diff engine, or a custom last-write-wins algorithm.
- **CON-002**: This feature reviews overlap detected in the current mounted room session. It does not infer unsynchronized intent from a stale cache after a full application restart.
- **CON-003**: A remote-only update, local-only offline edit, awareness change, or normal live collaboration update is not a conflict and must not show the review.
- **GUD-001**: Preserve the existing warm editorial BoardPrep visual system, with a compact blue/orange review card, restrained borders, and responsive stacked comparison cards.
- **PAT-001**: Store high-frequency reconciliation counters and draft capture in refs; move only a completed, user-visible review into React state.
- **PAT-002**: Use functional state updates for result handling and keep interaction-driven checkpoint/restore work in explicit event callbacks.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Define and verify deterministic reconciliation classification.

| Task     | Description                                                                                                                                            | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-001 | Create `src/lib/collaboration/conflict-review.ts` with typed draft, reconciliation-window, review-finalization, excerpt, and checkpoint-label helpers. | ✅        | 2026-07-17 |
| TASK-002 | Create `scripts/verify-conflict-review.ts` to prove local-only, remote-only, overlap, missing-draft, excerpt, and checkpoint-label behavior.           | ✅        | 2026-07-17 |
| TASK-003 | Add `verify:conflict-review` to `package.json` without adding dependencies.                                                                            | ✅        | 2026-07-17 |

### Implementation Phase 2

- GOAL-002: Detect true current-session overlap without disturbing the stable Yjs lifecycle.

| Task     | Description                                                                                                                                                                     | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Extend `RichTextEditorHandle` with a typed draft capture that returns ProseMirror JSON plus plain text without changing the version snapshot contract.                          | ✅        | 2026-07-17 |
| TASK-005 | Track local and provider-origin document batches in refs inside `CollaborativeRoom`; capture the offline draft before the first remote transaction and finalize after Yjs sync. | ✅        | 2026-07-17 |
| TASK-006 | Reset reconciliation tracking after every sync and keep awareness/presence events outside the detector.                                                                         | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Add the accessible review and safe resolution flow.

| Task     | Description                                                                                                                                                                       | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Create `ConflictReviewPanel` with side-by-side excerpts, a recommended merged action, an inline override confirmation, loading state, focus management, and result/error regions. | ✅        | 2026-07-17 |
| TASK-008 | Integrate the panel into the editor workspace and implement keep-merge plus checkpoint-before-restore callbacks in `CollaborativeRoom`.                                           | ✅        | 2026-07-17 |
| TASK-009 | Add responsive styles and visible focus states to `src/app/globals.css`, retaining the existing design tokens and editorial hierarchy.                                            | ✅        | 2026-07-17 |

### Implementation Phase 4

- GOAL-004: Verify the complete user story and close the roadmap item.

| Task     | Description                                                                                                                                                                                            | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-010 | Run formatting, lint, strict typecheck, production build, all collaboration/schema/version/profile verifiers, and the new deterministic conflict-review verifier sequentially.                         | ✅        | 2026-07-17 |
| TASK-011 | Record the product-owner acceptance of automated overlap, merge, rendering, and safety evidence after three browser-backend checks returned unavailable; retain the browser-test exception explicitly. | ✅        | 2026-07-17 |
| TASK-012 | Update architecture, security, testing, changelog, README, and roadmap documentation; mark this plan completed only after all acceptance criteria or an explicit acceptance exception is recorded.     | ✅        | 2026-07-17 |

## 3. Alternatives

- **ALT-001**: Replace the live note with whichever client reconnects last. Rejected because it discards valid CRDT changes and makes data loss the default.
- **ALT-002**: Show a modal on every reconnect. Rejected because most reconnects are conflict-free and a modal interrupts ongoing collaborative work.
- **ALT-003**: Build a semantic rich-text diff with per-character author attribution. Deferred because Yjs update origins identify transport source, not durable semantic authorship, and a trustworthy diff requires a separate product and data model.
- **ALT-004**: Restore the offline draft before saving the merged result. Rejected because a failed or regretted override would have no durable recovery point.

## 4. Dependencies

- **DEP-001**: Existing stable `Y.Doc`, `WebsocketProvider`, and `y-indexeddb` lifecycle implemented by offline editing with sync.
- **DEP-002**: Existing Tiptap editor handle and collaboration extension for JSON capture and update-emitting restore.
- **DEP-003**: Existing `createVersionAction` Server Action and version repository authorization for the safety checkpoint.
- **DEP-004**: Existing Lucide icon package and BoardPrep CSS design tokens; no new runtime dependency is required.

## 5. Files

- **FILE-001**: `src/lib/collaboration/conflict-review.ts` — reconciliation types and deterministic helpers.
- **FILE-002**: `src/components/collaboration/rich-text-editor.tsx` — local draft capture handle.
- **FILE-003**: `src/components/collaboration/conflict-review-panel.tsx` — accessible comparison and confirmation UI.
- **FILE-004**: `src/components/collaboration/collaborative-room.tsx` — update-origin tracking and resolution callbacks.
- **FILE-005**: `src/app/globals.css` — responsive review presentation and focus states.
- **FILE-006**: `scripts/verify-conflict-review.ts`, `package.json` — deterministic verification command.
- **FILE-007**: `README.md`, `.agents/ARCHITECTURE.md`, `.agents/SECURITY.md`, `.agents/TESTING.md`, `.agents/CHANGELOG.md`, `.agents/ROADMAP.md`, and this plan — implemented behavior and evidence.

## 6. Testing

- **TEST-001**: A local-only reconciliation window finalizes without a review.
- **TEST-002**: A remote-only or awareness-only event finalizes without a review.
- **TEST-003**: A window containing local and remote document updates plus a captured draft creates exactly one review with accurate batch counts.
- **TEST-004**: An overlap without a valid pre-remote draft fails closed and does not offer a destructive override.
- **TEST-005**: Draft excerpts collapse whitespace, preserve useful text, handle empty documents, and truncate accessibly.
- **TEST-006**: The merged result remains unchanged when the user chooses `Keep merged note`.
- **TEST-007**: The first override click only reveals confirmation; the confirmed action saves the current merged snapshot before restoring the offline JSON.
- **TEST-008**: Checkpoint authorization or persistence failure leaves the merged note untouched and exposes an actionable error.
- **TEST-009**: Static accessible markup, focus-management code, responsive rules, and action states pass code review; real-browser focus order, responsive appearance, and click-through remain recommended regression coverage under the recorded acceptance exception.
- **TEST-010**: Existing Yjs authorization, schema/profile, version history, offline persistence, formatting, lint, typecheck, and production build checks remain green.

## 7. Risks & Assumptions

- **RISK-001**: Yjs updates are transport batches, not semantic edits. UI copy must not imply exact edit or author counts.
- **RISK-002**: The merged note may continue changing while a review is open. The override therefore checkpoints the latest current state at confirmation time, not only the state shown in the excerpt.
- **RISK-003**: Capturing editor JSON for every keystroke would be expensive. The detector counts updates in refs and captures once, immediately before remote application.
- **RISK-004**: A local cache may contain changes from a previous browser session. The detector intentionally avoids guessing whether those were unsynchronized; current-session overlap is the trustworthy scope.
- **ASSUMPTION-001**: `WebsocketProvider` remains the Yjs transaction origin for remote sync updates in the pinned `y-websocket@2.1.0` implementation.
- **ASSUMPTION-002**: A user who made current-session local edits has a mounted editor handle available before the first remote transaction is applied.
- **ASSUMPTION-003**: The existing version checkpoint stores both rendered JSON and full Yjs state before a restore operation.

## 8. Related Specifications / Further Reading

[BoardPrep roadmap](../.agents/ROADMAP.md)
[BoardPrep collaboration architecture](../.agents/ARCHITECTURE.md)
[Offline editing with sync plan](./feature-offline-editing-sync-1.md)
[Secure version history plan](./feature-secure-version-history-1.md)
[Yjs document updates](https://docs.yjs.dev/api/document-updates)

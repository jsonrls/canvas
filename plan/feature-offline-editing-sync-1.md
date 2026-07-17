---
goal: Add local-first offline editing and authenticated reconnection sync to collaborative notes
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-17
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, collaboration, offline, yjs, indexeddb]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Add an IndexedDB persistence layer to each authenticated room's Yjs document so an already-open notes editor remains usable during a network interruption, preserves local changes across component reloads, and merges those changes through the existing authenticated WebSocket when connectivity returns.

## 1. Requirements & Constraints

- **REQ-001**: Construct one `Y.Doc` per mounted room and attach both local IndexedDB persistence and the remote WebSocket provider to that same document instance.
- **REQ-002**: Persist the notes document under the account-scoped key `boardprep:${userId}:${roomId}:notes` so two accounts using one browser never load each other's room cache.
- **REQ-003**: Load IndexedDB state before rendering the editor to prevent an empty-document flash from overwriting or obscuring locally persisted content.
- **REQ-004**: Keep the editor writable when the access-token request or WebSocket connection is unavailable after the protected room page has loaded.
- **REQ-005**: Fetch a fresh access token and reconnect automatically when the browser emits `online`; retain the existing manual retry control for recoverable token or WebSocket errors.
- **REQ-006**: Let Yjs exchange and merge updates on reconnect; do not create a second document, replace local state, or implement last-write-wins behavior.
- **REQ-007**: Surface separate local and remote states: `loading`, `saved`, or `unavailable` for local persistence and `connecting`, `synced`, `offline`, or `error` for remote collaboration.
- **REQ-008**: Disable version creation and restoration while remote collaboration is unavailable because those operations require authenticated Server Actions and cannot be represented as local Yjs updates.
- **REQ-009**: Clear all registered IndexedDB documents for the active account before completing an explicit sign-out, then destroy local and remote providers and the Yjs document.
- **REQ-010**: If IndexedDB is unavailable or quota-constrained, retain in-memory and remote editing, display a non-blocking warning, and never report that changes are saved locally.
- **SEC-001**: Store only Yjs document updates and non-sensitive cache metadata in IndexedDB; never persist access tokens, refresh tokens, service-role keys, email addresses, or authorization decisions.
- **SEC-002**: Treat IndexedDB as unencrypted same-origin browser storage and document the shared-device risk; remote access must still pass the existing token and room-role checks on every WebSocket connection.
- **SEC-003**: Validate `userId` and `roomId` before constructing a storage key, and keep the storage-key builder in one tested module.
- **CON-001**: This plan covers continued editing after a protected room has loaded and local recovery when the application route can render. Cold-start loading with no network is excluded until a service worker and cached application shell are implemented.
- **CON-002**: Do not add a custom conflict algorithm or conflict-resolution screen; Yjs performs CRDT merging, and the roadmap's separate conflict-resolution UI remains the following feature.
- **CON-003**: Do not queue version-history Server Actions, authentication actions, room membership mutations, or awareness presence in IndexedDB.
- **GUD-001**: Use explicit status copy: `Saved on this device`, `Live sync active`, `Offline — edits stay on this device`, and `Local saving unavailable`.
- **GUD-002**: Announce state transitions through existing `role="status"` regions without repeated alerts during WebSocket backoff retries.
- **PAT-001**: Encapsulate IndexedDB construction, key generation, registry maintenance, and cleanup in `src/lib/collaboration/offline-document.ts`; components consume typed lifecycle functions rather than calling IndexedDB directly.
- **PAT-002**: Construct one stable `WebsocketProvider` with `connect: false` beside the persistent `Y.Doc`; update its token parameters and connect/disconnect it across retries without rebuilding the editor or document.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Add deterministic account-scoped local persistence and prove standalone recovery behavior.

| Task     | Description                                                                                                                                                                                                                                                                                                                | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Install exact runtime dependency `y-indexeddb@9.0.12` and development dependencies `fake-indexeddb@6.2.5` and `tsx@4.23.1`; update `package.json` and `package-lock.json` without changing the pinned `yjs@13.6.31`.                                                                                                       | ✅        | 2026-07-17 |
| TASK-002 | Create `src/lib/collaboration/offline-document.ts` with `buildOfflineDocumentKey(userId, roomId)`, `createOfflineDocument(userId, roomId, document)`, `registerOfflineDocument(userId, key)`, and `clearOfflineDocumentsForUser(userId)`. Reject identifiers outside the existing UUID user pattern and room-slug pattern. | ✅        | 2026-07-17 |
| TASK-003 | In the offline adapter, wrap `IndexeddbPersistence`, expose its `whenSynced`, `destroy`, and `clearData` lifecycle, maintain an account-scoped list of document keys without identity or token data, and convert IndexedDB/quota failures into typed recoverable results.                                                  | ✅        | 2026-07-17 |
| TASK-004 | Add `scripts/verify-offline-sync.ts` using `fake-indexeddb/auto` to prove same-key recovery after document/provider destruction, cross-account and cross-room isolation, cleanup deletion, and graceful fallback when IndexedDB initialization fails.                                                                      | ✅        | 2026-07-17 |

### Implementation Phase 2

- GOAL-002: Refactor the room connection lifecycle so local editing does not depend on network availability.

| Task     | Description                                                                                                                                                                                                                                                        | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-005 | Refactor `CollaborativeRoom` in `src/components/collaboration/collaborative-room.tsx` to create `Y.Doc`, attach IndexedDB, await local sync, and render the editor before requesting `/api/auth/access-token`; retain one document through all reconnect attempts. | ✅        | 2026-07-17 |
| TASK-006 | Construct one disconnected `WebsocketProvider` beside the document, register status/sync/awareness listeners once, update its fresh-token parameters during retry, and never destroy the document or local provider during remote reconnect.                       | ✅        | 2026-07-17 |
| TASK-007 | Register `online` and `offline` window listeners. On `online`, request a new token and reconnect; on `offline`, disconnect the remote provider, keep the editor mounted, retain local persistence, and clear remote presence without discarding edits.             | ✅        | 2026-07-17 |
| TASK-008 | Retain the editor's required provider contract by passing the stable disconnected/reconnected provider, and verify that remote attachment does not replace the document, rebuild the editor, or duplicate content.                                                 | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Make offline behavior understandable and protect account boundaries during user actions.

| Task     | Description                                                                                                                                                                                                                                                                  | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-009 | Replace the single connection badge in `collaborative-room.tsx` with derived local/remote status copy and update `src/app/globals.css` for loading, saved, offline, error, and unavailable states using existing color tokens and responsive rules.                          | ✅        | 2026-07-17 |
| TASK-010 | Pass `remoteActionsAvailable` from `CollaborativeRoom` to `src/components/collaboration/version-history-panel.tsx`; disable save/restore buttons while offline and render a concise explanation that notes continue saving locally but checkpoints require reconnection.     | ✅        | 2026-07-17 |
| TASK-011 | Create `src/components/auth/sign-out-button.tsx` to await `clearOfflineDocumentsForUser(currentUser.id)` before invoking the existing `signOut` Server Action; replace the inline sign-out form in `collaborative-room.tsx` and prevent duplicate submissions.               | ✅        | 2026-07-17 |
| TASK-012 | Update `README.md`, `.agents/ARCHITECTURE.md`, `.agents/SECURITY.md`, `.agents/TESTING.md`, `.agents/CHANGELOG.md`, and `.agents/ROADMAP.md` with the implemented outage scope, same-origin storage risk, cleanup behavior, verification command, and cold-start limitation. | ✅        | 2026-07-17 |

### Implementation Phase 4

- GOAL-004: Verify local recovery, remote merge, regressions, and roadmap completion.

| Task     | Description                                                                                                                                                                                                                                                                                              | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-013 | Extend `scripts/verify-offline-sync.ts` to start the existing authenticated Yjs server, synchronize a temporary owner document, disconnect it, apply an offline edit, reconnect the same local document, and assert that a second authorized document receives the merged offline update.                | ✅        | 2026-07-17 |
| TASK-014 | Add `verify:offline-sync` to `package.json` and run `npm run format:check`, `npm run lint`, `npm run build`, `npm run typecheck`, `npm run verify:yjs`, `npm run verify:schema`, `npm run verify:version-history`, and `npm run verify:offline-sync` sequentially where build artifacts overlap.         | ✅        | 2026-07-17 |
| TASK-015 | Manually verify browser DevTools offline mode: the loaded editor remains writable, refresh-independent local recovery works when the route can render, status copy is accurate, version actions are disabled, reconnect merges changes, and explicit sign-out removes account-scoped document databases. | ✅        | 2026-07-17 |
| TASK-016 | Mark the roadmap item complete only after every automated and manual criterion passes; change this plan to `Completed`, fill task dates, append the session footer, and leave `Conflict resolution UI` as the next unchecked roadmap item.                                                               | ✅        | 2026-07-17 |

## 3. Alternatives

- **ALT-001**: Persist ProseMirror JSON directly in `localStorage`. Rejected because it duplicates source-of-truth state, has small synchronous storage limits, and cannot merge concurrent updates as Yjs updates.
- **ALT-002**: Build an application-specific offline operation queue. Rejected because text operations already have CRDT semantics and a second queue would introduce ordering, deduplication, and replay failure modes.
- **ALT-003**: Cache access tokens for offline reconnect. Rejected because tokens are sensitive, expire, and must be revalidated by the server when network access returns.
- **ALT-004**: Add a service worker and full PWA shell in the same change. Deferred because cold offline startup changes routing, asset caching, auth expiry, update rollout, and cache invalidation; it should follow the proven document-persistence layer.
- **ALT-005**: Clear only the currently open room on sign-out. Rejected because previously opened room databases for the same account would remain on a shared browser.

## 4. Dependencies

- **DEP-001**: `y-indexeddb@9.0.12`, whose declared peer range `yjs@^13.0.0` includes the repository's pinned `yjs@13.6.31`.
- **DEP-002**: `fake-indexeddb@6.2.5` for Node-based IndexedDB lifecycle and isolation verification.
- **DEP-003**: Existing `y-websocket@2.1.0`, authenticated `/api/auth/access-token`, `server/yjs-server.mjs`, and Supabase room-role authorization.
- **DEP-004**: Browser IndexedDB, online/offline events, and storage quota behavior in supported desktop and mobile browsers.
- **DEP-005**: `tsx@4.23.1` so Node 20 can execute the shared strict TypeScript adapter in the deterministic verifier.

## 5. Files

- **FILE-001**: `package.json`, `package-lock.json` — exact persistence/test dependencies and `verify:offline-sync` command.
- **FILE-002**: `src/lib/collaboration/offline-document.ts` — key validation, IndexedDB provider lifecycle, account registry, cleanup, and error mapping.
- **FILE-003**: `src/components/collaboration/collaborative-room.tsx` — one-document local-first lifecycle, remote reconnect state machine, presence, and status UI.
- **FILE-004**: `src/components/collaboration/rich-text-editor.tsx` — unchanged editor contract consuming the stable provider and shared document.
- **FILE-005**: `src/components/collaboration/version-history-panel.tsx` — remote-action availability and offline explanation.
- **FILE-006**: `src/components/auth/sign-out-button.tsx` — account-scoped offline cache cleanup before sign-out.
- **FILE-007**: `src/app/globals.css` — accessible local and remote status presentation.
- **FILE-008**: `scripts/verify-offline-sync.ts` — deterministic local recovery, isolation, cleanup, and authenticated reconnect-merge verification.
- **FILE-009**: `README.md`, `.agents/ARCHITECTURE.md`, `.agents/SECURITY.md`, `.agents/TESTING.md`, `.agents/CHANGELOG.md`, `.agents/ROADMAP.md`, and this plan — scope, behavior, risks, checks, and completion state.

## 6. Testing

- **TEST-001**: A Yjs update written with one IndexedDB provider is present after destroying it and constructing a new document/provider with the same account-room key.
- **TEST-002**: Different user IDs or room IDs never load another namespace's document state.
- **TEST-003**: Clearing all registered documents for one user removes their cached updates without deleting another user's databases.
- **TEST-004**: IndexedDB initialization or quota failure leaves the editor usable in memory and prevents saved-local status copy.
- **TEST-005**: After a remote disconnect, offline edits persist locally and merge into the authenticated room when a new WebSocket provider reconnects.
- **TEST-006**: A second authorized client receives the reconnected offline edit; existing non-member/viewer WebSocket denials still pass.
- **TEST-007**: Version save and restore controls are unavailable while offline and return when the provider completes synchronization.
- **TEST-008**: Explicit sign-out clears all account-scoped offline document databases and cannot submit twice.
- **TEST-009**: Formatting, lint, production build, strict TypeScript, Yjs, schema, profile/version, and offline-sync verification commands all pass.

## 7. Risks & Assumptions

- **RISK-001**: IndexedDB is not encrypted by the application; a person with the same operating-system/browser profile or injected same-origin script may access cached notes.
- **RISK-002**: Browser quota eviction can remove cached updates. The UI must distinguish local persistence availability and cannot promise durable offline storage beyond browser guarantees.
- **RISK-003**: Recreating the Tiptap editor during reconnect could cause focus, selection, or content duplication; the implementation keeps the document, editor, and disconnected provider stable and mutates transport lifecycle only.
- **RISK-004**: WebSocket `sync` confirms Yjs protocol exchange but does not prove the server's debounced database write has completed. UI copy must say `Live sync active`, not claim durable server persistence.
- **RISK-005**: Account-wide cleanup must tolerate a partially corrupt IndexedDB database and continue attempting every registered key before sign-out.
- **ASSUMPTION-001**: Offline editing begins after the authenticated room route has rendered; expired server sessions are handled when remote reconnection requests a fresh token.
- **ASSUMPTION-002**: `y-indexeddb@9.0.12` remains compatible with the pinned Yjs 13 document model as declared by its peer dependency.
- **ASSUMPTION-003**: Awareness and live cursors are intentionally absent offline and are reconstructed from active peers after remote reconnection.

## 8. Related Specifications / Further Reading

[BoardPrep roadmap](../.agents/ROADMAP.md)
[BoardPrep collaboration architecture](../.agents/ARCHITECTURE.md)
[Secure version history plan](./feature-secure-version-history-1.md)
[Yjs IndexedDB provider](https://docs.yjs.dev/ecosystem/database-provider/y-indexeddb)
[Yjs offline support](https://docs.yjs.dev/getting-started/allowing-offline-editing)
[Yjs WebSocket provider](https://docs.yjs.dev/ecosystem/connection-provider/y-websocket)

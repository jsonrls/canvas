---
goal: Deliver authenticated, durable collaborative documents with restorable version history
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-17
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, version-history, supabase, auth, yjs, roadmap-phase-2]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-green)

Implement the next unchecked Phase 2 roadmap capability as one secure vertical slice: authenticate room participants, persist collaborative Yjs documents in Supabase, capture immutable rich-text snapshots, list version metadata, and restore a selected snapshot into the live shared document.

## 1. Requirements & Constraints

- **REQ-001**: Require a validated Supabase Auth identity before rendering `/rooms/[roomId]` or accessing version-history data.
- **REQ-002**: Provide email/password sign-in and sign-up through Next.js Server Actions and cookie-based Supabase SSR sessions.
- **REQ-003**: Create `rooms`, `room_members`, `documents`, and `document_versions` tables with immutable version rows and one notes document per room.
- **REQ-004**: Persist complete Yjs document updates from the WebSocket server and reload them when the server restarts.
- **REQ-005**: Authorize every WebSocket connection with a validated Supabase access token and an active room-membership row.
- **REQ-006**: Allow authenticated members to create named snapshots, list history, and restore snapshot content into the live collaborative editor.
- **REQ-007**: Store both ProseMirror JSON content for deterministic restoration and the corresponding Yjs state update for recovery/audit fidelity.
- **SEC-001**: Enable RLS on every table in the exposed `public` schema and grant only the exact Data API privileges required by authenticated clients.
- **SEC-002**: Keep the Supabase service-role key server-only and prevent it from entering browser bundles, public environment variables, rendered props, logs, or WebSocket URLs.
- **SEC-003**: Make authorization predicates depend on `auth.uid()` and database membership, never user-editable metadata.
- **SEC-004**: Put any RLS helper that requires `SECURITY DEFINER` in a non-exposed `private` schema, revoke public execution, validate `auth.uid()` internally, and set an empty search path.
- **SEC-005**: Return authentication and version-history responses with private/no-store cache semantics.
- **CON-001**: Do not implement offline IndexedDB sync or the conflict-resolution interface in this slice.
- **CON-002**: Keep the WebSocket service as a separate long-running Node process; do not embed it in a Next.js Route Handler.
- **CON-003**: Target database changes only at the project referenced by the existing `.env`; never substitute another connected Supabase project.
- **GUD-001**: Preserve the existing BoardPrep visual system and make history controls usable on mobile and with a keyboard.
- **PAT-001**: Use Server Components for protected initial reads, Server Actions for UI mutations, and a Route Handler only for issuing the validated short-lived WebSocket access token.
- **PAT-002**: Construct request-specific Supabase clients inside server functions and never store authenticated clients in module scope.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish the audited dependency, authentication, and database foundation.

| Task     | Description                                                                                                                                                                                                      | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create this implementation plan, initialize the structured session log, and record tooling errors already encountered during discovery.                                                                          | ✅        | 2026-07-17 |
| TASK-002 | Install exact versions of `@supabase/supabase-js`, `@supabase/ssr`, and the project-scoped Supabase CLI; update package scripts and lockfile.                                                                    | ✅        | 2026-07-17 |
| TASK-003 | Add `src/lib/supabase/server.ts`, `src/lib/supabase/proxy.ts`, and `src/proxy.ts` using async Next.js cookies and validated claims.                                                                              | ✅        | 2026-07-17 |
| TASK-004 | Add `/login`, sign-in/sign-up/sign-out Server Actions, and auth callback handling with accessible status feedback.                                                                                               | ✅        | 2026-07-17 |
| TASK-005 | Generate Supabase migrations through `supabase migration new`, implement tables, constraints, indexes, grants, private authorization helpers, role-aware RLS policies, and apply them to the configured project. | ✅        | 2026-07-17 |

### Implementation Phase 2

- GOAL-002: Persist and authorize the real-time collaboration service.

| Task     | Description                                                                                                                                                           | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-006 | Replace the package WebSocket binary with `server/yjs-server.mjs`, validate Supabase tokens and room membership during upgrades, and reject unauthorized connections. | ✅        | 2026-07-17 |
| TASK-007 | Load and debounce-persist full Yjs document updates through the Supabase service client while retaining Yjs 13 protocol compatibility.                                | ✅        | 2026-07-17 |
| TASK-008 | Update the browser connection lifecycle to fetch a no-store access token, pass it to the provider, and surface authorization/persistence errors.                      | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Deliver member-facing snapshot creation, history listing, and live restoration.

| Task     | Description                                                                                                                                                           | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-009 | Create typed version-history repository functions and Server Actions that enforce membership through the authenticated RLS client.                                    | ✅        | 2026-07-17 |
| TASK-010 | Add a responsive history panel with snapshot naming, author/time metadata, refresh, empty/error states, and confirmation before restore.                              | ✅        | 2026-07-17 |
| TASK-011 | Capture editor JSON and Yjs state, insert immutable versions, and restore selected JSON through Tiptap so the restoration becomes a new collaborative CRDT operation. | ✅        | 2026-07-17 |

### Implementation Phase 4

- GOAL-004: Verify security, durability, restoration, and documentation before advancing the roadmap.

| Task     | Description                                                                                                                                                       | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-012 | Add automated schema-policy inspection and authenticated Yjs restart-persistence/version-history integration verification with temporary test data cleanup.       | ✅        | 2026-07-17 |
| TASK-013 | Run formatting, ESLint, sequential production build/typecheck, dependency audit, database advisors or equivalent policy inspection, and application smoke checks. | ✅        | 2026-07-17 |
| TASK-014 | Mark Version history complete only after verification; update README, API documentation, changelog, plan status, knowledge records, and session footer.           | ✅        | 2026-07-17 |

## 3. Alternatives

- **ALT-001**: Store only rendered HTML snapshots. Rejected because HTML is harder to validate and cannot restore the editor schema as deterministically as ProseMirror JSON.
- **ALT-002**: Apply old Yjs updates directly to restore prior state. Rejected because Yjs updates are monotonic and applying an older state update does not remove subsequent edits.
- **ALT-003**: Persist only to local LevelDB. Rejected because it is single-host storage and does not satisfy the roadmap's Supabase-backed durability or deployed recovery needs.
- **ALT-004**: Use the service-role key for browser data access. Rejected because it bypasses RLS and would be a critical authorization vulnerability.

## 4. Dependencies

- **DEP-001**: `@supabase/supabase-js@2.110.7` for server, admin, and authenticated Data API access.
- **DEP-002**: `@supabase/ssr@0.12.3` for cookie-based Next.js SSR sessions.
- **DEP-003**: `supabase@2.109.1` as a pinned project CLI for deterministic migration generation and inspection.
- **DEP-004**: Existing `yjs@13.6.31`, `y-websocket@2.1.0`, and `ws@8.21.1` for compatible collaboration transport.
- **DEP-005**: The configured Supabase project, database password, and server-only service-role key.

## 5. Files

- **FILE-001**: `package.json`, `package-lock.json`, `.env.example` — dependencies, scripts, and environment contract.
- **FILE-002**: `src/proxy.ts`, `src/lib/supabase/*`, `src/app/login/*`, `src/app/auth/confirm/route.ts` — authentication and cookie refresh.
- **FILE-003**: `supabase/migrations/*_secure_version_history.sql`, `*_enforce_read_only_viewers.sql` — schema, authorization helpers, grants, indexes, and role-aware RLS.
- **FILE-004**: `server/yjs-server.mjs` — authenticated Supabase-backed WebSocket persistence.
- **FILE-005**: `src/lib/version-history/*`, `src/app/rooms/[roomId]/actions.ts` — protected data access and mutations.
- **FILE-006**: `src/components/collaboration/collaborative-room.tsx`, `rich-text-editor.tsx`, `version-history-panel.tsx`, `src/app/globals.css` — tokenized collaboration and history UI.
- **FILE-007**: `scripts/verify-version-history.mjs`, `scripts/verify-schema.mjs` — authenticated persistence, restore-data, and policy verification.
- **FILE-008**: `.agents/ROADMAP.md`, `.agents/API.md`, `.agents/CHANGELOG.md`, `README.md`, this plan, change logs, and mistake knowledge files — verified documentation and audit trail.

## 6. Testing

- **TEST-001**: Unauthenticated room requests redirect to `/login`; invalid credentials return a safe inline error.
- **TEST-002**: RLS denies non-members, gives viewers read-only access, and permits owners/editors to write documents and immutable versions.
- **TEST-003**: A tokenless, non-member, or viewer editing WebSocket upgrade is rejected; a valid owner/editor token connects.
- **TEST-004**: An edit sent by one Yjs client reaches a second client, survives server restart, and loads into a third client.
- **TEST-005**: Snapshot creation stores JSON and Yjs state with the authenticated author, and history is returned newest first.
- **TEST-006**: Restoring a prior JSON snapshot replaces current editor content and synchronizes the restored state to another client.
- **TEST-007**: `npm run format:check`, `npm run lint`, `npm run build`, and the subsequent `npm run typecheck` all pass.
- **TEST-008**: Database inspection confirms RLS, grants, indexes, policy roles, immutable version permissions, and private helper placement.

## 7. Risks & Assumptions

- **RISK-001**: The configured legacy anon key currently fails the Data API while the service-role key succeeds. The server implementation must never compensate by exposing the service key; public-key remediation remains explicit if browser Supabase access is later added.
- **RISK-002**: The configured project is not visible to the connected Supabase management account. Migration deployment therefore uses the configured project's verified IPv4 session pooler and must validate the target project reference before execution.
- **RISK-003**: Full-state Yjs persistence rewrites the document blob; large documents will eventually need incremental-update compaction and size monitoring.
- **RISK-004**: WebSocket URL token parameters can appear in infrastructure logs. The server must avoid logging request URLs and production deployment should move authentication to a short-lived ticket or secure gateway.
- **RISK-005**: `npm audit` reports GHSA-qx2v-qp2m-jg93 through Next.js 16.2.10's pinned PostCSS 8.4.31. The root PostCSS is patched; the suggested forced fix is an unsafe downgrade to Next.js 9, so this upstream risk remains documented and user-controlled CSS stringification is out of scope.
- **ASSUMPTION-001**: The successfully verified Tokyo session pooler is the correct IPv4 path for the project referenced by `.env`.
- **ASSUMPTION-002**: Email/password authentication is enabled in the configured Supabase Auth project.
- **ASSUMPTION-003**: Version rows are immutable in this slice; deletion and retention policies are future administrative work.

## 8. Related Specifications / Further Reading

[BoardPrep roadmap](../.agents/ROADMAP.md)
[BoardPrep architecture](../.agents/ARCHITECTURE.md)
[Supabase SSR clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
[Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
[Supabase database migrations](https://supabase.com/docs/guides/deployment/managing-environments)
[Yjs WebSocket provider](https://github.com/yjs/y-websocket)

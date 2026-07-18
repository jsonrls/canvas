---
goal: Complete Phase 3 with secure collaborative PDF annotation and a basic whiteboard
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-18
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, roadmap-phase-3, pdf, whiteboard, yjs, supabase, storage]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Finish the two remaining Phase 3 study tools as production-shaped room workspaces: a private shared PDF with real-time annotations and a focused SVG/Yjs whiteboard. Preserve BoardPrep's existing room membership, owner/editor/viewer authorization, Yjs durability, offline isolation, visual language, and verification standards.

## 1. Requirements & Constraints

- **REQ-001**: Add Notes, PDF, and Whiteboard workspace navigation inside `/rooms/[roomId]` without replacing the existing notes or version-history experience.
- **REQ-002**: Allow room owners and editors to upload or replace one active PDF per room, limited to `application/pdf` and 15 MiB; viewers may read but may not upload or mutate annotations.
- **REQ-003**: Render the private PDF with page navigation and zoom, and synchronize normalized highlight, underline, freehand drawing, sticky note, page comment, reply, and bookmark data through Yjs.
- **REQ-004**: Add a basic SVG whiteboard supporting freehand drawing, shapes, arrows, text, image insertion, laser pointer, and multi-user editing.
- **REQ-005**: Persist PDF annotations and whiteboard scenes independently from notes in `public.documents`, including local IndexedDB recovery for owners and editors.
- **REQ-006**: Show participant awareness and explicit connecting, live, offline, read-only, and unavailable states in both collaborative study tools.
- **SEC-001**: Keep the PDF bucket private and authorize reads, inserts, and replacements through room-membership RLS; never expose the service-role credential.
- **SEC-002**: Authenticate upload Route Handlers and WebSocket upgrades from validated Supabase claims/tokens, then enforce owner/editor write access and member read access.
- **SEC-003**: Validate PDF MIME type, byte size, magic header, room slug, storage path, and every annotation payload boundary before persistence or rendering.
- **SEC-004**: Keep viewer workspaces free of writable WebSocket and IndexedDB paths, using only RLS-authorized durable snapshots and signed PDF URLs.
- **CON-001**: Provision one active PDF and one whiteboard per room; multi-file libraries, OCR, semantic PDF text selection, and advanced whiteboard templates remain outside Phase 3.
- **CON-002**: Preserve exact dependency pinning, use stable React 19-compatible `react-pdf`, and ship no whiteboard dependency with unresolved high-severity production advisories.
- **GUD-001**: Match the existing warm editorial study-room surface, use Lucide icons, keep controls at least 44 pixels, expose visible focus, and support 375-pixel layouts and reduced motion.
- **PAT-001**: Lazy-load React PDF and the SVG whiteboard client bundles only when their workspace is selected; keep server props minimal and start independent server reads in parallel.
- **PAT-002**: Store Yjs maps by stable object identifiers so concurrent annotations and whiteboard elements merge independently instead of replacing an entire scene.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish versioned dependencies, schema, storage, and document-channel contracts.

| Task     | Description                                                                                                                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Audit `.agents/ROADMAP.md`, PRD/design/security guidance, current room/Yjs/Supabase code, relevant skills and mistakes, and current official Supabase, React PDF, Excalidraw, and Next.js documentation.       | ✅        | 2026-07-17 |
| TASK-002 | Create this plan and initialize the structured Phase 3 completion change log before implementation.                                                                                                            | ✅        | 2026-07-17 |
| TASK-003 | Install exact stable React 19-compatible `react-pdf`, reject the vulnerable Excalidraw production tree, and retain the security-reviewed lockfile.                                                             | ✅        | 2026-07-17 |
| TASK-004 | Create and apply a Supabase migration that adds `pdf` and `whiteboard` document kinds, PDF metadata constraints, room document backfill/provisioning, private storage helpers, and least-privilege object RLS. | ✅        | 2026-07-17 |
| TASK-005 | Configure the reproducible private PDF bucket and extend schema verification for tables, document kinds, metadata constraints, grants, helpers, policies, and bucket restrictions.                             | ✅        | 2026-07-17 |
| TASK-006 | Generalize offline document keys and the Yjs server document-name parser so `notes`, `pdf`, and `whiteboard` use isolated durable channels with existing membership/role enforcement.                          | ✅        | 2026-07-18 |

### Implementation Phase 2

- GOAL-002: Deliver private collaborative PDF upload, reading, and annotation.

| Task     | Description                                                                                                                                                                                                 | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Extend the room repository and protected Server Component to return viewer-safe document snapshots plus private signed PDF metadata without serializing credentials.                                        | ✅        | 2026-07-17 |
| TASK-008 | Add two-phase `POST`/`PUT /api/rooms/[roomId]/pdf` handling with claims, editor authorization, direct signed upload, stored PDF verification, versioned compare-and-swap replacement, and safe JSON errors. | ✅        | 2026-07-17 |
| TASK-009 | Add reusable collaborative-tool connection logic with isolated Yjs maps, awareness, offline persistence, reconnection, read-only snapshots, and explicit status feedback.                                   | ✅        | 2026-07-17 |
| TASK-010 | Build the lazy-loaded PDF workspace with accessible upload/replace feedback, page navigation, zoom, responsive rendering, and empty/loading/error states.                                                   | ✅        | 2026-07-17 |
| TASK-011 | Implement normalized highlight, underline, freehand, sticky-note/page-comment, reply, and bookmark models and UI; filter annotations by PDF revision and synchronize each item independently through Yjs.   | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Deliver the collaborative whiteboard and unified study desk.

| Task     | Description                                                                                                                                                                                                 | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-012 | Build a dynamically imported SVG whiteboard with non-zero responsive dimensions, stable scene hydration, per-element Yjs merging, viewer mode, and loop-free remote scene updates.                          | ✅        | 2026-07-17 |
| TASK-013 | Synchronize pointer/user awareness and expose drawing, shapes, arrows, text, image insertion, and laser-pointer tools while keeping viewer controls read-only.                                              | ✅        | 2026-07-17 |
| TASK-014 | Add Notes/PDF/Whiteboard tab navigation to `CollaborativeRoom`, preserve the notes connection and version panel, and apply polished responsive/focus/reduced-motion styles using existing BoardPrep tokens. | ✅        | 2026-07-17 |

### Implementation Phase 4

- GOAL-004: Prove authorization, real-time behavior, resilience, and complete the Phase 3 roadmap.

| Task     | Description                                                                                                                                                                                                                       | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-015 | Add focused pure/static verification for PDF validation, annotation normalization, workspace accessibility, dynamic loading, offline key isolation, and Yjs document-name parsing.                                                | ✅        | 2026-07-18 |
| TASK-016 | Extend authenticated integration verification to prove private bucket restrictions, editor upload/replace, viewer write denial, signed member reads, independent multi-client PDF/whiteboard CRDT sync, persistence, and cleanup. | ✅        | 2026-07-18 |
| TASK-017 | Run formatting, ESLint, strict TypeScript, production build, schema/room/version/offline/conflict/password regressions, browser desktop/mobile acceptance, and application-origin console review.                                 | ✅        | 2026-07-18 |
| TASK-018 | Update README, architecture, API, database, security, testing, changelog, and roadmap documentation; mark Phase 3 and this plan complete only after every required gate passes, then close the structured session log.            | ✅        | 2026-07-18 |

## 3. Alternatives

- **ALT-001**: Store PDF bytes in Postgres. Rejected because large immutable files would bloat database backups and bypass Supabase Storage delivery controls.
- **ALT-002**: Use a public Storage bucket. Rejected because private room documents must not become bearer-accessible public URLs.
- **ALT-003**: Store one serialized annotation or Excalidraw scene blob. Rejected because concurrent edits would overwrite unrelated objects instead of merging through CRDT keys.
- **ALT-004**: Load PDF.js and Excalidraw in the initial room bundle. Rejected because both are large client dependencies and the notes workspace must remain fast.
- **ALT-005**: Add a separate WebSocket service for each tool. Rejected because the existing authenticated durable Yjs service can safely route isolated document kinds.
- **ALT-006**: Embed `@excalidraw/excalidraw@0.18.1`. Rejected after the production audit exposed a high-severity `lodash-es` advisory, vulnerable nested generators, and React 19 peer overrides in its transitive UI tree; a focused SVG tool meets the basic roadmap scope with a smaller trusted surface.

## 4. Dependencies

- **DEP-001**: Existing `next@16.2.10`, `react@19.2.7`, Yjs 13, authenticated `y-websocket@2.1.0`, and account-scoped IndexedDB adapter.
- **DEP-002**: Existing Supabase Auth cookie flow, room membership RLS, private authorization helpers, Storage service, and remote pooler verification environment.
- **DEP-003**: Exact stable `react-pdf@10.4.1` with its colocated PDF.js worker configuration.
- **DEP-004**: Existing React, Yjs, and Lucide packages for a dependency-free client-only SVG whiteboard.

## 5. Files

- **FILE-001**: `supabase/migrations/*_complete_phase_3_study_tools.sql` and `supabase/config.toml` — document kinds, PDF metadata, bucket, helpers, and Storage RLS.
- **FILE-002**: `server/yjs-server.mjs` and `src/lib/collaboration/offline-document.ts` — isolated durable document channels.
- **FILE-003**: `src/hooks/use-collaborative-tool.ts`, `src/lib/pdf-annotations/*`, and `src/components/collaboration/pdf-study-tool.tsx` — collaborative PDF domain and UI.
- **FILE-004**: `src/lib/whiteboard/model.ts` and `src/components/collaboration/whiteboard-study-tool.tsx` — lazy SVG/Yjs integration.
- **FILE-005**: `src/app/api/rooms/[roomId]/pdf/route.ts`, `src/lib/rooms/repository.ts`, and `src/app/rooms/[roomId]/page.tsx` — authenticated upload and room payload.
- **FILE-006**: `src/components/collaboration/collaborative-room.tsx` and `src/app/globals.css` — unified room navigation and responsive visual system.
- **FILE-007**: `scripts/verify-phase-3.ts`, integration verifiers, `package.json`, and project documentation — closure evidence.

## 6. Testing

- **TEST-001**: Reject missing, non-PDF, oversized, malformed-header, unauthenticated, viewer, non-member, and invalid-room upload requests.
- **TEST-002**: Prove PDF Storage objects are private, members can receive a signed read, editors can insert/update, and viewers cannot mutate.
- **TEST-003**: Prove normalized annotation geometry and freehand paths remain bounded, invalid payloads are ignored, replies reference valid notes, and PDF revisions isolate stale annotations.
- **TEST-004**: Prove two editors merge independent PDF annotations and whiteboard elements, awareness is non-persistent, reconnects restore durable state, and viewers cannot open writable channels.
- **TEST-005**: Prove notes, PDF, and whiteboard IndexedDB keys and remote document names are account/room/kind isolated and explicit sign-out clears all registered kinds.
- **TEST-006**: Browser-test Notes/PDF/Whiteboard navigation, upload feedback without duplicate submission, annotation tools, whiteboard rendering, viewer/read-only messaging, focus order, 375-pixel layout, and clean application console.

## 7. Risks & Assumptions

- **RISK-001**: PDF.js is a substantial bundle and the interactive whiteboard is not needed for notes startup; client-only dynamic imports and route-level activation are required.
- **RISK-002**: Signed PDF URLs expire; each protected room render issues a fresh short-lived URL and refresh is the recovery path.
- **RISK-003**: Pointer-move callbacks are high frequency; shared updates must be bounded, awareness must remain transient, and React state writes must be throttled to visible scene changes.
- **RISK-004**: Hosted Storage bucket state is not part of Postgres migrations; `supabase/config.toml` declares local state and the authenticated upload route idempotently provisions the private hosted bucket through a server-only admin client.
- **ASSUMPTION-001**: One active room PDF and one basic whiteboard satisfy the Phase 3 roadmap; document libraries and advanced whiteboard templates remain later roadmap work.
- **ASSUMPTION-002**: The existing development Supabase project and Yjs service remain available for disposable authorization and persistence verification.

## 8. Related Specifications / Further Reading

Completion evidence: hosted schema and Storage authorization passed; disposable authenticated clients merged and durably persisted independent Notes/PDF/Whiteboard Yjs maps; formatting, full ESLint, strict TypeScript, production build, and every existing regression verifier passed; desktop plus `375 × 812` browser acceptance exercised private PDF upload/render, comments, replies, bookmarks, zoom, whiteboard shapes/text/raster images, responsive tool navigation, and a clean console.

- [BoardPrep roadmap](../.agents/ROADMAP.md)
- [BoardPrep PRD](../.agents/PRD.md)
- [BoardPrep design system](../.agents/DESIGN.md)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Supabase Storage buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [React PDF integration](https://github.com/wojtekmaj/react-pdf)
- [Excalidraw integration](https://docs.excalidraw.com/)

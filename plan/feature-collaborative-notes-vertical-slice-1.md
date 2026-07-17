---
goal: Deliver a working collaborative rich-text notes room as the first executable BoardPrep vertical slice
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-17
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, collaboration, nextjs, yjs, tiptap, roadmap-phase-2]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Implement one production-shaped `/rooms/[roomId]` collaborative notes experience that proves the Next.js frontend, Tiptap rich-text editing, Yjs document synchronization, and the existing WebSocket server work together before expanding into later roadmap features.

## 1. Requirements & Constraints

- **REQ-001**: Implement the next unchecked Phase 2 roadmap capability, rich-text formatting, inside a functioning collaborative notes room.
- **REQ-002**: Expose the room experience at `src/app/rooms/[roomId]/page.tsx` and provide a default demo-room entry point from `src/app/page.tsx`.
- **REQ-003**: Read the Yjs server base URL exclusively from `NEXT_PUBLIC_YJS_WS_URL` with `ws://localhost:1234` as the development fallback.
- **REQ-004**: Synchronize one Tiptap document across browser clients through `Y.Doc`, `WebsocketProvider`, and Tiptap Collaboration.
- **REQ-005**: Provide bold, italic, strike, heading, list, quote, code, undo, and redo controls with accessible labels and visible active states.
- **REQ-006**: Show connecting, connected, disconnected, and error states without blocking local editor interaction.
- **REQ-007**: Provide responsive room navigation, editor workspace, study outline, and participant surfaces that remain usable below 768px.
- **SEC-001**: Do not place secrets or raw database credentials in browser code or public environment variables.
- **SEC-002**: Treat the demo room as unauthenticated development infrastructure; do not claim production authorization or persistence.
- **CON-001**: Do not add database persistence, Supabase authentication, version history, or offline IndexedDB persistence in this vertical slice.
- **CON-002**: Keep the Yjs WebSocket service as a separate process and do not embed it in a Next.js Route Handler.
- **GUD-001**: Follow `.agents/DESIGN.md` with a warm editorial canvas, BoardPrep blue/yellow/red brand accents, restrained shadows, serif display typography, and generous spacing.
- **GUD-002**: Follow `.agents/STYLEGUIDE.md` TypeScript, accessibility, error handling, and component-organization requirements.
- **PAT-001**: Keep App Router pages as Server Components and isolate WebSocket, Yjs, and editor browser APIs in leaf Client Components.
- **PAT-002**: Initialize collaboration resources lazily, clean up providers and documents on unmount, and avoid module-scope browser clients.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish a secure, buildable Next.js foundation without discarding the existing Yjs server package.

| Task     | Description                                                                                                                                                                        | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create this implementation plan and initialize the session change log.                                                                                                             | ✅        | 2026-07-17 |
| TASK-002 | Replace the minimal package manifest with pinned Next.js, React, TypeScript, Tailwind, Tiptap, Yjs, lint, and verification dependencies with a Yjs 13-compatible WebSocket server. | ✅        | 2026-07-17 |
| TASK-003 | Create `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`, and `.gitignore`.                                                            | ✅        | 2026-07-17 |
| TASK-004 | Create the App Router root layout, global design tokens, and default entry page.                                                                                                   | ✅        | 2026-07-17 |

### Implementation Phase 2

- GOAL-002: Deliver the collaborative rich-text room as a coherent responsive product surface.

| Task     | Description                                                                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-005 | Create `src/app/rooms/[roomId]/page.tsx` with validated display metadata and a Client Component collaboration boundary.                                        | ✅        | 2026-07-17 |
| TASK-006 | Create `src/components/collaboration/collaborative-room.tsx` to manage Yjs documents, WebSocket providers, awareness identity, cleanup, and connection status. | ✅        | 2026-07-17 |
| TASK-007 | Create `src/components/collaboration/rich-text-editor.tsx` with Tiptap Collaboration, CollaborationCaret, Placeholder, and accessible formatting controls.     | ✅        | 2026-07-17 |
| TASK-008 | Implement the room header, study navigation, participant stack, study outline, responsive behavior, loading state, and error state.                            | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Prove the vertical slice works and align the project documentation with executable reality.

| Task     | Description                                                                                                       | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-009 | Add a Node-based two-client Yjs synchronization verification script against the local WebSocket server.           | ✅        | 2026-07-17 |
| TASK-010 | Run ESLint, TypeScript validation, production build, and Yjs synchronization verification; resolve every failure. | ✅        | 2026-07-17 |
| TASK-011 | Update `.agents/ROADMAP.md` completion states only for behavior verified by this implementation.                  | ✅        | 2026-07-17 |
| TASK-012 | Update `.agents/CHANGELOG.md`, complete this plan, and finalize `.agents/logs/changes-2026-07-17.txt`.            | ✅        | 2026-07-17 |

## 3. Alternatives

- **ALT-001**: Build authentication, room persistence, and the editor simultaneously. Rejected because it creates multiple unverified integration boundaries and delays proof of the core collaboration path.
- **ALT-002**: Embed a WebSocket server in Next.js. Rejected because serverless and request-oriented Next.js runtimes are not appropriate owners of durable WebSocket connections.
- **ALT-003**: Start with a plain textarea. Rejected because rich-text formatting is the next explicit roadmap requirement and Tiptap is already the selected editor in the PRD.
- **ALT-004**: Adopt a managed Yjs provider immediately. Rejected for this slice because the existing local WebSocket server already connects successfully and should be validated before changing infrastructure.

## 4. Dependencies

- **DEP-001**: `next@16.2.10`, `react@19.2.7`, and `react-dom@19.2.7` for the App Router frontend.
- **DEP-002**: `yjs@13.6.31` and `y-websocket@2.1.0` for Yjs 13-compatible client and local server transport.
- **DEP-003**: Tiptap 3.28.0 packages for rich-text editing, collaboration, caret awareness, and placeholder behavior.
- **DEP-004**: Tailwind CSS 4.3.3 and PostCSS integration for design-system implementation.
- **DEP-005**: ESLint, TypeScript 5.9.x, and Node WebSocket tooling for static and synchronization verification.

## 5. Files

- **FILE-001**: `package.json` and `package-lock.json` — dependencies and executable scripts.
- **FILE-002**: `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `next-env.d.ts`, `.gitignore` — application toolchain.
- **FILE-003**: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/loading.tsx`, `src/app/error.tsx` — application shell and design foundation.
- **FILE-004**: `src/app/rooms/[roomId]/page.tsx`, `src/app/rooms/[roomId]/loading.tsx` — room route.
- **FILE-005**: `src/components/collaboration/collaborative-room.tsx` — collaboration lifecycle and room shell.
- **FILE-006**: `src/components/collaboration/rich-text-editor.tsx` — editor and toolbar.
- **FILE-007**: `scripts/verify-yjs.mjs` — protocol-level two-client sync verification.
- **FILE-008**: `.agents/ROADMAP.md`, `.agents/CHANGELOG.md`, `.agents/logs/changes-2026-07-17.txt` — verified progress and audit trail.
- **FILE-009**: `.agents/knowledge/mistakes-build.json`, `.agents/knowledge/mistakes-index.json` — required tooling-error learning record.

## 6. Testing

- **TEST-001**: `npm run lint` completes with zero ESLint errors.
- **TEST-002**: `npm run typecheck` completes with zero TypeScript errors.
- **TEST-003**: `npm run build` produces a successful production App Router build.
- **TEST-004**: `npm run verify:yjs` starts two Yjs clients, propagates a shared-text update through port 1234, and exits successfully.
- **TEST-005**: Manual browser verification confirms `/rooms/demo` renders at desktop and mobile widths and exposes meaningful connection states.
- **TEST-006**: Manual two-tab verification confirms formatting and content synchronize between clients in the same room.

## 7. Risks & Assumptions

- **RISK-001**: Resolved during verification: `@y/websocket-server@0.1.5` did not replicate Yjs 13 updates, so the slice now uses the compatible server bundled with `y-websocket@2.1.0`.
- **RISK-002**: The unauthenticated demo server permits arbitrary room access and must not be deployed as production collaboration infrastructure.
- **RISK-003**: In-memory documents are lost when the WebSocket server restarts because persistence is intentionally deferred.
- **RISK-004**: The roadmap currently marks editing, presence, and cursors complete without executable code; only verified capabilities may remain checked after reconciliation.
- **ASSUMPTION-001**: Node.js 25.2.1 satisfies the Next.js 16.2.10 minimum runtime requirement.
- **ASSUMPTION-002**: Port 1234 is available on IPv4 for the isolated local Yjs verification process.
- **ASSUMPTION-003**: Authentication and database persistence will follow after this collaboration slice is stable.

## 8. Related Specifications / Further Reading

[BoardPrep roadmap](../.agents/ROADMAP.md)
[BoardPrep product requirements](../.agents/PRD.md)
[BoardPrep design system](../.agents/DESIGN.md)
[Next.js App Router documentation](https://nextjs.org/docs/app)
[Yjs WebSocket provider](https://github.com/yjs/y-websocket)
[Tiptap collaboration guide](https://tiptap.dev/docs/editor/extensions/functionality/collaboration)

## 9. Verification Results

- `npm run lint` — passed with zero errors.
- `npm run typecheck` — passed with zero TypeScript errors.
- `npm run build` — passed; `/rooms/[roomId]` compiled as a dynamic App Router route.
- `npm run verify:yjs` — passed; an edit replicated between two independent clients through `ws://127.0.0.1:1234`.
- `GET /rooms/demo` — returned `200 OK` with the expected room metadata and server-rendered content.
- Visual browser automation was unavailable in the workspace, so responsive and collaborative-caret visual QA remains a recommended human follow-up rather than a claimed automated result.

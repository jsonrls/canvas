---
goal: Add a Persistent Live Q&A Panel to Breakout Study Tools
version: 1.0
date_created: 2026-07-30
last_updated: 2026-07-30
owner: Qollab
status: "Completed"
tags: [feature, collaboration, breakout-room, q-and-a, yjs]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Add a livestream-style Q&A rail to breakout rooms so participants can ask persistent, real-time questions while using Shared Notes, PDF Annotation, or Whiteboard.

## 1. Requirements & Constraints

- **REQ-001**: Display the Q&A rail to the right of every breakout study tool on desktop.
- **REQ-002**: Persist questions across tool changes by storing them in the breakout room Yjs document.
- **REQ-003**: Include the author, creation time, and originating study tool on each question.
- **REQ-004**: Allow question authors to remove their own questions.
- **REQ-005**: Keep the composer anchored while the question list scrolls independently.
- **REQ-006**: Provide a full-width Q&A overlay on small screens without introducing horizontal page scrolling.
- **SEC-001**: Render question content as text and validate collaborative Yjs values before display.
- **SEC-002**: Restrict question removal to entries whose persisted author ID matches the current user ID.
- **CON-001**: Reuse the existing authenticated breakout Yjs connection and persistence path.
- **CON-002**: Preserve read-only behavior when viewer collaboration is disabled.
- **GUD-001**: Maintain the existing warm Qollab visual system and Lucide icon language.
- **GUD-002**: Keep interactive controls keyboard accessible with visible focus states and 44px touch targets.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Implement the persistent collaborative Q&A data and interaction layer.

| Task     | Description                                                                                                                                                                         | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Add `BreakoutQaPanel` with validated Yjs question storage, live observation, posting, and author-only removal in `src/components/collaboration/breakout-qa-panel.tsx`.              | ✅        | 2026-07-30 |
| TASK-002 | Pass the existing breakout notes Yjs document, current user, participant count, and active tool into the Q&A panel from `src/components/collaboration/breakout-room-workspace.tsx`. | ✅        | 2026-07-30 |
| TASK-003 | Add a mobile Q&A tab and close behavior without changing the active study tool.                                                                                                     | ✅        | 2026-07-30 |

### Implementation Phase 2

- GOAL-002: Integrate the Q&A rail into the full-height breakout layout and validate it.

| Task     | Description                                                                                                                                         | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Add desktop, tablet, and mobile Q&A layout styles in `src/app/globals.css`.                                                                         | ✅        | 2026-07-30 |
| TASK-005 | Add independent question-list scrolling, a fixed composer, empty state, responsive overlay, reduced-motion handling, and accessible focus behavior. | ✅        | 2026-07-30 |
| TASK-006 | Run Prettier, TypeScript, ESLint, and authenticated browser verification across Notes, PDF Annotation, and Whiteboard.                              | ✅        | 2026-07-30 |

## 3. Alternatives

- **ALT-001**: Create a separate database table and API for questions. Not selected because the breakout room already has authenticated Yjs persistence and the requested interaction is real-time.
- **ALT-002**: Store a separate Q&A array in each study-tool document. Not selected because questions must remain visible when participants switch tools.
- **ALT-003**: Hide Q&A completely on phones. Not selected because a dedicated overlay preserves the feature without shrinking the study tool below a usable width.

## 4. Dependencies

- **DEP-001**: Existing breakout room `Y.Doc` and `WebsocketProvider`.
- **DEP-002**: Existing room membership and viewer collaboration authorization.
- **DEP-003**: `lucide-react` for accessible interface icons.

## 5. Files

- **FILE-001**: `src/components/collaboration/breakout-qa-panel.tsx` — Live Q&A component and collaborative data handling.
- **FILE-002**: `src/components/collaboration/breakout-room-workspace.tsx` — Breakout integration and mobile panel state.
- **FILE-003**: `src/app/globals.css` — Full-height three-column layout and Q&A presentation.
- **FILE-004**: `plan/feature-breakout-live-qa-1.md` — Completed implementation plan.

## 6. Testing

- **TEST-001**: `npx prettier --check src/components/collaboration/breakout-qa-panel.tsx src/components/collaboration/breakout-room-workspace.tsx src/app/globals.css`
- **TEST-002**: `npm run typecheck`
- **TEST-003**: `npx eslint src/components/collaboration/breakout-qa-panel.tsx src/components/collaboration/breakout-room-workspace.tsx`
- **TEST-004**: Verify the Q&A panel stays visible beside Notes, PDF Annotation, and Whiteboard without document-level scrolling.
- **TEST-005**: Post a question, verify its author/time/tool metadata, remove it as the author, and confirm the empty state returns.
- **TEST-006**: Verify the compact layout exposes Q&A through the fourth mobile workspace tab and renders it as a full-width overlay.

## 7. Risks & Assumptions

- **RISK-001**: A very large question history can increase the breakout notes document snapshot size; list virtualization or archival may be needed at higher scale.
- **RISK-002**: Viewer Q&A posting follows the room-level viewer collaboration setting because the shared document is read-only when collaboration is disabled.
- **ASSUMPTION-001**: Questions belong to the breakout room as a whole rather than to one study tool.
- **ASSUMPTION-002**: The existing Yjs persistence service remains the source of truth for breakout collaborative state.

## 8. Related Specifications / Further Reading

[Breakout room workspace component](../src/components/collaboration/breakout-room-workspace.tsx)

[Yjs documentation](https://docs.yjs.dev/)

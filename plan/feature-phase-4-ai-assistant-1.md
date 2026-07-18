---
goal: Deliver the room-scoped Phase 4 AI study assistant
version: 1.0
date_created: 2026-07-18
last_updated: 2026-07-18
owner: BoardPrep
status: "Completed"
tags: [feature, ai, study-tools, nextjs, security]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Implement one secure study-pack workflow that transforms an explicit snapshot of collaborative notes into the five Phase 4 outputs: discussion summaries, quizzes, flashcards, content recommendations, and misconception review.

## 1. Requirements & Constraints

- **REQ-001**: Generate all five Phase 4 study outputs from the note text captured when a room member opens or refreshes the assistant.
- **REQ-002**: Present summary, quiz, flashcard, recommendation, and misconception content in distinct, keyboard-operable views.
- **REQ-003**: Permit every authenticated room member, including viewers, to generate a private response from content they can already read.
- **REQ-004**: Keep generated study packs ephemeral in Phase 4; do not add them to the collaborative Yjs document or persist them in Postgres.
- **SEC-001**: Authenticate every generation request and verify room membership before calling the model provider.
- **SEC-002**: Keep `OPENAI_API_KEY` server-only and send no credential, provider error body, or stack trace to the browser.
- **SEC-003**: Bound request size, normalized note length, output tokens, request duration, and per-user generation frequency.
- **SEC-004**: Disable provider-side response storage and return private, no-store HTTP responses.
- **SEC-005**: Treat note content as untrusted data, separate it from instructions, and instruct the model to ignore commands embedded in notes.
- **MED-001**: Label every generated pack as a study aid, not medical advice, and require verification against authoritative course or clinical sources.
- **MED-002**: Phrase misconception findings as review prompts with confidence labels rather than definitive clinical judgments.
- **CON-001**: Use the existing Next.js App Router, Supabase room authorization, Lucide icon set, and BoardPrep design tokens.
- **CON-002**: Do not add a client-side AI SDK or expose a provider-specific dependency to the room workspace.
- **GUD-001**: Lazy-load the assistant workspace so the existing collaborative editor bundle does not absorb the new UI on initial room load.
- **GUD-002**: Preserve the existing Phase 1–3 room, offline, PDF, whiteboard, and version-history behavior.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Define and secure the AI generation boundary.

| Task     | Description                                                                                                                                                                                                                  | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create `src/lib/ai/study-pack.ts` with request limits, the strict output schema, runtime validation, prompt construction, and provider-response parsing.                                                                     | ✅        | 2026-07-18 |
| TASK-002 | Create `src/app/api/rooms/[roomId]/ai-study-pack/route.ts` with authentication, room membership authorization, request validation, rate limiting, timeout handling, private cache headers, and server-only model invocation. | ✅        | 2026-07-18 |
| TASK-003 | Document `OPENAI_API_KEY` and optional `OPENAI_MODEL` configuration in `.env.example`.                                                                                                                                       | ✅        | 2026-07-18 |

### Implementation Phase 2

- GOAL-002: Integrate an accessible, responsive AI assistant into every study room.

| Task     | Description                                                                                                                                                                                           | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Create `src/components/collaboration/ai-study-tool.tsx` with generation feedback, source-snapshot context, summary, quiz, flashcard, recommendation, misconception, empty, refusal, and error states. | ✅        | 2026-07-18 |
| TASK-005 | Update `src/components/collaboration/collaborative-room.tsx` to capture the current note draft, lazy-load the assistant, and expose it in desktop and mobile workspace navigation.                    | ✅        | 2026-07-18 |
| TASK-006 | Add BoardPrep-aligned responsive and accessible assistant styles to `src/app/globals.css`, including 375px behavior and reduced-motion compatibility.                                                 | ✅        | 2026-07-18 |

### Implementation Phase 3

- GOAL-003: Verify behavior and synchronize project documentation.

| Task     | Description                                                                                                                                                                                                | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Add `scripts/verify-phase-4.ts` and `verify:phase-4` to validate schemas, boundaries, authorization wiring, navigation, accessibility contracts, and server-only configuration.                            | ✅        | 2026-07-18 |
| TASK-008 | Update README, API, architecture, security, testing, changelog, decisions, roadmap, and this plan with verified Phase 4 behavior.                                                                          | ✅        | 2026-07-18 |
| TASK-009 | Pass Prettier, ESLint, strict TypeScript, production build, Phase 1–3 regression verifiers, Phase 4 verification, live provider smoke testing, and desktop/mobile browser acceptance with a clean console. | ✅        | 2026-07-18 |

## 3. Alternatives

- **ALT-001**: Generate each artifact with a separate provider request. Rejected because it multiplies latency, cost, rate-limit pressure, and inconsistent interpretations of the same note snapshot.
- **ALT-002**: Persist generated packs in Postgres or Yjs. Deferred because the Phase 4 roadmap requests basic generation features, while persistence creates additional retention, collaboration, and deletion semantics.
- **ALT-003**: Call the provider directly from the browser. Rejected because it would expose the API credential and bypass room authorization.
- **ALT-004**: Use heuristic-only local text generation. Rejected because it would not fulfill the roadmap's AI-assistant intent or support grounded misconception review.

## 4. Dependencies

- **DEP-001**: Existing Supabase authentication and `getRoomToolAccess` membership enforcement.
- **DEP-002**: Existing collaborative editor draft capture through `RichTextEditorHandle`.
- **DEP-003**: Server-only `OPENAI_API_KEY`; `OPENAI_MODEL` defaults to a cost-sensitive structured-output model.
- **DEP-004**: Existing Next.js, React, TypeScript, and Lucide packages; no new npm dependency is required.

## 5. Files

- **FILE-001**: `src/lib/ai/study-pack.ts` — provider-independent study-pack contracts and validation.
- **FILE-002**: `src/app/api/rooms/[roomId]/ai-study-pack/route.ts` — authenticated model endpoint.
- **FILE-003**: `src/components/collaboration/ai-study-tool.tsx` — Phase 4 workspace.
- **FILE-004**: `src/components/collaboration/collaborative-room.tsx` — room navigation and source capture.
- **FILE-005**: `src/app/globals.css` — assistant presentation and responsive rules.
- **FILE-006**: `scripts/verify-phase-4.ts` and `package.json` — automated verification.
- **FILE-007**: `.env.example` and `.agents/*.md` — configuration and project documentation.

## 6. Testing

- **TEST-001**: Accept a complete strict study-pack payload and reject missing, oversized, malformed, or invalid-enum values.
- **TEST-002**: Reject invalid note text, room identifiers, request shapes, request sizes, unauthenticated users, and non-members before provider invocation.
- **TEST-003**: Confirm provider requests set `store: false`, bound output tokens, use strict JSON Schema, and isolate untrusted notes from instructions.
- **TEST-004**: Confirm the room lazily loads the assistant and captures a note snapshot before leaving the notes editor.
- **TEST-005**: Confirm all five roadmap outputs have accessible labels, empty/loading/error feedback, and no color-only status meaning.
- **TEST-006**: Confirm Phase 1–3 verification suites remain green.
- **TEST-007**: Exercise generation in authenticated desktop and 375x812 browser views with a clean console.

## 7. Risks & Assumptions

- **RISK-001**: Model output can be inaccurate. Mitigate with strict grounding instructions, cautious misconception language, confidence labels, and a persistent study-aid notice.
- **RISK-002**: In-memory rate limits are instance-local. Treat them as a basic abuse guard for Phase 4 and document distributed enforcement as a future production hardening item.
- **RISK-003**: A provider outage or missing credential blocks generation. Preserve the note editor and provide a recoverable configuration or retry message.
- **ASSUMPTION-001**: Room notes are the sole Phase 4 source; PDF and whiteboard extraction are outside this phase.
- **ASSUMPTION-002**: Generated packs are private to the requesting browser until a later roadmap item defines sharing and retention.

## 8. Related Specifications / Further Reading

- [Product roadmap](../.agents/ROADMAP.md)
- [Architecture](../.agents/ARCHITECTURE.md)
- [Security](../.agents/SECURITY.md)
- [Phase 3 study tools](./feature-phase-3-study-tools-1.md)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

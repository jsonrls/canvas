---
goal: Add durable private saved AI study guides
version: 1.0
date_created: 2026-07-18
last_updated: 2026-07-18
owner: BoardPrep
status: "Completed"
tags: [feature, ai, persistence, supabase, security, study-tools]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Extend the completed Phase 4 AI assistant so an authenticated room member can explicitly save, reopen, and delete their own validated study guides for later use without persisting the source note snapshot.

## 1. Requirements & Constraints

- **REQ-001**: Allow a room member to explicitly save the currently generated study guide.
- **REQ-002**: List up to 50 saved guides for the signed-in user in the active room, newest first.
- **REQ-003**: Load a saved guide into the existing summary, quiz, flashcard, recommendation, and misconception views without another model call.
- **REQ-004**: Allow the creator to delete a saved guide after an explicit inline confirmation.
- **REQ-005**: Persist the validated guide payload, generated timestamp, source character count, derived title, creator, room, and save timestamp.
- **REQ-006**: Do not persist collaborative source note text, quiz answers, revealed-card state, or generated-provider metadata.
- **SEC-001**: Authenticate and authorize every list, load, save, and delete request inside its Route Handler.
- **SEC-002**: Enforce room membership and creator ownership with PostgreSQL Row Level Security; a former room member cannot access a retained guide.
- **SEC-003**: Grant authenticated users only `SELECT`, `INSERT`, and `DELETE`; saved AI output remains immutable.
- **SEC-004**: Enable RLS before granting Data API privileges, revoke all anonymous access, and return `private, no-store` responses.
- **SEC-005**: Revalidate the complete study-pack schema, timestamps, identifiers, request shape, and payload size at the server boundary.
- **DAT-001**: Cap saved guides at 50 per user per room and reject additional saves until one is deleted.
- **DAT-002**: Cascade saved guides when their room or creator account is deleted.
- **PER-001**: Index `(room_id, created_by, created_at desc)` for list/RLS access and `created_by` for account deletion.
- **CON-001**: Reuse the existing Next.js Route Handler, authenticated Supabase client, study-pack validator, Lucide icon set, and BoardPrep editorial design language.
- **CON-002**: Add no new npm dependency and do not move saved guides into Yjs collaboration state.
- **GUD-001**: Fetch saved-guide metadata when the lazy-loaded AI workspace opens; fetch a full payload only when the user opens one.
- **GUD-002**: Provide accessible loading, empty, success, error, keyboard, touch, and destructive-confirmation states at desktop and 375-pixel widths.
- **GUD-003**: Preserve all completed Phase 1–4 generation and collaboration behavior.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish the durable authorization and storage boundary.

| Task     | Description                                                                                                                                                                                                     | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Create a Supabase migration for `public.saved_study_guides` with bounded validated metadata, immutable JSONB content, foreign keys, indexes, least-privilege grants, RLS, and creator-plus-membership policies. | ✅        | 2026-07-18 |
| TASK-002 | Update `scripts/verify-schema.mjs` and add hosted lifecycle verification for table shape, grants, policies, creator isolation, former-member denial, ordering, limits, load, delete, and cascades.              | ✅        | 2026-07-18 |
| TASK-003 | Create `src/lib/ai/saved-study-guides.ts` with exact request/response contracts, UUID/date validation, payload validation, row mapping, and storage limits.                                                     | ✅        | 2026-07-18 |

### Implementation Phase 2

- GOAL-002: Implement the authenticated persistence API and user interface.

| Task     | Description                                                                                                                                                                                                                     | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Add `src/app/api/rooms/[roomId]/saved-study-guides/route.ts` with authenticated list/detail GET, validated save POST, creator-owned DELETE, membership checks, explicit row filters, bounded errors, and private cache headers. | ✅        | 2026-07-18 |
| TASK-005 | Extend `src/components/collaboration/ai-study-tool.tsx` with a responsive saved-guide library, explicit save, saved state, lazy load, restore, delete confirmation, retry, and accessible live feedback.                        | ✅        | 2026-07-18 |
| TASK-006 | Extend `src/app/globals.css` with BoardPrep-aligned saved-guide shelf, cards, metadata, actions, confirmation, empty/error states, 44-pixel targets, and responsive behavior without horizontal overflow.                       | ✅        | 2026-07-18 |

### Implementation Phase 3

- GOAL-003: Verify the complete lifecycle and synchronize project documentation.

| Task     | Description                                                                                                                                                                                                    | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Extend `scripts/verify-phase-4.ts`, add a hosted saved-guide verifier and package script, and cover exact contracts, server wiring, UI states, responsive CSS, RLS, and destructive lifecycle behavior.        | ✅        | 2026-07-18 |
| TASK-008 | Update README, API, architecture, database, security, testing, changelog, decisions, roadmap, completed Phase 4 plan, and this plan with the durable saved-guide behavior and retention model.                 | ✅        | 2026-07-18 |
| TASK-009 | Pass formatting, lint, strict TypeScript, production build, all Phase 1–4 regressions, hosted schema/lifecycle tests, Supabase security/performance advisors, and authenticated desktop/mobile browser checks. | ✅        | 2026-07-18 |

## 3. Alternatives

- **ALT-001**: Persist every generated guide automatically. Rejected because generation does not imply retention consent and would accumulate sensitive study content unexpectedly.
- **ALT-002**: Share every saved guide with all room members. Deferred because the user requested later reuse, while sharing adds authorship, moderation, and deletion semantics beyond this extension.
- **ALT-003**: Store guides in the Yjs notes document. Rejected because generated artifacts are not collaboratively edited and large structured payloads would increase synchronization and offline-storage cost.
- **ALT-004**: Store the full source note snapshot beside the guide. Rejected to minimize retained collaborative content; the guide stores only its source character count.

## 4. Dependencies

- **DEP-001**: Existing Supabase Auth, room membership model, `private.is_room_member(uuid)`, and authenticated Data API client.
- **DEP-002**: Existing strict `StudyPack` runtime validator and five-view AI study interface.
- **DEP-003**: Existing Next.js App Router, React, Lucide, CSS design tokens, hosted Supabase verification credentials, and migration workflow.

## 5. Files

- **FILE-001**: `supabase/migrations/*_store_saved_ai_study_guides.sql` — durable schema, grants, indexes, and RLS.
- **FILE-002**: `src/lib/ai/saved-study-guides.ts` — shared storage contracts and validation.
- **FILE-003**: `src/app/api/rooms/[roomId]/saved-study-guides/route.ts` — authenticated persistence API.
- **FILE-004**: `src/components/collaboration/ai-study-tool.tsx` — save/load/delete library UX.
- **FILE-005**: `src/app/globals.css` — responsive saved-guide presentation.
- **FILE-006**: `scripts/verify-phase-4.ts`, `scripts/verify-saved-study-guides.mjs`, `scripts/verify-schema.mjs`, and `package.json` — automated verification.
- **FILE-007**: `README.md`, `.agents/*.md`, and Phase 4 plans — synchronized product and implementation documentation.

## 6. Testing

- **TEST-001**: Accept valid saved guides and reject malformed identifiers, dates, source counts, extra request keys, oversized payloads, and invalid study packs.
- **TEST-002**: Prove anonymous users, outsiders, other members, and former members cannot read, insert, or delete another user's guide.
- **TEST-003**: Prove a member can save, list newest-first, load, and delete only their own guides, with the 50-guide cap and room/account cascades intact.
- **TEST-004**: Verify list responses omit full guide JSON and detail responses revalidate the stored payload before returning it.
- **TEST-005**: Exercise save, load, delete confirmation, loading, empty, error, and retry behavior with keyboard and screen-reader semantics.
- **TEST-006**: Verify desktop and 375x812 layouts have no horizontal overflow and all interactive targets remain at least 44 pixels.
- **TEST-007**: Confirm all Phase 1–4 collaboration, storage, generation, password, room, offline, and version-history regressions remain green.

## 7. Risks & Assumptions

- **RISK-001**: Durable AI output may contain inaccuracies. Retain the study-aid notice on loaded guides and store the original generated timestamp.
- **RISK-002**: JSONB rows can grow. Enforce runtime string limits, a 64 KiB database payload bound, detail-only payload reads, and a 50-row user/room cap.
- **RISK-003**: A saved guide can outlive the source note state. Show both generated and saved timestamps without implying synchronization with later notes.
- **ASSUMPTION-001**: Saved guides are private to their creator and remain associated with one room.
- **ASSUMPTION-002**: Saved guide titles are derived from the validated summary title and are immutable in this extension.

## 8. Related Specifications / Further Reading

- [Phase 4 AI assistant](./feature-phase-4-ai-assistant-1.md)
- [Product roadmap](../.agents/ROADMAP.md)
- [Database](../.agents/DATABASE.md)
- [Security](../.agents/SECURITY.md)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api)

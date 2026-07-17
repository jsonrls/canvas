---
goal: Deliver secure study room creation, discovery, switching, and owner-managed membership
version: 1.0
date_created: 2026-07-17
last_updated: 2026-07-17
owner: BoardPrep Engineering
status: "Completed"
tags: [feature, rooms, supabase, auth, rls, roadmap-phase-3]
---

# Introduction

![Status: Completed](https://img.shields.io/badge/status-Completed-brightgreen)

Replace slug-driven implicit room creation with an explicit, secure room lifecycle. Signed-in users will be able to create a complete study room, see and switch among joined rooms, discover and join public rooms, and manage room settings and collaborators when they are the owner.

## 1. Requirements & Constraints

- **REQ-001**: Make `/rooms` the authenticated room home with helpful empty states, one primary create action, joined-room access, and public-room discovery.
- **REQ-002**: Create a room, immutable owner membership, and notes document atomically from a validated room name and visibility choice.
- **REQ-003**: Generate a normalized, collision-resistant room slug on the server and never create a room as a side effect of reading `/rooms/[roomId]`.
- **REQ-004**: Allow signed-in users to join public rooms explicitly and non-owner members to leave explicitly.
- **REQ-005**: Provide a room switcher in the collaboration shell and links back to the room home.
- **REQ-006**: Allow owners to rename a room, switch public/private visibility, add an existing BoardPrep user by email as editor or viewer, change non-owner roles, remove non-owner members, and delete the room after confirmation.
- **REQ-007**: Show member display names and roles without exposing collaborator email addresses in room reads or browser props.
- **REQ-008**: Preserve owner membership as `owner`; owners cannot demote, remove, or leave themselves in this slice.
- **SEC-001**: Keep RLS authoritative for every room, membership, document, and profile read or mutation.
- **SEC-002**: Use explicit authenticated grants and hardened database functions with empty search paths, fully qualified relations, and revoked default execution.
- **SEC-003**: Authorize atomic creation and email-based member addition from `auth.uid()` inside the database; never trust a client-supplied owner identifier.
- **SEC-004**: Verify mutation outcomes by affected rows or returned records so RLS-filtered zero-row writes cannot be reported as success.
- **SEC-005**: Keep the Supabase service-role key server-only and pass the validated user access token to Data API calls so RLS remains active.
- **GUD-001**: Extend the existing BoardPrep visual language, use Lucide icons, visible labels and focus states, 44px interaction targets, status feedback, and mobile-safe layouts.
- **PAT-001**: Use Server Components for authenticated initial reads and Server Actions for internal UI mutations; do not add unnecessary REST handlers.
- **PAT-002**: Revalidate only affected room paths and call Next.js navigation outside mutation `try` blocks.
- **CON-001**: Invitation emails, pending invitations for users without accounts, ownership transfer, room archival, PDF annotation, and whiteboard work are outside this slice.
- **CON-002**: Preserve the running user-owned Next.js and Yjs development processes during implementation and verification.

## 2. Implementation Steps

### Implementation Phase 1

- GOAL-001: Establish an explicit and secure room lifecycle in PostgreSQL.

| Task     | Description                                                                                                                                                         | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Audit the roadmap, current room flow, design system, Supabase changelog/docs, repository skills, and prior mistakes; create this implementation plan.               | ✅        | 2026-07-17 |
| TASK-002 | Generate a Supabase migration through the CLI for atomic room creation, owner-safe membership policies, explicit function grants, and required indexes/constraints. | ✅        | 2026-07-17 |
| TASK-003 | Apply the migration to the configured database through the verified explicit pooler target, update migration history, and run focused SQL assertions.               | ✅        | 2026-07-17 |

### Implementation Phase 2

- GOAL-002: Add the server-side room domain and mutation boundary.

| Task     | Description                                                                                                                                                                             | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-004 | Add typed room repository reads for room lists, room access, current membership, owner settings, and collaborator profiles.                                                             | ✅        | 2026-07-17 |
| TASK-005 | Add authenticated Server Actions for create, join, leave, update settings, add member by email, change role, remove member, and delete room with normalized validation and safe errors. | ✅        | 2026-07-17 |
| TASK-006 | Change `/rooms/[roomId]` to open only an existing accessible room and remove implicit room/membership/document creation from read paths.                                                | ✅        | 2026-07-17 |

### Implementation Phase 3

- GOAL-003: Deliver the responsive room home, switcher, and owner settings interface.

| Task     | Description                                                                                                                                                           | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-007 | Build `/rooms` as the authenticated room home with create form, joined-room cards, public discovery, explicit join/leave actions, loading feedback, and empty states. | ✅        | 2026-07-17 |
| TASK-008 | Wire the collaboration header room switcher, room-home navigation, real privacy/role context, and owner settings entry without disturbing editor sync behavior.       | ✅        | 2026-07-17 |
| TASK-009 | Build `/rooms/[roomId]/settings` with owner-only settings, member add/change/remove controls, owner protection, status feedback, and typed-name delete confirmation.  | ✅        | 2026-07-17 |
| TASK-010 | Update login/home redirects and responsive styles so authenticated entry lands on the room home and controls remain usable at phone, tablet, and desktop widths.      | ✅        | 2026-07-17 |

### Implementation Phase 4

- GOAL-004: Prove authorization and close the ready Phase 3 room items.

| Task     | Description                                                                                                                                                                                             | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-011 | Extend schema verification for atomic room functions, explicit privileges, owner-safe policies, helper hardening, and updated policy/function counts.                                                   | ✅        | 2026-07-17 |
| TASK-012 | Add a disposable authenticated integration verifier covering atomic creation, slug collision resistance, public join, private denial, owner-only settings, member roles, owner protection, and cleanup. | ✅        | 2026-07-17 |
| TASK-013 | Run formatting, lint, strict typecheck, production build, schema/integration checks, and existing collaboration regressions without starting duplicate development servers.                             | ✅        | 2026-07-17 |
| TASK-014 | Update README, API/database/security/testing/changelog documentation with the implemented room lifecycle and accurately recorded verification evidence.                                                 | ✅        | 2026-07-17 |
| TASK-015 | Mark study room creation and room management complete in `.agents/ROADMAP.md`, complete this plan, and finalize the structured session log only after every gate passes.                                | ✅        | 2026-07-17 |

## 3. Alternatives

- **ALT-001**: Keep creating rooms from `/rooms/[slug]` reads — rejected because GET-like rendering would continue to mutate state and typoed URLs would create durable resources.
- **ALT-002**: Perform room, owner membership, and document inserts sequentially in a Server Action — rejected because partial failures could leave unusable rooms.
- **ALT-003**: Query Auth Admin users in application code to resolve member email — rejected in favor of a narrowly scoped, owner-authorized database function that performs one exact lookup and returns no email data.
- **ALT-004**: Add a full invitation-token/email system now — deferred because it adds delivery, expiry, acceptance, and abuse-prevention workflows beyond the roadmap's basic room management requirement.

## 4. Dependencies

- **DEP-001**: Existing Supabase Auth, `public.profiles`, `public.rooms`, `public.room_members`, and `public.documents` baseline.
- **DEP-002**: Existing Next.js 16 App Router authentication proxy and request-scoped Supabase clients.
- **DEP-003**: Existing BoardPrep CSS design system and Lucide icon dependency.
- **DEP-004**: Existing authenticated Yjs room service, which requires active owner/editor membership for writable collaboration.

## 5. Files

- **FILE-001**: `supabase/migrations/*_room_creation_management.sql` — atomic room lifecycle functions and owner-safe authorization.
- **FILE-002**: `src/lib/rooms/repository.ts` — typed RLS-backed room reads and domain validation.
- **FILE-003**: `src/app/rooms/actions.ts` — authenticated room lifecycle Server Actions.
- **FILE-004**: `src/app/rooms/page.tsx` — authenticated room home Server Component.
- **FILE-005**: `src/components/rooms/rooms-dashboard.tsx` — room creation, lists, and public join UI.
- **FILE-006**: `src/app/rooms/[roomId]/page.tsx` — existing-room collaboration loading.
- **FILE-007**: `src/app/rooms/[roomId]/settings/page.tsx` — owner-only settings read boundary.
- **FILE-008**: `src/components/rooms/room-settings.tsx` — settings and collaborator management UI.
- **FILE-009**: `src/components/collaboration/collaborative-room.tsx` — real room switcher and settings/home navigation.
- **FILE-010**: `src/app/globals.css` — responsive room-management styling.
- **FILE-011**: `scripts/verify-schema.mjs` and `scripts/verify-room-management.mjs` — security and workflow verification.
- **FILE-012**: `.agents/ROADMAP.md`, `.agents/API.md`, `.agents/DATABASE.md`, `.agents/SECURITY.md`, `.agents/TESTING.md`, `.agents/CHANGELOG.md`, and `README.md` — implementation documentation.

## 6. Testing

- **TEST-001**: Assert all exposed tables retain RLS and least-privilege authenticated grants.
- **TEST-002**: Assert only authenticated users can execute atomic room creation and email-member addition functions, with hardened empty search paths.
- **TEST-003**: Prove atomic creation returns a valid unique slug and creates exactly one owner membership and one notes document.
- **TEST-004**: Prove a public room can be joined explicitly while an uninvited user cannot see or join a private room.
- **TEST-005**: Prove only owners can rename, change visibility, add/remove members, change roles, or delete a room.
- **TEST-006**: Prove owner membership cannot be demoted, removed, or left and viewer/editor role changes affect document write access.
- **TEST-007**: Prove invalid names, emails, roles, slugs, confirmation text, and RLS-filtered zero-row mutations return safe actionable errors.
- **TEST-008**: Run existing version-history, offline-sync, conflict-review, and Yjs verification to catch collaboration regressions.

## 7. Risks & Assumptions

- **RISK-001**: Public discovery can grow into a large list; this slice caps reads and orders recent rooms, with pagination/search deferred.
- **RISK-002**: Email-based member addition reveals whether an exact account exists to an authenticated room owner; the function returns only a generic result and never returns the email or Auth row.
- **RISK-003**: Existing rooms created before the atomic flow may lack consistent owner membership or notes documents; the migration will backfill these invariants before tightening access.
- **RISK-004**: Browser automation remains unavailable in this environment; automated markup, HTTP, type, build, database, and integration evidence must be reported without claiming interactive visual acceptance.
- **ASSUMPTION-001**: Basic room management means existing-account membership administration, not an outbound invitation delivery system.
- **ASSUMPTION-002**: Room ownership is fixed for this slice; ownership transfer requires a separate guarded workflow.

## 8. Related Specifications / Further Reading

- [Roadmap](../.agents/ROADMAP.md)
- [Database baseline](../.agents/DATABASE.md)
- [API baseline](../.agents/API.md)
- [Security guidance](../.agents/SECURITY.md)
- [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase database functions guide](https://supabase.com/docs/guides/database/functions)
- [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations)

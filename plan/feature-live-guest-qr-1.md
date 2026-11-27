# Live Activities Guest Access (QR) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anyone can answer a room's Live Activities without an account, by scanning a QR code or opening a link the host shares.

**Architecture:** The host turns on a guest link for the main room. That stores a random `guest_code` on `live_sessions`. `/live/[code]` is a public page: a guest types a display name, the server creates a `live_guests` row and sets an HttpOnly cookie that holds a random token (only its SHA-256 hash is stored). Guest answers go into the existing response and Q&A tables through a new `guest_id` column. A generated `participant_id = coalesce(user_id, guest_id)` lets the repository treat members and guests the same way. Guests reuse the student UI (`StudentStage`).

**Tech Stack:** Next.js 16 route handlers, Supabase (service role only), Astryx UI, `uqr` for QR encoding (zero dependencies).

**Spec:** User request, 27 Nov 2026: "Make the Live Activities accessible without the viewers or participants to create an account. Host can share QR Code of the activity."

## Global Constraints

- Every live table stays service-role only (RLS on, all grants revoked). Guests never get a Supabase session.
- Only the room's owner and editors can turn the guest link on or off, or see it.
- Guests may only `join`, `respond`, `qa_ask` and `qa_vote`. Host actions return 403.
- Main rooms only. Breakouts stay member-only. Their tables get only `participant_id` (generated from `user_id`), so the queries are shared.
- Guest link code: 16 random bytes in base64url (22 characters). A cookie token uses 32 random bytes. The database stores `sha256(token)` hex only.
- Cookie `qollab_live_guest`: HttpOnly, SameSite=Lax, Secure outside development, `Path=/live/<code>`, max age 12 hours.
- Guest display name: 1–40 characters after trimming. At most 500 guests per room.
- Turning the link off and then on again makes a new code. Old QR codes stop working at once.

## Review Focus

- A link that was turned off or replaced: the page shows "This live link is no longer active". The API returns 404, not 500.
- A guest cookie made for room A, sent with room B's code: it is ignored (lookup by token hash and room).
- A guest who answers twice (second tab): the unique `(question_id, participant_id)` key makes this a 409 "You already answered".
- A guest who appears on the quiz leaderboard: shows the guest's display name, not "Participant".
- An account is deleted: its responses still cascade (the `user_id` foreign key is unchanged).

---

### Task 1: Migration `20261127090000_add_live_guest_access.sql`

- `live_sessions.guest_code text unique`, with a format check.
- `live_guests(id, room_id → rooms cascade, token_hash unique, display_name 1–40, created_at)`. RLS on, grants revoked, and an index on `room_id`.
- `live_responses` and `live_qa_items`: `user_id` becomes nullable. Add `guest_id → live_guests cascade` and `participant_id` (generated, stored), and require exactly one of `user_id` or `guest_id`. The unique key `(question_id, user_id)` on responses becomes `(question_id, participant_id)`.
- `live_qa_votes`: the same columns. The primary key becomes `(item_id, participant_id)`.
- Breakout response, Q&A item and Q&A vote tables: add `participant_id generated always as (user_id) stored`.

### Task 2: Server domain in `src/lib/live/guests.ts` and the repository

- `createGuestCode(): string`, `readGuestCode(value: unknown): string` (throws `LiveNotFoundError`), `hashGuestToken(token): string`, `readGuestName(value): string` (throws `LiveInputError`).
- `findGuestRoom(admin, code): Promise<{ roomId, roomName } | null>`, `loadGuest(admin, roomId, token | undefined)`, `createGuest(admin, roomId, name): Promise<{ id, token }>`, `setGuestAccess(admin, scope, value)` (room scope only).
- Repository: reads use `participant_id`. Inserts write `guest_id` when `isGuest`. Scores take names from `live_guests` as well as `profiles`. The snapshot gains `guestCode: string | null` (hosts in a main room only).
- Tests in `scripts/verify-live-activities.ts`: code and name validation, and that the hash is deterministic and is not the token itself.

### Task 3: Guest routes

- `src/app/live/[code]/api/route.ts`: GET returns the snapshot, or 401 when the cookie is missing. POST handles `join` (sets the cookie) and the guest actions. Any other action returns 403.
- `src/app/live/[code]/api/image/route.ts`: the image of the presented pin question.
- Host action `set_guest_access` in the member route.

### Task 4: UI

- `useLiveActivities({ endpoint, isActive, isEnabled? })`. Both existing callers pass `liveApiPath(...)`.
- Export `StudentStage`.
- `src/app/live/[code]/page.tsx` (server) and `src/components/collaboration/live/live-guest.tsx` (client): a name form, then `StudentStage`.
- `LiveShareDialog`: a switch for the guest link, the QR code as an SVG, the URL with a copy button. The host panel button appears for main rooms only.

### Task 5: Verify

- `npm run typecheck`, `npm run lint`, `npm run verify:live-activities`, `npm run verify:live-breakouts`, `npm run build`.
- Run the migration against a Supabase branch or a local stack before `db push`. This needs the user's OK.

# Rooms Directory Greeting Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the room directory (`/rooms`) into the November look used by the landing and sign-in pages: a greeting title with one fact from the data, and two tonal panels holding white room rows.

**Architecture:** Presentational change inside `src/components/rooms/rooms-dashboard.tsx`. One new pure helper builds the sentence under the title. Server data, Server Actions, dialogs, roles and routes are untouched.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, Astryx `@astryxdesign/core`, Tailwind utilities from `tailwind-theme.css`.

**Spec:** This file. The user approved the "Greeting home" direction and its text sketch in chat on 2026-11-23.

## Design (approved 2026-11-23)

**Why:** The landing and auth pages moved to soft grey rounded panels, pill buttons and pale blue fields on 2026-11-06. `/rooms` still has the October ruled-list look and reads as a different product.

**References:**

- "Editorial greeting" app style, dealt by the design-taste-frontend skill (seed 2002427935): the greeting is the `h1`, panels are tonal, records are row cards about 63px tall with 8px gaps.
- The landing's own panels: `bg-muted rounded-3xl` with white insets.

**Approaches considered:**

- A. Greeting home: title names the person, one sentence states a fact from the data, joined and public rooms sit in two tonal panels. **Picked by the user.**
- B. Restyle only: keep the single ruled list, swap tokens. Smallest diff, keeps the flat feel.
- C. Cover-tile grid. Dropped: rooms carry only a small icon, and `.agents/DESIGN.md` bans one card per record.

**The screen:**

- Its one question: "Which room do I go back to?" The answer is the first joined row; rooms arrive sorted by `updated_at` descending.
- Its face: the title names the signed-in person and the sentence below states the most recently updated room.
- Header: logo and account menu, unchanged.
- Title row: `h1` "Your study rooms, {displayName}", the summary sentence, and the one primary action "Create room".
- The "Study commons / Shared notes / PDF annotation / Whiteboard / AI study assistant" strip is removed. It describes the product, not the data.
- Joined panel: `bg-muted rounded-3xl`, heading "Joined rooms" with a count `Badge`, white rows.
- Public panel: Soft Blue (`bg-accent-muted rounded-3xl`), heading "Open to join" with a count `Badge`, white rows. The tint separates rooms that are not yours yet.
- Desktop (`lg` and up): panels side by side at 3:2, each keeping its own height. Below `lg`: stacked, joined first.
- Row: avatar, room name, then access and role `Token`s (joined rows) and the updated date; actions trail on the right and wrap under the text on phones. Public rows drop the access `Token`, since the panel already says it.

**Non-goals:** search, filters, sorting, member counts, activity, a sidebar, new room data, any change to dialogs or actions.

**Anti-goals:** invented numbers or activity, stat tiles, gradients or shadows on the panels, a time-of-day greeting (it differs between server and browser).

## Global Constraints

- Astryx rules from `AGENTS.md`: no `<div>`, no `style={{}}`, no raw hex or px, token-backed Tailwind utilities only.
- Buttons come from `@/components/ui/button`.
- Every existing accessible name stays: "Open room: {name}", "Manage room: {name}", "Leave room: {name}", "Join room: {name}", "Qollab rooms", "Skip to rooms".
- `Badge` shows counts only. `Token` shows access and role.
- No horizontal page scroll at 1440, 768, 390 or 320px.
- No commit without the user's OK.

## Review Focus

- Zero joined rooms: the sentence invites creating or joining, and the panel shows its empty state.
- One joined room: singular "1 room joined."
- A room with an unparseable `updatedAt`: the sentence still reads, with no "Invalid Date".
- A very long room name or display name: text wraps, nothing overflows the panel.
- An empty display name: the title falls back to "Your study rooms".

---

### Task 1: Summary sentence helper

**Files:**

- Create: `src/lib/rooms/directory-summary.ts`
- Test: `scripts/verify-rooms-directory.ts`
- Modify: `package.json` (add `"verify:rooms-directory": "node --import tsx scripts/verify-rooms-directory.ts"`)

**Interfaces:**

- Produces: `formatRoomDate(value: string): string | null` (for example "Nov 8", UTC, `null` when unparseable) and `summarizeJoinedRooms(rooms: Pick<RoomSummary, "name" | "updatedAt">[]): string`.

- [ ] **Step 1: Write the failing test** with `node:assert/strict`:

```ts
assert.equal(
  summarizeJoinedRooms([]),
  "You haven’t joined a room yet. Create one, or join a room that is open to everyone.",
);
assert.equal(
  summarizeJoinedRooms([{ name: "Test", updatedAt: "2026-11-08T10:00:00Z" }]),
  "1 room joined. Test was updated on Nov 8.",
);
assert.equal(
  summarizeJoinedRooms([
    { name: "Test", updatedAt: "2026-11-08T10:00:00Z" },
    { name: "Demo", updatedAt: "2026-07-17T10:00:00Z" },
  ]),
  "2 rooms joined. Test was updated most recently, on Nov 8.",
);
assert.equal(
  summarizeJoinedRooms([{ name: "Test", updatedAt: "nope" }]),
  "1 room joined.",
);
assert.equal(formatRoomDate("nope"), null);
```

- [ ] **Step 2: Run** `npm run verify:rooms-directory`. Expected: fails, module not found.
- [ ] **Step 3: Implement** both functions. The first array item is the most recent; the repository sorts.
- [ ] **Step 4: Run** `npm run verify:rooms-directory`. Expected: passes.

### Task 2: Rebuild the directory layout

**Files:**

- Modify: `src/components/rooms/rooms-dashboard.tsx`

**Interfaces:**

- Consumes: `summarizeJoinedRooms`, `formatRoomDate` from Task 1.

- [ ] **Step 1:** Run `npx astryx component` for `Avatar`, `Badge`, `Token`, `Heading`, `List` and read `npx astryx docs layout` before editing.
- [ ] **Step 2:** Replace the title block and both sections with the layout in the Design section. `RoomRow` takes `joined`; `formatUpdatedAt` is replaced by `formatRoomDate` with the fallback "Recently active".
- [ ] **Step 3:** Keep `JoinRoomForm`, `LeaveRoomForm`, `PendingButton` and the create dialog as they are.
- [ ] **Step 4:** Run `npm run lint`, `npm run typecheck`, `npm run verify:buttons`, `npm run format:check`. Expected: all pass.

### Task 3: Verify in the browser

- [ ] **Step 1:** Open `/rooms` signed in. Check 1440, 768, 390 and 320px: no horizontal scroll, panels stack below `lg`, actions wrap on phones.
- [ ] **Step 2:** Open and close the create dialog and the leave dialog; follow one "Open room" link.
- [ ] **Step 3:** Run the design-taste-frontend app inspector on the page and fix every `FAIL`.

### Task 4: Record the direction

**Files:**

- Modify: `.agents/DESIGN.md` (the "Current front-end direction" section and the "Room directory" bullet)

- [ ] **Step 1:** State that the room directory uses a greeting title, a data sentence and two tonal panels with white rows, and that rows inside a panel are list rows, not `Card`s.

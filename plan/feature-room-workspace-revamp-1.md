# Room Workspace Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the study room page (`/rooms/[roomId]`) one header, visible presence, a properly framed notes canvas and a clean sidebar, without changing any collaboration behaviour.

**Architecture:** Presentational change inside the existing Astryx shell. A new `RoomHeader` component replaces the two stacked title bars; the notes editor's scroll moves from the width-capped ProseMirror element to its full-width wrapper; the word count moves to the editor footer. Server data, Yjs documents, roles, presenter mode and offline recovery are untouched.

**Tech Stack:** Next.js 16 (App Router, client component), React 19, Astryx `@astryxdesign/core`, Tiptap, Yjs, Tailwind utilities from `tailwind-theme.css`.

**Spec:** No separate spec. The user skipped design Q&A on 2026-11-08 ("go straight"). The design source is `.agents/DESIGN.md` (Workspace section, Application frame, Decision rules). Findings come from the 2026-11-08 screenshot of `localhost:3001/rooms/test-552853613d` at desktop width.

## Problems this fixes (from the screenshot and code)

1. Three stacked bars before any text: the app header ("Test / Shared notes", Present, Manage), the notes sub-header (h1 "Shared notes", Version history), then the formatting toolbar. Together they take about 250px, and "Shared notes" appears three times counting the sidebar.
2. The scroll lives on `.boardprep-editor`, which is capped at `max-w-5xl`. The scrollbar floats in the middle of the canvas instead of at the right edge.
3. The text column runs about 1000px wide. DESIGN.md asks for a 760px content budget and a 680px reading measure.
4. Presence is hidden. Participants only show inside the "Room controls" dialog, behind an unlabeled icon in the sidebar footer.
5. The sidebar shows a horizontal scrollbar at its bottom edge.
6. Sync status sits at the toolbar's far end. The footer spends its space on "Changes sync automatically with your room."

## Global Constraints

- Astryx components and token-backed Tailwind utilities only. No raw `<div>`/`<span>` layout, no `style={{}}`, no hex, no arbitrary utilities (`p-[13px]`), no new CSS files (DESIGN.md "Renderer and custom-style boundaries").
- Workspace header stays 56px (`QOLLAB_WORKSPACE_HEADER_HEIGHT`). Context panel stays 360px desktop, Dialog 400px tablet, BottomSheet below 768px.
- Exactly one `h1` on the page.
- Status uses `StatusDot` with visible text. Role and access use `Token`. `Badge` is for counts only.
- Keep these exact existing strings: "Present", "Stop presenting", "Follow", "Stop following", "Manage", "Version history", "Follow presenter", "Not now", "Retry now", "Viewer access · editing controls are disabled", "Ask the room owner for editor access to make changes.", "Notes focused", "⌘ / Ctrl Z to undo".
- Keep `aria-controls="version-history-sidebar"` and `aria-expanded` on the version-history toggle.
- Preserve: owner/editor/viewer gating (`canEdit`, `canManagePdf`, `currentUserRole === "owner"` for Manage), presenter start/stop/follow and scroll sync, offline/error banners, conflict review, local-save alert, the mobile workspace `Selector` (`md:hidden`), and dynamic imports for PDF, whiteboard and AI.
- No new dependencies.

## Review Focus

1. A viewer following a presenter on notes still scrolls with them after the scroller moves (Task 2 changes the scroller element). Expect: the viewer's notes scroll to the same relative position.
2. A room with 10+ live participants: the header must not overflow at 1024px. Expect at most 4 avatars plus "+N", and the full list in the participants dialog.
3. Offline or error sync: the header must not say "Live". Expect the warning or error dot with the existing `remoteCopy` text, and the banner under the toolbar unchanged.
4. A 60-character room name at 390px: expect the name to truncate to one line, with Present/Follow still visible.
5. 768–1024px: the version-history toggle opens the 400px Dialog, and below 768px it opens the BottomSheet. Expect no empty 360px panel.

Each of these has a check in the owning task or in Task 4's browser QA.

---

### Task 1: `RoomHeader` replaces the two title bars

**Files:**
- Create: `src/components/collaboration/room-header.tsx`
- Create: `scripts/verify-room-header.ts`
- Modify: `package.json` (add script `"verify:room-header": "node --import tsx scripts/verify-room-header.ts"`)
- Modify: `src/components/collaboration/collaborative-room.tsx` (header slot, lines 330–386; notes sub-header, lines 575–595; sidebar `topContent` "Private room" text, lines 432–434)

**Interfaces:**
- Produces:
  ```ts
  export type RoomSyncStatus = "connecting" | "synced" | "offline" | "error" | "viewing";
  export interface RoomHeaderParticipant { clientId: number; name: string }
  export interface RoomHeaderProps {
    roomName: string;
    roomIconUrl: string | null;
    isPublic: boolean;
    role: RoomRole;                 // from "@/lib/rooms/repository"
    toolLabel: string;              // "Shared notes" | "PDF annotation" | ...
    participants: readonly RoomHeaderParticipant[];
    onOpenParticipants: () => void;
    syncStatus: RoomSyncStatus;
    syncLabel: string;              // "Live" when synced, else remoteCopy[status]
    actions: React.ReactNode;       // Present/Follow, version toggle, Manage: built by CollaborativeRoom
  }
  export function RoomHeader(props: RoomHeaderProps): React.ReactElement;
  export const ROOM_HEADER_VISIBLE_AVATARS = 4;
  ```

Layout, built inside the existing `QollabWorkspaceHeader` (`startContent` / `endContent`):
- Start: `Avatar` (room icon, `sm`, `tooltip={false}`), then a `VStack gap={0} className="min-w-0"` holding `Heading level={1}` (room name, one line, truncates) and `Text type="supporting"` with the tool label (hidden below `sm`). Then `Token size="sm"` reading "Private" or "Public", hidden below `md`. For non-owners, a second `Token size="sm"` with the role ("Editor"/"Viewer"), hidden below `md`. Owners get the Manage button instead.
- End: a presence control, then the sync status, then `actions`. The presence control is a `ButtonControl variant="ghost"` with `aria-label` "{n} people in this room" (or "1 person in this room"). It wraps an `AvatarGroup size="sm"` of the first 4 participants (`tooltip={false}`) plus `AvatarGroupOverflow count={n-4}` when n > 4. Clicking it calls `onOpenParticipants`. It is hidden when n = 0 and below `sm`. The sync status is an `HStack` with `role="status"`, a `StatusDot`, and `Text type="supporting"` showing `syncLabel`, hidden below `md`. Variant map: synced→success, offline→warning, error→error, connecting/viewing→neutral.

- [ ] **Step 1: Write the failing verifier** `scripts/verify-room-header.ts`, modelled on `scripts/verify-workspace-shell.ts` (`renderToStaticMarkup` + `node:assert/strict`). Cases:
  - Six participants, owner, private, synced:
    - `(html.match(/<h1\b/g) ?? []).length === 1` and the h1 contains "Organic Chemistry"
    - `/Private/` matches
    - `/aria-label="6 people in this room"/` matches
    - `/\+2/` matches (overflow)
    - exactly 4 avatar initials render before the overflow
    - `/Live/` matches
    - no role Token for the owner
  - One participant, viewer, public, offline with `syncLabel` "Offline — edits stay on this device":
    - `/1 person in this room/` matches
    - `/Public/` and `/Viewer/` match
    - `/Offline — edits stay on this device/` matches
    - `/>Live</` does not match
  - Zero participants: `/people in this room/` does not match.
- [ ] **Step 2: Run** `npm run verify:room-header`. Expected: FAIL, cannot resolve `room-header`.
- [ ] **Step 3: Implement `RoomHeader`** in `src/components/collaboration/room-header.tsx` as specified above. Check props with `npx astryx component Heading|Token|AvatarGroup|StatusDot` before writing. Use only token utilities (`min-w-0`, `truncate`, `hidden sm:flex`).
- [ ] **Step 4: Run** `npm run verify:room-header`. Expected: exits 0.
- [ ] **Step 5: Wire into `CollaborativeRoom`.**
  - Replace the header `startContent`/`endContent` with `<RoomHeader … />` inside `QollabWorkspaceHeader`. Keep `label="Room controls"`.
  - `actions` holds the existing Present/Follow button unchanged. When `activeTool === "notes"`, it also holds an `IconButton` "Version history" with a `History` icon. Add `History` to `src/components/ui/icons.tsx` if it is missing, from Lucide like its neighbours. The `IconButton` keeps `aria-controls="version-history-sidebar"` and `aria-expanded={!isVersionHistoryCollapsed}` and toggles the same state. Owners also get the existing Manage button.
  - Remove the role `Text` fallback, which moved into RoomHeader.
  - Pass `participants`, `onOpenParticipants={() => setIsRoomControlsOpen(true)}`, `syncStatus={remoteStatus}`, and `syncLabel={remoteStatus === "synced" ? "Live" : remoteCopy[remoteStatus]}`.
  - Delete the notes sub-header `HStack` (h1 "Shared notes" + Version history button).
  - Delete the sidebar "Private room"/"Public room" `Text`.
  - Rename the dialog heading "Room controls" to "People and room". Keep the dialog content as is; it is the participants list that the presence control opens.
- [ ] **Step 6: Run** `npm run typecheck && npm run lint && npm run verify:room-header && npm run verify:workspace-shell`. Expected: all exit 0.
- [ ] **Step 7: Commit** `feat(room): single room header with presence and sync status`.

### Task 2: Full-width notes scroller, 760px document

**Files:**
- Modify: `src/components/collaboration/rich-text-editor.tsx` (editor attributes, line 461; `EditorContent` className, line 545)
- Modify: `src/components/collaboration/collaborative-room.tsx` (`handleNotesScroll`, lines 227–245; follow-scroll effect, lines 247–281)
- Modify: `scripts/verify-room-header.ts` (add source assertions)

**Interfaces:**
- Produces: `export const NOTES_SCROLL_REGION_CLASS = "editor-scroll-region";` from `rich-text-editor.tsx`.
- Consumes: nothing from Task 1.

Decisions:
- The `EditorContent` wrapper becomes the scroller: `${NOTES_SCROLL_REGION_CLASS} flex-1 min-h-0 overflow-y-auto overscroll-contain`. The ProseMirror element becomes `boardprep-editor w-full max-w-3xl mx-auto min-h-full p-5 md:p-8 bg-surface`. `max-w-3xl` is 768px, the Tailwind scale step nearest the 760px budget. Drop `h-full`, `overflow-*` and `max-w-5xl` from the ProseMirror classes.
- `handleNotesScroll` checks `target.classList.contains(NOTES_SCROLL_REGION_CLASS)`. The follow effect queries `` `.${NOTES_SCROLL_REGION_CLASS}` ``. The scroll-ratio maths stays as is.

- [ ] **Step 1: Add failing source assertions** to `scripts/verify-room-header.ts`. Read both files with `readFileSync`, then assert:
  - `collaborative-room.tsx` does not match `/querySelector<HTMLElement>\(\s*"\.boardprep-editor"/`
  - `collaborative-room.tsx` matches `/NOTES_SCROLL_REGION_CLASS/`
  - `rich-text-editor.tsx` does not match `/max-w-5xl/`
- [ ] **Step 2: Run** `npm run verify:room-header`. Expected: FAIL on the first assertion.
- [ ] **Step 3: Implement** the decisions above.
- [ ] **Step 4: Run** `npm run verify:room-header && npm run typecheck`. Expected: exit 0.
- [ ] **Step 5: Browser check** at 1440×900 on a room with long notes. Run `javascript_tool`:
  ```js
  const s = document.querySelector('.editor-scroll-region');
  const r = s.getBoundingClientRect();
  [s.scrollHeight > s.clientHeight, Math.round(r.right), Math.round(document.querySelector('#notes').getBoundingClientRect().right)]
  ```
  Expected: `[true, X, X]`, meaning the scroller's right edge equals the notes section's right edge. The ProseMirror width should be at most 768.
- [ ] **Step 6: Commit** `fix(notes): scroll the full canvas and cap the document at 768px`.

### Task 3: Toolbar and footer carry the right things

**Files:**
- Modify: `src/components/collaboration/rich-text-editor.tsx` (`EditorToolbar` `endContent`, lines 308–340; footer, lines 548–583; `RichTextEditorProps`)
- Modify: `src/components/collaboration/collaborative-room.tsx` (stop passing `syncLabel`/`syncStatus` to `RichTextEditor`)

**Interfaces:**
- Produces: `RichTextEditorProps` loses `syncLabel` and `syncStatus`. Sync now lives in `RoomHeader`.
- Produces: an internal `function EditorWordCount({ editor }: { editor: Editor }): React.ReactElement` that reads the count with `useEditorState` and renders `Text type="supporting"` "{n} words" (or "1 word").

Decisions:
- Toolbar `endContent` is removed. The toolbar holds formatting only.
- The editable footer has two parts. Left: the existing focus/undo grid, unchanged. Right: `<EditorWordCount editor={editor} />`. Delete "Changes sync automatically with your room."
- The read-only footer keeps "Ask the room owner for editor access to make changes." on the left and adds the word count on the right.
- The footer `className` drops its `!`-overrides (`bg-surface! p-2! px-4!`) where the `HStack` padding props already express them.

- [ ] **Step 1: Add failing assertions** to `scripts/verify-room-header.ts`, as source checks on `rich-text-editor.tsx`:
  - It does not match `/Changes sync automatically with your room\./`
  - It does not match `/syncLabel/`
  - It matches `/function EditorWordCount/`
- [ ] **Step 2: Run** `npm run verify:room-header`. Expected: FAIL.
- [ ] **Step 3: Implement** the decisions above. In the word count, singular is "1 word" and zero is "0 words".
- [ ] **Step 4: Run** `npm run verify:room-header && npm run typecheck && npm run lint`. Expected: exit 0.
- [ ] **Step 5: Commit** `refactor(notes): formatting-only toolbar, word count in footer`.

### Task 4: Sidebar overflow and full QA

**Files:**
- Modify: the element found in Step 1. Expected candidates: the footer `VStack` in `collaborative-room.tsx` (line 497) or `src/components/shell/qollab-side-navigation.tsx`.

- [ ] **Step 1: Find the overflowing element.** At 1440×900 on the room page, run:
  ```js
  [...document.querySelectorAll('nav[aria-label="Qollab workspace navigation"] *')]
    .filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible')
    .map(e => [e.className, e.scrollWidth, e.clientWidth])
  ```
  Then find the widest child of the reported element.
- [ ] **Step 2: Fix the root cause** on that child with `min-w-0`, `truncate` or `w-full`. Do not hide the overflow on the nav itself (`overflow-x-hidden`). Re-run the Step 1 snippet. Expected: `[]`.
- [ ] **Step 3: Run the full checks:**
  `npm run format:check && npm run lint && npm run typecheck && npm run theme:check && npm run verify:design-system && npm run verify:workspace-shell && npm run verify:buttons && npm run verify:room-header`.
  Expected: all exit 0. Fix any formatting with `npx prettier --write` on the touched files only.
- [ ] **Step 4: Browser QA** at 1440, 1024, 768, 390 and 320 wide. Use screenshots plus these checks:
  - The page has one `h1`, which is the room name.
  - `document.documentElement.scrollWidth <= innerWidth`.
  - The header does not wrap to two rows.
  - Present/Follow stays visible at 390 and 320.
  - The version-history toggle opens a panel (1440), a Dialog (1024/768) or a BottomSheet (390).
  - The presence control opens "People and room".
  - Switching to PDF, Whiteboard and AI keeps the header, and the version toggle disappears.
- [ ] **Step 5: Offline state.** In devtools, set the network to offline. Expected: the header shows the warning dot and "Offline — edits stay on this device", and the offline banner and "Retry now" still render. Turn the network back on.
- [ ] **Step 6: Presenter follow (Review Focus 1).** This needs two accounts, an editor presenting and a viewer following. If a second account is not available, record it as unverified in the report. Do not claim it passed.
- [ ] **Step 7: Commit** `fix(shell): remove room sidebar horizontal overflow`.

## Left to the builder

- Exact Tailwind visibility breakpoints for the header pieces, within the rules above.
- Whether the presence `ButtonControl` uses `size="sm"` or default. Use whichever keeps the 56px header on one row.

## Out of scope (seen, not changed)

- `window.confirm` in version restore. DESIGN.md prefers `AlertDialog`; this is a separate change.
- The long `[&_.viewer-collaboration-control]…!` override chain on the sidebar footer.
- Legacy hardcoded colours in `workspace-renderers.css` (`#302d28`, `#fcfaf6`).
- The default 11px `FontSize` mark.

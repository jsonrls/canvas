# Live Activities (Mentimeter-style) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a teacher-led "Live activities" room tool. A host (room owner or editor) builds question slides, presents one at a time, opens and closes voting, and reveals results. Everyone else in the room answers on the same screen, and results update live.

**Architecture:** Three backend-only Supabase tables (RLS on, no client grants). Every read and write goes through one authenticated route, `/api/rooms/[roomId]/live`. The route checks room membership with the user's cookie client, then uses the service-role client for live data, so answer keys and other students' raw answers never reach the browser. Clients poll the route (2 s while the tool is open, 5 s elsewhere in the room). Pure validation, scoring and aggregation live in `src/lib/live/activities.ts`, which is tested with a node `assert` verify script.

**Tech Stack:** Next.js 16 route handlers, Supabase (Postgres + service-role client), React 19, Astryx components, lucide icons via `src/components/ui/icons.tsx`.

**Spec:** Conversation decisions from 2026-11-24: teacher-led format (option 1), "just implement what Mentimeter works", built natively in Qollab rather than embedding Mentimeter (Mentimeter embeds can't take audience votes).

## Global Constraints

- Hosts are `owner` and `editor` room roles only. Viewers who were granted viewer collaboration still answer and never host.
- Question types: `poll` (multiple choice), `word_cloud`, `open_ended`, `scale` (1–5), `quiz` (multiple choice with one correct option, a time limit and a leaderboard).
- Prompt: 3–200 characters, trimmed. Poll/quiz options: 2–6, each 1–80 characters, trimmed, unique case-insensitively.
- Quiz time limit: 5–120 seconds, default 30.
- One response per participant per question; answers can't be changed.
- Word cloud: 1–3 words per response, each 1–25 characters, lowercased and trimmed. Open ended: 1–280 characters. Scale: integer 1–5.
- Quiz points: 0 if wrong or late; if correct, `500 + round(500 * max(0, 1 - elapsed / limit))` (500–1000).
- Answers are anonymous to other students. Only aggregated results are returned, plus leaderboard display names.
- The correct option goes only to hosts, or to everyone once the host shows results.
- A maximum of 50 questions per room.
- UI follows AGENTS.md: Astryx components, no raw `<div>`, token-backed utilities only.
- The migration file is written but not applied (the user applies it).

## Review Focus

- A quiz answer that arrives after the time limit must be rejected with 409, not scored as 0. Covered by `isAcceptingResponse` tests in Task 1.
- A host deletes the question that is being presented. The session must fall back to no current question, not error (`on delete set null`). Handled in Task 3, where the route treats a missing question as idle.
- A student submits twice, for example a double click or two tabs. The unique constraint gives a 409, and the UI shows the already-submitted state. Task 3 maps `23505` to 409.
- Word-cloud input with duplicate or empty words (`" , Cell, cell "`) must collapse to `["cell"]` and must not count twice. Covered in Task 1 tests.
- A student opening the tool before any question is presented sees a waiting state, not an empty error. Task 5's student view has an idle state.

---

### Task 1: Pure live-activity domain logic

**Files:**

- Create: `src/lib/live/activities.ts`
- Test: `scripts/verify-live-activities.ts`, plus `package.json` script `verify:live-activities` = `node --import tsx scripts/verify-live-activities.ts`

**Interfaces:**

- Produces:
  - `type LiveQuestionKind = "poll" | "word_cloud" | "open_ended" | "scale" | "quiz"`
  - `interface LiveQuestionDraft { kind; prompt: string; options: string[]; correctOption: number | null; timeLimitSeconds: number | null }`
  - `interface LiveQuestion extends LiveQuestionDraft { id: string; position: number }`
  - `type LiveResponseValue = { option: number } | { words: string[] } | { text: string } | { rating: number }`
  - `type LiveResults = { type: "choice"; counts: number[]; total: number } | { type: "words"; words: Array<{ text: string; count: number }>; total: number } | { type: "texts"; texts: string[]; total: number } | { type: "scale"; counts: number[]; average: number | null; total: number }`
  - `class LiveInputError extends Error`
  - `readQuestionDraft(input: unknown): LiveQuestionDraft`
  - `readResponseValue(question: LiveQuestionDraft, input: unknown): LiveResponseValue`
  - `isAcceptingResponse(question, session: { isAccepting: boolean; openedAt: string | null }, now: Date): boolean`
  - `quizDeadline(question, openedAt: string | null): string | null`
  - `scoreQuizResponse(question, value, openedAt: string, submittedAt: Date): number`
  - `summarizeResults(question, values: LiveResponseValue[]): LiveResults`
  - `rankLeaderboard(rows: Array<{ userId: string; name: string; points: number }>, currentUserId: string): { top: LeaderboardEntry[]; me: LeaderboardEntry | null }`, where `LeaderboardEntry = { rank: number; name: string; points: number; isMe: boolean }` and `top` holds 10 entries

- [ ] **Step 1: Write the failing verify script** with asserts for:
  - draft trimming and limits (prompt of 2 characters throws, 7 options throw, duplicate options throw)
  - non-choice kinds force `options: []` and `correctOption: null`
  - quiz without `correctOption` throws, and the time limit defaults to 30
  - response shapes per kind, and an option index out of range throws
  - word-cloud normalisation: `{ words: [" Cell", "cell", ""] }` gives `{ words: ["cell"] }`
  - scale 0 and 6 throw
  - scoring: correct at 0 s gives 1000, correct at the limit gives 500, wrong gives 0
  - accepting: a quiz past the deadline gives false, and a poll with no deadline stays open while `isAccepting`
  - summaries: choice counts, word counts sorted by count then text and capped at 40, texts capped at the 50 newest, scale average to one decimal and `null` when empty
  - leaderboard: ties share a rank, the top 10 are returned, and `me` is set when the user is outside the top 10
- [ ] **Step 2: Run** `npm run verify:live-activities`. Expected: it fails because the module is missing.
- [ ] **Step 3: Implement `src/lib/live/activities.ts`.**
- [ ] **Step 4: Run** `npm run verify:live-activities`. Expected: `Live activity checks passed.`
- [ ] **Step 5: Commit** `feat(live): domain validation, scoring and results`.

### Task 2: Database migration

**Files:**

- Create: `supabase/migrations/20261124090000_add_live_activities.sql`

Tables:

- **`live_questions`**: `id`, `room_id → rooms cascade`, `created_by → auth.users cascade`, `kind`, `prompt`, `options jsonb`, `correct_option smallint`, `time_limit_seconds smallint`, `position int`, `created_at`. Check constraints mirror the Global Constraints.
- **`live_sessions`**: `room_id` primary key `→ rooms cascade`, `question_id → live_questions on delete set null`, `is_accepting bool`, `show_results bool`, `opened_at`, `updated_at`.
- **`live_responses`**: `id`, `question_id → live_questions cascade`, `room_id → rooms cascade`, `user_id → auth.users cascade`, `value jsonb`, `points int`, `submitted_at`, `unique (question_id, user_id)`.

Enable RLS on all three tables with no policies, and `revoke all … from public, anon, authenticated`. Add indexes on `(room_id, position)` and `(room_id, user_id)`, plus table comments that state service-role-only access.

- [ ] **Step 1: Write the migration.**
- [ ] **Step 2: Run** `npm run verify:workspace`. Expected: passes. The migration is applied manually by the user.
- [ ] **Step 3: Commit** `feat(live): add live activity tables`.

### Task 3: Live route

**Files:**

- Create: `src/lib/live/repository.ts` (service-role reads and writes, mapping rows to the Task 1 types)
- Create: `src/app/api/rooms/[roomId]/live/route.ts` (`GET`, `POST`)

**Interfaces:**

- Consumes: `getRoomMemberAccess`, `getAuthenticatedContext`, `createServiceRoleClient`, and the Task 1 helpers.
- Produces the `GET` payload `LiveSnapshot`, exported from `src/lib/live/activities.ts`:
  `{ canHost: boolean; questions: LiveQuestion[] (hosts only, otherwise []); session: { questionId: string | null; isAccepting: boolean; showResults: boolean; closesAt: string | null }; current: LiveQuestion | null (correctOption null unless host or showResults); myResponse: LiveResponseValue | null; myPoints: number | null; responseCount: number; results: LiveResults | null (host always, others only when showResults); leaderboard: { top; me } | null (when showResults and current is quiz) }`
- `POST` body `{ action, ... }`. Host actions:
  - `create_question` with `{ draft }`
  - `delete_question` with `{ questionId }`
  - `present` with `{ questionId | null }`. Selecting a question closes voting and hides results.
  - `set_accepting` with `{ value }`. Opening sets `opened_at = now()`.
  - `set_results` with `{ value }`
  - `reset_results`, which deletes the room's responses

  Any member can send `respond` with `{ questionId, value }`. Each POST returns the fresh `LiveSnapshot`.

- Status codes: 401 not signed in, 404 not a member, 403 host action by a non-host, 400 `LiveInputError`, 409 for a closed question or duplicate answer, 502 otherwise. Headers: `Cache-Control: private, no-store`.
- Leaderboard names come from `user_profiles.display_name`, read with the service-role client. The fallback is "Participant".

- [ ] **Step 1: Implement the repository and route** following `saved-study-guides/route.ts` for error mapping and headers.
- [ ] **Step 2: Run** `npm run typecheck` and `npm run lint`. Expected: clean.
- [ ] **Step 3: Commit** `feat(live): live activities API`.

### Task 4: Polling hook

**Files:**

- Create: `src/components/collaboration/live/use-live-activities.ts`

**Interfaces:**

- `useLiveActivities({ roomSlug: string; isActive: boolean }): { snapshot: LiveSnapshot | null; error: string | null; isMutating: boolean; act(body: LiveAction): Promise<boolean> }`
- Polls every 2000 ms when `isActive` and every 5000 ms otherwise. It pauses while `document.hidden` and ignores out-of-order responses.

- [ ] **Step 1: Implement**, then run `npm run typecheck`.
- [ ] **Step 2: Commit** together with Task 5.

### Task 5: Live tool UI and room wiring

**Files:**

- Create: `src/components/collaboration/live/live-activities-tool.tsx` (the host stage, question list and student stage)
- Create: `src/components/collaboration/live/live-question-form.tsx`
- Create: `src/components/collaboration/live/live-results.tsx` (choice bars with `ProgressBar`, a word cloud with `Text` sized by count, open texts as a `List`, scale distribution, leaderboard)
- Modify: `src/components/ui/icons.tsx` (add `ChartColumnBig`, `Trophy`, `Play`, `EyeOff`, `RotateCcw`)
- Modify: `src/components/collaboration/collaborative-room.tsx`:
  - `WorkspaceTool` gains `"live"`
  - add a sidebar item "Live activities", a tool label and a mobile selector entry
  - render the tool
  - add a student banner "A live question is open." with an "Answer now" button when the session is accepting and the user isn't on the Live tab
- Modify: `src/hooks/use-room-presentation.ts` (`PresentedWorkspace` adds `"live"`, so followers move with the host)

Behaviour:

- **Host stage:**
  - a question list with present and delete
  - an "Add question" form
  - controls for Open voting / Close voting, Show results / Hide results, Previous / Next, and Reset results (with a confirm dialog)
  - the response count, and a countdown for quizzes
- **Student stage:**
  - an idle state ("Waiting for the host to start a question")
  - the answer form while accepting
  - "Answer sent" after submitting
  - "Voting closed" once closed
  - results when shown, plus their quiz points and the leaderboard

- [ ] **Step 1: Implement** and self-check against the AGENTS.md rules (no `<div>`, no `style={{}}`, no arbitrary values).
- [ ] **Step 2: Run** `npm run typecheck`, `npm run lint`, `npm run format:check` and `npm run verify:live-activities`. Expected: all pass.
- [ ] **Step 3: Verify in the browser** that the Live tab renders for a host, and that the student banner and idle state render. The full answer flow needs the migration applied.
- [ ] **Step 4: Commit** `feat(live): live activities room tool`.

## Version 2 (2026-11-25): the other Mentimeter types

Added: multi-statement scales, ranking, 100 points, 2×2 grid, guess the number,
quick form, pin on image and live Q&A.

- Migration `20261125090000_add_live_question_types.sql`: `settings` and
  `image_path` on `live_questions`, `live_qa_items`, `live_qa_votes`, and the
  private `live-images` bucket. No client grants.
- A secret answer (quiz, guess the number) is stripped for students until
  results are shown. Such a question runs once per reset.
- Quick form answers go to hosts only, whatever `show_results` says.
- Q&A never sends authors or voters. Hosts can approve, mark answered and hide.
  Ten questions per person per slide; no votes for your own.
- Pin images are shrunk to JPEG in the browser (2 MB), checked on the server,
  and served by `/live/image`. Students only get the presented one.

## Excel export (2026-11-25)

Hosts download every question's results as one `.xlsx` from `/live/export`:
a summary, the quiz leaderboard, and a sheet per question. Answers carry no
names and are sorted, so rows cannot be matched across sheets. Text cells are
inline strings, never formulas. `src/lib/xlsx.ts` writes the file without a
dependency.

## Next: visuals

Proposed in [feature-live-visuals-1.md](feature-live-visuals-1.md).

## Not in this version

Text, image and video slides, correct areas on pin images, self-paced forms,
PDF export, AI-generated questions, editing or reordering questions, and
push updates (polling now; the `shortcut` comment marks the upgrade).

## Reordering (2026-11-25)

`reorder_questions` takes every question id in the room, in the new order, from
hosts only. A list that does not name each question exactly once is refused, so
a question added or deleted meanwhile cannot be lost. Only rows whose place
changed are written; the writes are not one transaction, so after a failure the
list shows the order that was saved.

## Breakout rooms (2026-11-25)

The user asked to "add Live Activities in Breakout rooms also". Each breakout
has its own activities, as it has its own notes, PDF and whiteboard.

- The room's owner and editors host; joined viewers answer.
- Migration `20261125120000_add_breakout_live_activities.sql` adds five
  `breakout_live_*` tables. Separate tables, not a column on `live_*`: a main
  room works before and after the migration, and no main-room query can return
  a breakout row. Until it is applied, the tool in a breakout says it is
  unavailable.
- `breakouts/[code]/live`, `/export` and `/image` re-export the main handlers.
- Checked by `npm run verify:live-breakouts`.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { getBreakoutMemberAccess } from "../src/lib/breakout-rooms/repository";
import { readQuestionDraft } from "../src/lib/live/activities";
import { liveErrorResponse, resolveLiveAccess } from "../src/lib/live/http";
import {
  askLiveQuestion,
  buildLiveSnapshot,
  createLiveQuestion,
  deleteLiveQuestion,
  listLiveImageFolders,
  LiveConflictError,
  loadLiveExport,
  loadLiveImage,
  LiveNotFoundError,
  presentLiveQuestion,
  removeLiveImages,
  reorderLiveQuestions,
  resetLiveResults,
  setLiveAccepting,
  setLiveLayout,
  setLiveQaStatus,
  setLiveResultsVisible,
  submitLiveResponse,
  voteLiveQuestion,
} from "../src/lib/live/repository";
import {
  breakoutLiveScope,
  liveApiPath,
  roomLiveScope,
  type LiveScope,
} from "../src/lib/live/scope";
import { RoomDomainError } from "../src/lib/rooms/repository";
import { MemorySupabase } from "./fixtures/memory-supabase";

const ROOM = "11111111-1111-4111-8111-111111111111";
const BREAKOUT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BREAKOUT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const OTHER_ROOM = "22222222-2222-4222-8222-222222222222";
const SLUG = "biology-101";
const CODE_A = "AAAA1111";
const CODE_B = "BBBB2222";
const FOREIGN_CODE = "CCCC3333";

const db = new MemorySupabase();
db.seed(
  "rooms",
  { id: ROOM, slug: SLUG, viewer_can_collaborate: true },
  { id: OTHER_ROOM, slug: "chemistry-1", viewer_can_collaborate: false },
);
db.seed(
  "room_members",
  { room_id: ROOM, user_id: "owner", role: "owner" },
  { room_id: ROOM, user_id: "editor", role: "editor" },
  { room_id: ROOM, user_id: "in-a", role: "viewer" },
  { room_id: ROOM, user_id: "in-b", role: "viewer" },
  { room_id: ROOM, user_id: "in-none", role: "viewer" },
  { room_id: OTHER_ROOM, user_id: "outsider", role: "owner" },
);
db.seed(
  "breakout_rooms",
  { id: BREAKOUT_A, room_id: ROOM, code: CODE_A },
  { id: BREAKOUT_B, room_id: ROOM, code: CODE_B },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    room_id: OTHER_ROOM,
    code: FOREIGN_CODE,
  },
);
db.seed(
  "breakout_room_members",
  { breakout_room_id: BREAKOUT_A, user_id: "in-a" },
  { breakout_room_id: BREAKOUT_B, user_id: "in-b" },
  // Removed from the room later; the stale join row must not let them in.
  { breakout_room_id: BREAKOUT_A, user_id: "removed" },
);

const admin = db.client;
const MAIN = roomLiveScope(ROOM);
const A = breakoutLiveScope(BREAKOUT_A);
const B = breakoutLiveScope(BREAKOUT_B);
const access = (userId: string, code?: string, roomId = SLUG) =>
  resolveLiveAccess(admin, userId, { roomId, code });

async function main(): Promise<void> {
  // Paths: the breakout route is its own path, and codes are encoded.
  assert.equal(liveApiPath(SLUG), "/api/rooms/biology-101/live");
  assert.equal(
    liveApiPath(SLUG, CODE_A),
    "/api/rooms/biology-101/breakouts/AAAA1111/live",
  );
  assert.equal(
    liveApiPath("a/b", "c/d"),
    "/api/rooms/a%2Fb/breakouts/c%2Fd/live",
  );

  // Main and breakout share no table.
  const mainTables: string[] = Object.values(MAIN.tables);
  assert.ok(
    Object.values(A.tables).every((table) => !mainTables.includes(table)),
  );

  // Hosts: the room's owner and editors, in every breakout of that room.
  for (const userId of ["owner", "editor"]) {
    assert.deepEqual(await access(userId, CODE_A), {
      scope: A,
      userId,
      canHost: true,
    });
    assert.equal((await access(userId, CODE_B)).canHost, true);
    assert.deepEqual((await access(userId)).scope, MAIN);
  }
  // A joined viewer answers and never hosts, although this room has viewer
  // collaboration turned on.
  assert.deepEqual(await access("in-a", CODE_A), {
    scope: A,
    userId: "in-a",
    canHost: false,
  });
  assert.equal((await access("in-a")).canHost, false);
  // Codes are not case-sensitive, as on the breakout page.
  assert.deepEqual((await access("in-a", "aaaa1111")).scope, A);

  // Everyone else is refused, with the same answer as an unknown room.
  const refused: [string, string, string?][] = [
    ["in-a", CODE_B],
    ["in-none", CODE_A],
    ["removed", CODE_A],
    ["outsider", CODE_A],
    ["stranger", CODE_A],
    ["owner", FOREIGN_CODE],
    ["owner", "ZZZZ9999"],
    ["owner", "bad"],
    ["owner", ""],
    ["outsider", CODE_A, "chemistry-1"],
    ["owner", CODE_A, "no-such-room"],
  ];
  for (const [userId, code, roomId] of refused) {
    await assert.rejects(access(userId, code, roomId), RoomDomainError);
  }
  assert.equal(liveErrorResponse(new RoomDomainError("no")).status, 404);
  // Asking does not join anyone.
  assert.equal(db.tables.get("breakout_room_members")!.length, 3);
  await assert.rejects(
    getBreakoutMemberAccess(admin, SLUG, CODE_A, "in-none"),
    RoomDomainError,
  );

  // Isolation: the same full run in A and in the main room, then look across.
  const poll = readQuestionDraft({
    kind: "poll",
    prompt: "Pick one",
    options: ["A", "B"],
  });
  const quiz = readQuestionDraft({
    kind: "quiz",
    prompt: "2 + 2?",
    options: ["3", "4"],
    correctOption: 1,
  });
  const qa = readQuestionDraft({ kind: "qa", prompt: "Ask away" });
  const pin = readQuestionDraft({ kind: "pin", prompt: "Where is it?" });
  const jpeg = new File(
    [new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0xff, 0xd9])],
    "x.jpg",
    { type: "image/jpeg" },
  );

  const run = async (scope: LiveScope): Promise<void> => {
    await createLiveQuestion(admin, scope, "owner", poll, null);
    await createLiveQuestion(admin, scope, "owner", quiz, null);
    await createLiveQuestion(admin, scope, "owner", qa, null);
    await createLiveQuestion(admin, scope, "owner", pin, jpeg);
  };
  const ids = async (scope: LiveScope): Promise<string[]> =>
    (
      await buildLiveSnapshot(admin, { scope, userId: "owner", canHost: true })
    ).questions.map((question) => question.id);
  const snap = (scope: LiveScope, userId = "in-a", canHost = false) =>
    buildLiveSnapshot(admin, { scope, userId, canHost });

  db.touched.clear();
  await run(A);
  assert.ok(
    mainTables.every((table) => !db.touched.has(table)),
    "a breakout run touches no main-room table",
  );
  assert.equal((await ids(A)).length, 4);
  assert.deepEqual(await ids(B), []);
  assert.deepEqual(await ids(MAIN), []);
  await run(MAIN);
  db.touched.clear();
  const [mainPoll, , , mainPin] = await ids(MAIN);
  assert.ok(
    Object.values(A.tables).every((table) => !db.touched.has(table)),
    "the main room works without the breakout tables",
  );
  const [pollA, quizA, qaA, pinA] = await ids(A);

  // A question id from one scope is not found in another.
  for (const scope of [B, MAIN]) {
    const missing = [
      presentLiveQuestion(admin, scope, pollA),
      deleteLiveQuestion(admin, scope, pollA),
      setLiveLayout(admin, scope, pollA, "bars"),
      loadLiveImage(admin, { scope, questionId: pinA, canHost: true }),
      submitLiveResponse(admin, {
        scope,
        userId: "in-b",
        questionId: pollA,
        value: { option: 0 },
      }),
    ];
    for (const attempt of missing) {
      await assert.rejects(attempt, LiveNotFoundError);
    }
    await assert.rejects(
      reorderLiveQuestions(admin, scope, [qaA, quizA, pollA, pinA]),
      LiveConflictError,
    );
  }
  await assert.rejects(
    presentLiveQuestion(admin, A, mainPoll),
    LiveNotFoundError,
  );
  await reorderLiveQuestions(admin, A, [qaA, quizA, pollA, pinA]);
  assert.deepEqual(await ids(A), [qaA, quizA, pollA, pinA]);

  // Answers, results and the leaderboard stay inside.
  await presentLiveQuestion(admin, A, quizA);
  await setLiveAccepting(admin, A, true);
  assert.equal((await snap(B)).session.questionId, null);
  assert.equal((await snap(MAIN)).session.questionId, null);
  await assert.rejects(
    setLiveAccepting(admin, B, true),
    new LiveConflictError("Present a question first."),
  );
  assert.equal((await snap(A)).current?.correctOption, null);
  await submitLiveResponse(admin, {
    scope: A,
    userId: "in-a",
    questionId: quizA,
    value: { option: 1 },
  });
  await assert.rejects(
    submitLiveResponse(admin, {
      scope: A,
      userId: "in-a",
      questionId: quizA,
      value: { option: 0 },
    }),
    LiveConflictError,
  );
  await setLiveResultsVisible(admin, A, true);
  assert.equal((await snap(A)).leaderboard?.top.length, 1);
  assert.equal((await snap(MAIN)).leaderboard, null);

  // Students get the picture only while it is presented.
  await assert.rejects(
    loadLiveImage(admin, { scope: A, questionId: pinA, canHost: false }),
    LiveNotFoundError,
  );
  await presentLiveQuestion(admin, A, pinA);
  assert.ok(
    await loadLiveImage(admin, { scope: A, questionId: pinA, canHost: false }),
  );

  // Q&A items are reachable only from their own breakout.
  await presentLiveQuestion(admin, A, qaA);
  await setLiveAccepting(admin, A, true);
  await askLiveQuestion(admin, {
    scope: A,
    userId: "in-a",
    questionId: qaA,
    text: "Why?",
  });
  const item = (await snap(A)).qa?.[0];
  assert.ok(item);
  const vote = (scope: LiveScope) =>
    voteLiveQuestion(admin, {
      scope,
      userId: "editor",
      itemId: item.id,
      value: true,
    });
  for (const scope of [B, MAIN]) {
    await assert.rejects(vote(scope), LiveNotFoundError);
    await assert.rejects(
      setLiveQaStatus(admin, scope, item.id, "hidden"),
      LiveNotFoundError,
    );
  }
  await vote(A);
  assert.equal((await snap(A)).qa?.[0]?.votes, 1);

  // Export covers one scope; a reset elsewhere deletes nothing here.
  assert.equal((await loadLiveExport(admin, B, "owner")).questions.length, 0);
  await resetLiveResults(admin, MAIN);
  await resetLiveResults(admin, B);
  const exported = await loadLiveExport(admin, A, "owner");
  assert.equal(exported.responses.get(quizA)?.length, 1);
  assert.equal(exported.qa.get(qaA)?.length, 1);
  await resetLiveResults(admin, A);
  assert.equal((await loadLiveExport(admin, A, "owner")).responses.size, 0);

  // Images live in the scope's own folder and all go with the room.
  assert.deepEqual(
    [...db.files.keys()].map((path) => path.split("/")[0]).sort(),
    [ROOM, BREAKOUT_A].sort(),
  );
  const folders = await listLiveImageFolders(admin, ROOM);
  assert.deepEqual(folders, [ROOM, BREAKOUT_A, BREAKOUT_B]);
  await deleteLiveQuestion(admin, A, pinA);
  assert.ok(
    await loadLiveImage(admin, {
      scope: MAIN,
      questionId: mainPin,
      canHost: true,
    }),
  );
  await removeLiveImages(admin, folders);
  assert.equal(db.files.size, 0);

  // Every live query filters by scope, and every table is closed to clients.
  const repository = readFileSync("src/lib/live/repository.ts", "utf8");
  assert.doesNotMatch(repository, /\.from\("live_/);
  const migration = readFileSync(
    "supabase/migrations/20261125120000_add_breakout_live_activities.sql",
    "utf8",
  );
  for (const table of Object.values(A.tables)) {
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
    assert.match(
      migration,
      new RegExp(
        `revoke all on table public\\.${table}\\s+from public, anon, authenticated`,
      ),
    );
  }
  assert.doesNotMatch(
    migration,
    /grant |create policy|alter table public\.live_/,
  );

  console.log("Breakout live activity checks passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

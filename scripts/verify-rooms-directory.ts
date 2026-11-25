import assert from "node:assert/strict";

import {
  formatRoomDate,
  summarizeJoinedRooms,
} from "../src/lib/rooms/directory-summary";

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
assert.equal(formatRoomDate("2026-11-08T23:30:00-05:00"), "Nov 9");
assert.equal(formatRoomDate("nope"), null);

console.log("Room directory summary checks passed.");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  RoomHeader,
  type RoomHeaderProps,
} from "../src/components/collaboration/room-header";

const names = [
  "Ada Lovelace",
  "Bo Chen",
  "Cy Dunn",
  "Di Evans",
  "Ed Fox",
  "Fay Gray",
];
const people = (n: number) =>
  names.slice(0, n).map((name, i) => ({ clientId: i + 1, name }));
const base: RoomHeaderProps = {
  roomName: "Organic Chemistry",
  roomIconUrl: null,
  isPublic: false,
  role: "owner",
  toolLabel: "Shared notes",
  participants: people(6),
  onOpenParticipants: () => {},
  syncStatus: "synced",
  syncLabel: "Live",
  actions: null,
};
const render = (p: Partial<RoomHeaderProps>) =>
  renderToStaticMarkup(h(RoomHeader, { ...base, ...p }));

const owner = render({});
assert.equal((owner.match(/<h1\b/g) ?? []).length, 1, "exactly one h1");
assert.match(owner, /<h1\b[^>]*>[\s\S]*Organic Chemistry[\s\S]*<\/h1>/);
assert.match(owner, /Private/);
assert.match(owner, /aria-label="6 people in this room"/);
assert.match(owner, /\+2/);
const group = owner.slice(owner.indexOf('aria-label="6 people in this room"'));
const beforeOverflow = group.slice(0, group.indexOf("+2"));
const initials = names.slice(0, 4).map((n) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join(""),
);
for (const i of initials)
  assert.match(beforeOverflow, new RegExp(`>${i}<`), `initials ${i}`);
for (const n of names.slice(4)) {
  const i = n
    .split(" ")
    .map((w) => w[0])
    .join("");
  assert.doesNotMatch(beforeOverflow, new RegExp(`>${i}<`), `${i} hidden`);
}
assert.match(owner, /Live/);
assert.doesNotMatch(owner, /Editor|Viewer/);

const viewer = render({
  participants: people(1),
  isPublic: true,
  role: "viewer",
  syncStatus: "offline",
  syncLabel: "Offline — edits stay on this device",
});
assert.match(viewer, /1 person in this room/);
assert.match(viewer, /Public/);
assert.match(viewer, /Viewer/);
assert.match(viewer, /Offline — edits stay on this device/);
assert.doesNotMatch(viewer, />Live</);

assert.doesNotMatch(
  render({ participants: [] }),
  /people in this room|person in this room/,
);
const roomSource = readFileSync(
  "src/components/collaboration/collaborative-room.tsx",
  "utf8",
);
const editorSource = readFileSync(
  "src/components/collaboration/rich-text-editor.tsx",
  "utf8",
);
assert.doesNotMatch(
  roomSource,
  /querySelector<HTMLElement>\(\s*"\.boardprep-editor"/,
  "follow-scroll targets the scroller, not the editor",
);
assert.match(roomSource, /NOTES_SCROLL_REGION_CLASS/);
assert.doesNotMatch(editorSource, /max-w-5xl/, "document capped at max-w-3xl");
assert.doesNotMatch(
  editorSource,
  /Changes sync automatically with your room\./,
);
assert.doesNotMatch(editorSource, /syncLabel/);
assert.match(editorSource, /function EditorWordCount/);
assert.doesNotMatch(owner, /md:flex/, "token and sync status hide below lg");
assert.equal(
  (owner.match(/lg:flex/g) ?? []).length,
  2,
  "token + sync use lg:flex",
);
assert.match(
  owner,
  /<[^>]*role="status"[^>]*lg:flex|<[^>]*lg:flex[^>]*role="status"/,
);
assert.match(roomSource, /useMediaQuery\(\s*"\(max-width: 639px\)"/);
assert.match(roomSource, /isIconOnly/);
assert.ok(
  (roomSource.match(/followAccessibleLabel/g) ?? []).length >= 2,
  "follow accessible label defined and used",
);
console.log("room header verified");

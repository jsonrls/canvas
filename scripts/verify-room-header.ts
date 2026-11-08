import assert from "node:assert/strict";
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
console.log("room header verified");

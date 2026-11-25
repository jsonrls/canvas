import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  RoomHeader,
  type RoomHeaderProps,
} from "../src/components/collaboration/room-header";

const base: RoomHeaderProps = {
  roomName: "Organic Chemistry",
  roomIconUrl: null,
  isPublic: false,
  role: "owner",
  toolLabel: "Shared notes",
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
// Presence lives in the collapsed sidebar's People dialog, not the header.
assert.doesNotMatch(owner, /people in this room|person in this room/);
assert.doesNotMatch(owner, /astryx-avatar-group/);
assert.match(owner, /Live/);
assert.doesNotMatch(owner, /Editor|Viewer/);

const viewer = render({
  isPublic: true,
  role: "viewer",
  syncStatus: "offline",
  syncLabel: "Offline — edits stay on this device",
});
assert.match(viewer, /Public/);
assert.match(viewer, /Viewer/);
assert.match(viewer, /Offline — edits stay on this device/);
assert.doesNotMatch(viewer, />Live</);

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
assert.match(
  owner,
  /<[^>]*aria-label="Organic Chemistry"[^>]*aria-hidden="true"[^>]*>/,
  "room avatar is aria-hidden",
);
assert.match(
  owner,
  /<[^>]*(astryx-statusdot[^>]*aria-hidden="true"|aria-hidden="true"[^>]*astryx-statusdot)/,
  "sync StatusDot is aria-hidden",
);
assert.match(roomSource, /tooltip="Version history"/);
console.log("room header verified");

import type { RoomSummary } from "@/lib/rooms/repository";

// UTC keeps the server render and the browser on the same day.
const ROOM_DATE_FORMAT = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/** "Nov 8", or null when the stored value is not a date. */
export function formatRoomDate(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : ROOM_DATE_FORMAT.format(date);
}

/** The sentence under the directory title. Expects rooms newest first, as the repository returns them. */
export function summarizeJoinedRooms(
  rooms: Pick<RoomSummary, "name" | "updatedAt">[],
): string {
  const [latest] = rooms;
  if (!latest) {
    return "You haven’t joined a room yet. Create one, or join a room that is open to everyone.";
  }

  const count = `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"} joined.`;
  const date = formatRoomDate(latest.updatedAt);
  if (!date) return count;

  return rooms.length === 1
    ? `${count} ${latest.name} was updated on ${date}.`
    : `${count} ${latest.name} was updated most recently, on ${date}.`;
}

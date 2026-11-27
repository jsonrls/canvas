/** Where live activities are stored. Every live query must filter by a scope. */
export interface LiveScope {
  id: string;
  column: "room_id" | "breakout_room_id";
  tables: {
    questions: string;
    sessions: string;
    responses: string;
    qaItems: string;
    qaVotes: string;
    /** Guests without an account; null where only members take part. */
    guests: string | null;
  };
}

export function roomLiveScope(roomId: string): LiveScope {
  return {
    id: roomId,
    column: "room_id",
    tables: {
      questions: "live_questions",
      sessions: "live_sessions",
      responses: "live_responses",
      qaItems: "live_qa_items",
      qaVotes: "live_qa_votes",
      guests: "live_guests",
    },
  };
}

export function breakoutLiveScope(breakoutRoomId: string): LiveScope {
  return {
    id: breakoutRoomId,
    column: "breakout_room_id",
    tables: {
      questions: "breakout_live_questions",
      sessions: "breakout_live_sessions",
      responses: "breakout_live_responses",
      qaItems: "breakout_live_qa_items",
      qaVotes: "breakout_live_qa_votes",
      guests: null,
    },
  };
}

/** The live route of a main room, or of one of its breakouts. */
export function liveApiPath(roomSlug: string, breakoutCode?: string): string {
  const room = `/api/rooms/${encodeURIComponent(roomSlug)}`;
  return breakoutCode
    ? `${room}/breakouts/${encodeURIComponent(breakoutCode)}/live`
    : `${room}/live`;
}

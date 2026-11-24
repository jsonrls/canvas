"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveAction, LiveSnapshot } from "@/lib/live/activities";

const ACTIVE_POLL_MS = 2_000;
const BACKGROUND_POLL_MS = 5_000;

interface UseLiveActivitiesOptions {
  roomSlug: string;
  isActive: boolean;
}

export interface LiveActivitiesState {
  snapshot: LiveSnapshot | null;
  error: string | null;
  isMutating: boolean;
  act(body: LiveAction): Promise<boolean>;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === "string") return body.error;
  } catch {
    // Use the generic message below.
  }
  return "Live activities are temporarily unavailable.";
}

/**
 * Keeps the room's live-activity snapshot fresh.
 * shortcut: polls the live route; switch to a push nudge over the presence
 * socket if rooms grow past classroom size.
 */
export function useLiveActivities({
  roomSlug,
  isActive,
}: UseLiveActivitiesOptions): LiveActivitiesState {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  // Responses can arrive out of order; only the newest request may win.
  const requestSequence = useRef(0);
  const endpoint = `/api/rooms/${encodeURIComponent(roomSlug)}/live`;

  const apply = useCallback(
    async (sequence: number, response: Response): Promise<boolean> => {
      if (!response.ok) {
        const message = await readError(response);
        if (sequence === requestSequence.current) setError(message);
        return false;
      }
      const next = (await response.json()) as LiveSnapshot;
      if (sequence === requestSequence.current) {
        setSnapshot(next);
        setError(null);
      }
      return true;
    },
    [],
  );

  const refresh = useCallback(async (): Promise<void> => {
    const sequence = ++requestSequence.current;
    try {
      await apply(sequence, await fetch(endpoint, { cache: "no-store" }));
    } catch {
      if (sequence === requestSequence.current) {
        setError("You appear to be offline. Retrying…");
      }
    }
  }, [apply, endpoint]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isStopped = false;
    const interval = isActive ? ACTIVE_POLL_MS : BACKGROUND_POLL_MS;

    const tick = async (): Promise<void> => {
      if (!document.hidden) await refresh();
      if (!isStopped) timer = setTimeout(tick, interval);
    };
    void tick();

    return () => {
      isStopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [isActive, refresh]);

  const act = useCallback(
    async (body: LiveAction): Promise<boolean> => {
      const sequence = ++requestSequence.current;
      setIsMutating(true);
      try {
        return await apply(
          sequence,
          await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
        );
      } catch {
        setError("The change could not be sent. Check your connection.");
        return false;
      } finally {
        setIsMutating(false);
      }
    },
    [apply, endpoint],
  );

  return { snapshot, error, isMutating, act };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveAction, LiveSnapshot } from "@/lib/live/activities";
import { liveApiPath } from "@/lib/live/scope";

const ACTIVE_POLL_MS = 2_000;
const BACKGROUND_POLL_MS = 5_000;

interface UseLiveActivitiesOptions {
  roomSlug: string;
  /** Set inside a breakout, whose activities are its own. */
  breakoutCode?: string;
  isActive: boolean;
}

export interface LiveActivitiesState {
  snapshot: LiveSnapshot | null;
  error: string | null;
  isMutating: boolean;
  act(body: LiveAction, image?: File): Promise<boolean>;
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
 * Keeps the room's or breakout's live-activity snapshot fresh.
 * shortcut: polls the live route; switch to a push nudge over the presence
 * socket if rooms grow past classroom size.
 */
export function useLiveActivities({
  roomSlug,
  breakoutCode,
  isActive,
}: UseLiveActivitiesOptions): LiveActivitiesState {
  const [snapshot, setSnapshot] = useState<LiveSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Kept apart so the next poll does not wipe why a change failed.
  const [actionError, setActionError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const isMutatingRef = useRef(false);
  // Responses can arrive out of order; only the newest request may win.
  const requestSequence = useRef(0);
  const endpoint = liveApiPath(roomSlug, breakoutCode);

  const apply = useCallback(
    async (
      sequence: number,
      response: Response,
      onError: (message: string) => void,
    ): Promise<boolean> => {
      if (!response.ok) {
        const message = await readError(response);
        if (sequence === requestSequence.current) onError(message);
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
      await apply(
        sequence,
        await fetch(endpoint, { cache: "no-store" }),
        setError,
      );
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
      if (!document.hidden && !isMutatingRef.current) await refresh();
      if (!isStopped) timer = setTimeout(tick, interval);
    };
    void tick();

    return () => {
      isStopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [isActive, refresh]);

  const act = useCallback(
    async (body: LiveAction, image?: File): Promise<boolean> => {
      const sequence = ++requestSequence.current;
      let payload: BodyInit = JSON.stringify(body);
      if (image) {
        payload = new FormData();
        payload.set("payload", JSON.stringify(body));
        payload.set("image", image);
      }
      setActionError(null);
      setIsMutating(true);
      isMutatingRef.current = true;
      try {
        return await apply(
          sequence,
          await fetch(endpoint, {
            method: "POST",
            headers: image ? undefined : { "Content-Type": "application/json" },
            body: payload,
          }),
          setActionError,
        );
      } catch {
        setActionError("The change could not be sent. Check your connection.");
        return false;
      } finally {
        isMutatingRef.current = false;
        setIsMutating(false);
      }
    },
    [apply, endpoint],
  );

  return { snapshot, error: actionError ?? error, isMutating, act };
}

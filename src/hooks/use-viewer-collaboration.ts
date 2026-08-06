"use client";

import { useCallback, useEffect, useState } from "react";

import type { RoomRole } from "@/lib/rooms/repository";

interface UseViewerCollaborationOptions {
  initialEnabled: boolean;
  role: RoomRole;
  roomSlug: string;
}

interface UseViewerCollaborationResult {
  setViewerCanCollaborate: (enabled: boolean) => void;
  viewerCanCollaborate: boolean;
}

const REFRESH_INTERVAL_MS = 4_000;

export function useViewerCollaboration({
  initialEnabled,
  role,
  roomSlug,
}: UseViewerCollaborationOptions): UseViewerCollaborationResult {
  const [viewerCanCollaborate, setViewerCanCollaborate] =
    useState(initialEnabled);

  const refresh = useCallback(async (): Promise<void> => {
    if (role !== "viewer") return;

    try {
      const response = await fetch(
        `/api/rooms/${encodeURIComponent(roomSlug)}/viewer-collaboration`,
        {
          cache: "no-store",
          credentials: "same-origin",
        },
      );

      if (!response.ok) return;

      const payload = (await response.json()) as { enabled?: unknown };

      if (typeof payload.enabled === "boolean") {
        setViewerCanCollaborate(payload.enabled);
      }
    } catch {
      // The active collaboration connection reports network failures already.
    }
  }, [role, roomSlug]);

  useEffect(() => {
    if (role !== "viewer") return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, REFRESH_INTERVAL_MS);
    const handleFocus = (): void => {
      void refresh();
    };
    const handleVisibility = (): void => {
      if (document.visibilityState === "visible") void refresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    queueMicrotask(() => {
      void refresh();
    });

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh, role]);

  return { setViewerCanCollaborate, viewerCanCollaborate };
}

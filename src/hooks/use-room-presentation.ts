"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { backoffDelay } from "@/lib/polling";

import {
  getCollaborationWebSocketEndpoint,
  type CollaborationWebSocketEndpoint,
} from "@/lib/collaboration/websocket-endpoint";
import type { RoomDocumentKind } from "@/lib/rooms/repository";

export type PresentedWorkspace = RoomDocumentKind | "live";

export interface RoomPresentation {
  cursor?: { x: number; y: number };
  presenterId: string;
  presenterName: string;
  scrollY?: number;
  updatedAt: string;
  workspace: PresentedWorkspace;
}

interface UseRoomPresentationOptions {
  canPresent: boolean;
  currentUser: { displayName: string; id: string };
  roomId: string;
  workspace: PresentedWorkspace;
}

interface UseRoomPresentationResult {
  isPresenting: boolean;
  presentation: RoomPresentation | null;
  startPresenting(): void;
  stopPresenting(): void;
  updateCursor(x: number, y: number): void;
  updateScroll(y: number): void;
}

function presenceUrl(
  endpoint: CollaborationWebSocketEndpoint,
  roomId: string,
  accessToken?: string,
): string {
  const url = new URL(endpoint.url);
  const basePath = url.pathname.replace(/\/$/, "");
  url.pathname = `${basePath}/presence/${encodeURIComponent(roomId)}`;
  url.search = accessToken
    ? new URLSearchParams({ access_token: accessToken }).toString()
    : "";
  return url.toString();
}

function readPresentation(value: unknown): RoomPresentation | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<RoomPresentation>;

  if (
    typeof candidate.presenterId !== "string" ||
    typeof candidate.presenterName !== "string" ||
    typeof candidate.updatedAt !== "string" ||
    !["notes", "pdf", "whiteboard", "live"].includes(candidate.workspace ?? "")
  ) {
    return null;
  }

  const cursor = candidate.cursor;
  const scrollY = candidate.scrollY;
  return {
    ...(cursor &&
    typeof cursor === "object" &&
    typeof cursor.x === "number" &&
    Number.isFinite(cursor.x) &&
    typeof cursor.y === "number" &&
    Number.isFinite(cursor.y)
      ? { cursor: { x: cursor.x, y: cursor.y } }
      : {}),
    ...(typeof scrollY === "number" &&
    Number.isFinite(scrollY) &&
    scrollY >= 0 &&
    scrollY <= 1
      ? { scrollY }
      : {}),
    presenterId: candidate.presenterId,
    presenterName: candidate.presenterName,
    updatedAt: candidate.updatedAt,
    workspace: candidate.workspace,
  } as RoomPresentation;
}

/** Ten moves a second; every send is relayed to each instance and viewer. */
const SEND_INTERVAL_MS = 100;

export function useRoomPresentation({
  canPresent,
  currentUser,
  roomId,
  workspace,
}: UseRoomPresentationOptions): UseRoomPresentationResult {
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentation, setPresentation] = useState<RoomPresentation | null>(
    null,
  );
  const socketRef = useRef<WebSocket | null>(null);
  const isPresentingRef = useRef(false);
  const workspaceRef = useRef(workspace);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const cursorTimerRef = useRef<number | null>(null);
  const scrollRef = useRef(0);
  const scrollTimerRef = useRef<number | null>(null);

  const sendUpdate = useCallback((): void => {
    const socket = socketRef.current;
    if (
      !canPresent ||
      !isPresentingRef.current ||
      socket?.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    socket.send(
      JSON.stringify({
        cursor: cursorRef.current,
        presenterName: currentUser.displayName,
        scrollY: workspaceRef.current === "notes" ? scrollRef.current : null,
        type: "presentation-update",
        workspace: workspaceRef.current,
      }),
    );
  }, [canPresent, currentUser.displayName]);

  useEffect(() => {
    workspaceRef.current = workspace;
    sendUpdate();
  }, [sendUpdate, workspace]);

  useEffect(() => {
    let active = true;
    let socket: WebSocket | null = null;
    let failures = 0;
    const abortController = new AbortController();

    const scheduleReconnect = (): void => {
      if (!active || abortController.signal.aborted) return;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      const wait = backoffDelay(2_000, failures);
      failures += 1;
      reconnectTimerRef.current = setTimeout(() => {
        // A hidden tab waits; it must not keep opening sockets.
        if (document.hidden) {
          document.addEventListener("visibilitychange", start, { once: true });
        } else start();
      }, wait);
    };

    const start = (): void => {
      if (active) void connect().catch(scheduleReconnect);
    };

    const connect = async (): Promise<void> => {
      const endpoint = getCollaborationWebSocketEndpoint();
      let accessToken: string | undefined;

      if (endpoint.authentication === "access-token") {
        const response = await fetch("/api/auth/access-token", {
          cache: "no-store",
          credentials: "same-origin",
          signal: abortController.signal,
        });
        if (!response.ok) {
          throw new Error("Presentation presence unavailable.");
        }

        const payload = (await response.json()) as { accessToken?: unknown };
        if (typeof payload.accessToken !== "string") {
          throw new Error("Presentation presence unavailable.");
        }
        accessToken = payload.accessToken;
      }
      if (!active) return;

      socket = new WebSocket(presenceUrl(endpoint, roomId, accessToken));
      socketRef.current = socket;
      socket.addEventListener("open", () => {
        failures = 0;
        sendUpdate();
      });
      socket.addEventListener("message", (event) => {
        if (!active || typeof event.data !== "string") return;
        try {
          const message = JSON.parse(event.data) as {
            presentation?: unknown;
            type?: unknown;
          };
          if (message.type === "presentation") {
            setPresentation(readPresentation(message.presentation));
          }
        } catch {
          // Ignore malformed ephemeral presence messages.
        }
      });
      socket.addEventListener("close", () => {
        if (!active) return;
        setPresentation(null);
        scheduleReconnect();
      });
    };

    start();

    return () => {
      active = false;
      abortController.abort();
      document.removeEventListener("visibilitychange", start);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      socket?.close();
      if (socketRef.current === socket) socketRef.current = null;
    };
  }, [roomId, sendUpdate]);

  useEffect(() => {
    if (!isPresenting) return;
    const heartbeat = setInterval(sendUpdate, 2_000);
    return () => clearInterval(heartbeat);
  }, [isPresenting, sendUpdate]);

  const startPresenting = useCallback((): void => {
    if (!canPresent) return;
    isPresentingRef.current = true;
    setIsPresenting(true);
    sendUpdate();
  }, [canPresent, sendUpdate]);

  const stopPresenting = useCallback((): void => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "presentation-stop" }));
    }
    isPresentingRef.current = false;
    setIsPresenting(false);
  }, []);

  const updateCursor = useCallback(
    (x: number, y: number): void => {
      if (!canPresent || !isPresentingRef.current) return;
      cursorRef.current = {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      };
      if (cursorTimerRef.current !== null) return;
      cursorTimerRef.current = window.setTimeout(() => {
        cursorTimerRef.current = null;
        sendUpdate();
      }, SEND_INTERVAL_MS);
    },
    [canPresent, sendUpdate],
  );

  const updateScroll = useCallback(
    (y: number): void => {
      if (!canPresent) return;
      scrollRef.current = Math.max(0, Math.min(1, y));
      if (!isPresentingRef.current || scrollTimerRef.current !== null) return;
      scrollTimerRef.current = window.setTimeout(() => {
        scrollTimerRef.current = null;
        sendUpdate();
      }, SEND_INTERVAL_MS);
    },
    [canPresent, sendUpdate],
  );

  useEffect(
    () => () => {
      if (cursorTimerRef.current !== null) {
        clearTimeout(cursorTimerRef.current);
      }
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
      stopPresenting();
    },
    [stopPresenting],
  );

  return {
    isPresenting,
    presentation,
    startPresenting,
    stopPresenting,
    updateCursor,
    updateScroll,
  };
}

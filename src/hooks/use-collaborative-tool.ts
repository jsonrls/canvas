"use client";

import {
  createProviderLifecycle,
  type ProviderLifecycle,
} from "@/lib/collaboration/provider-lifecycle";

import { useCallback, useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import {
  buildBreakoutCollaborativeDocumentName,
  buildCollaborativeDocumentName,
} from "@/lib/collaboration/document-name";
import { getCollaborationWebSocketEndpoint } from "@/lib/collaboration/websocket-endpoint";
import {
  createOfflineDocument,
  type CollaborativeDocumentKind,
  type OfflineDocumentResult,
} from "@/lib/collaboration/offline-document";

export type ToolSyncStatus =
  "connecting" | "error" | "offline" | "synced" | "viewing";

export interface ToolLaserPoint {
  x: number;
  y: number;
}

export interface ToolLaser extends ToolLaserPoint {
  trail: ToolLaserPoint[];
}

export interface ToolParticipant {
  clientId: number;
  color: string;
  laser?: ToolLaser;
  name: string;
}

export interface CollaborativeToolConnection {
  document: Y.Doc;
  provider: WebsocketProvider;
  user: ToolParticipant;
}

interface UseCollaborativeToolOptions {
  breakoutCode?: string;
  canEdit: boolean;
  currentUser: { displayName: string; id: string };
  initialState: string | null;
  kind: Exclude<CollaborativeDocumentKind, "notes">;
  roomId: string;
}

interface UseCollaborativeToolResult {
  connection: CollaborativeToolConnection | null;
  message: string;
  participants: ToolParticipant[];
  reconnect(): void;
  setAwarenessField(field: string, value: unknown): void;
  status: ToolSyncStatus;
}

const USER_COLORS = ["#7352FA", "#f04623", "#9c614f", "#16866d", "#d98b22"];

function applySnapshot(document: Y.Doc, snapshot: string | null): string {
  if (!snapshot) {
    return "";
  }

  try {
    const binary = window.atob(snapshot);
    Y.applyUpdate(
      document,
      Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
    return "";
  } catch {
    return "The saved study-tool snapshot could not be decoded.";
  }
}

function readParticipants(provider: WebsocketProvider): ToolParticipant[] {
  const participants: ToolParticipant[] = [];

  provider.awareness.getStates().forEach((state: unknown, clientId) => {
    if (!state || typeof state !== "object" || !("user" in state)) {
      return;
    }

    const user = (state as { user?: Partial<ToolParticipant> }).user;
    const laser = (state as { laser?: unknown }).laser;

    if (typeof user?.name !== "string" || typeof user.color !== "string") {
      return;
    }

    const validLaserPoint = (point: unknown): point is ToolLaserPoint =>
      Boolean(
        point &&
        typeof point === "object" &&
        "x" in point &&
        "y" in point &&
        typeof point.x === "number" &&
        Number.isFinite(point.x) &&
        typeof point.y === "number" &&
        Number.isFinite(point.y),
      );

    participants.push({
      clientId,
      color: user.color,
      laser: validLaserPoint(laser)
        ? {
            x: laser.x,
            y: laser.y,
            trail:
              "trail" in laser && Array.isArray(laser.trail)
                ? laser.trail.filter(validLaserPoint).slice(-16)
                : [],
          }
        : undefined,
      name: user.name,
    });
  });

  return participants.sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function useCollaborativeTool({
  breakoutCode,
  canEdit,
  currentUser,
  initialState,
  kind,
  roomId,
}: UseCollaborativeToolOptions): UseCollaborativeToolResult {
  const lifecycleRef = useRef<ProviderLifecycle | null>(null);
  const [connection, setConnection] =
    useState<CollaborativeToolConnection | null>(null);
  const [message, setMessage] = useState("");
  const [participants, setParticipants] = useState<ToolParticipant[]>([]);
  const [status, setStatus] = useState<ToolSyncStatus>(
    canEdit ? "connecting" : "viewing",
  );
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    let active = true;
    let persistence: OfflineDocumentResult["persistence"] = null;
    const abortController = new AbortController();
    const document = new Y.Doc();
    const endpoint = getCollaborationWebSocketEndpoint();
    const offlineRoomId = breakoutCode
      ? `breakout-${breakoutCode.toLowerCase()}`
      : roomId;
    const snapshotMessage = applySnapshot(document, initialState);
    const user: ToolParticipant = {
      clientId: document.clientID,
      color: USER_COLORS[document.clientID % USER_COLORS.length],
      name: currentUser.displayName || "Study partner",
    };
    const provider = new WebsocketProvider(
      endpoint.url,
      breakoutCode
        ? buildBreakoutCollaborativeDocumentName(roomId, breakoutCode, kind)
        : buildCollaborativeDocumentName(roomId, kind),
      document,
      {
        connect: false,
        maxBackoffTime: 4_000,
        params: {},
        resyncInterval: 2_500,
      },
    );
    providerRef.current = provider;
    provider.awareness.setLocalStateField("user", user);

    const updateParticipants = (): void => {
      if (active) {
        setParticipants(readParticipants(provider));
      }
    };
    const updateStatus = ({
      status: connectionStatus,
    }: {
      status: "connected" | "connecting" | "disconnected";
    }): void => {
      if (!active) return;

      if (connectionStatus === "disconnected") {
        setStatus(navigator.onLine ? "connecting" : "offline");
        return;
      }

      setStatus(canEdit ? "connecting" : "viewing");
    };
    const updateSync = (synced: boolean): void => {
      if (!active) return;
      setStatus(synced ? (canEdit ? "synced" : "viewing") : "connecting");

      if (synced) {
        setMessage("");
      }
    };
    const handleConnectionError = (): void => {
      if (!active) return;
      setStatus(navigator.onLine ? "error" : "offline");
      setMessage("Live collaboration is temporarily unavailable.");
    };
    const handleOffline = (): void => {
      setStatus("offline");
      setMessage(
        "You are offline. Keep this tab open until live sync returns.",
      );
      setParticipants([]);
    };

    queueMicrotask(() => {
      if (!active) return;
      setConnection({ document, provider, user });

      if (!canEdit) setMessage(snapshotMessage);
    });

    const initialize = async (): Promise<void> => {
      if (canEdit) {
        const offline = await createOfflineDocument(
          currentUser.id,
          offlineRoomId,
          document,
          kind,
          abortController.signal,
        );
        persistence = offline.persistence;
      }

      if (!active) {
        await persistence?.destroy();
        return;
      }
    };
    const lifecycle = createProviderLifecycle({
      provider,
      authentication: endpoint.authentication,
      ready: initialize(),
      onStatus: updateStatus,
      onSync: updateSync,
      onAwareness: updateParticipants,
      onError: handleConnectionError,
      onOffline: handleOffline,
      onConnecting: () => {
        setStatus("connecting");
        setMessage("");
      },
    });
    lifecycleRef.current = lifecycle;
    void lifecycle.reconnect();

    return () => {
      active = false;
      abortController.abort();
      lifecycle.dispose();
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
      provider.destroy();
      void persistence?.destroy();
      document.destroy();

      if (providerRef.current === provider) {
        providerRef.current = null;
      }
    };
  }, [
    canEdit,
    breakoutCode,
    currentUser.displayName,
    currentUser.id,
    initialState,
    kind,
    roomId,
  ]);

  const reconnect = useCallback((): void => {
    void lifecycleRef.current?.reconnect();
  }, []);

  const setAwarenessField = useCallback(
    (field: string, value: unknown): void => {
      if (canEdit) {
        providerRef.current?.awareness.setLocalStateField(field, value);
      }
    },
    [canEdit],
  );

  return {
    connection,
    message,
    participants,
    reconnect,
    setAwarenessField,
    status,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { buildCollaborativeDocumentName } from "@/lib/collaboration/document-name";
import {
  createOfflineDocument,
  type CollaborativeDocumentKind,
  type OfflineDocumentResult,
} from "@/lib/collaboration/offline-document";

export type ToolSyncStatus =
  "connecting" | "error" | "offline" | "synced" | "viewing";

export interface ToolParticipant {
  clientId: number;
  color: string;
  laser?: { x: number; y: number };
  name: string;
}

export interface CollaborativeToolConnection {
  document: Y.Doc;
  provider: WebsocketProvider;
  user: ToolParticipant;
}

interface UseCollaborativeToolOptions {
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

const USER_COLORS = [
  "#3871c2",
  "#f04623",
  "#9c614f",
  "#7c5bb3",
  "#16866d",
  "#d98b22",
];

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

    participants.push({
      clientId,
      color: user.color,
      laser:
        laser &&
        typeof laser === "object" &&
        "x" in laser &&
        "y" in laser &&
        typeof laser.x === "number" &&
        typeof laser.y === "number"
          ? { x: laser.x, y: laser.y }
          : undefined,
      name: user.name,
    });
  });

  return participants.sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function useCollaborativeTool({
  canEdit,
  currentUser,
  initialState,
  kind,
  roomId,
}: UseCollaborativeToolOptions): UseCollaborativeToolResult {
  const [attempt, setAttempt] = useState(0);
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
    const snapshotMessage = applySnapshot(document, initialState);
    const user: ToolParticipant = {
      clientId: document.clientID,
      color: USER_COLORS[document.clientID % USER_COLORS.length],
      name: currentUser.displayName || "Study partner",
    };
    const provider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_YJS_WS_URL ?? "ws://localhost:1234",
      buildCollaborativeDocumentName(roomId, kind),
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

      setStatus("connecting");
    };
    const updateSync = (synced: boolean): void => {
      if (!active) return;
      setStatus(synced ? "synced" : "connecting");

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
      provider.disconnect();
      setStatus("offline");
      setMessage("You are offline. Changes remain saved on this device.");
      setParticipants([]);
    };

    provider.awareness.on("change", updateParticipants);
    provider.on("status", updateStatus);
    provider.on("sync", updateSync);
    provider.on("connection-error", handleConnectionError);
    window.addEventListener("offline", handleOffline);

    queueMicrotask(() => {
      if (!active) return;
      setConnection({ document, provider, user });

      if (!canEdit) {
        setMessage(snapshotMessage);
        setStatus("viewing");
      }
    });

    if (canEdit) {
      const initialize = async (): Promise<void> => {
        const offline = await createOfflineDocument(
          currentUser.id,
          roomId,
          document,
          kind,
        );
        persistence = offline.persistence;

        if (!active) {
          await persistence?.destroy();
          return;
        }

        if (!navigator.onLine) {
          handleOffline();
          return;
        }

        const response = await fetch("/api/auth/access-token", {
          cache: "no-store",
          credentials: "same-origin",
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("The secure collaboration session could not open.");
        }

        const payload = (await response.json()) as { accessToken?: unknown };

        if (typeof payload.accessToken !== "string") {
          throw new Error("The collaboration token response was invalid.");
        }

        if (active) {
          provider.params = { access_token: payload.accessToken };
          provider.connect();
        }
      };

      void initialize().catch((error: unknown) => {
        if (!active || abortController.signal.aborted) return;
        setStatus(navigator.onLine ? "error" : "offline");
        setMessage(
          error instanceof Error
            ? error.message
            : "The collaboration session could not open.",
        );
      });
    }

    return () => {
      active = false;
      abortController.abort();
      window.removeEventListener("offline", handleOffline);
      provider.awareness.off("change", updateParticipants);
      provider.off("status", updateStatus);
      provider.off("sync", updateSync);
      provider.off("connection-error", handleConnectionError);
      provider.destroy();
      void persistence?.destroy();
      document.destroy();

      if (providerRef.current === provider) {
        providerRef.current = null;
      }
    };
  }, [
    attempt,
    canEdit,
    currentUser.displayName,
    currentUser.id,
    initialState,
    kind,
    roomId,
  ]);

  const reconnect = useCallback((): void => {
    if (!canEdit) return;
    providerRef.current?.disconnect();
    setMessage("");
    setParticipants([]);
    setStatus("connecting");
    setAttempt((current) => current + 1);
  }, [canEdit]);

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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";
import { createVersionAction } from "@/app/rooms/[roomId]/actions";
import type { ConflictResolutionResult } from "@/components/collaboration/conflict-review-panel";
import type { RichTextEditorHandle } from "@/components/collaboration/rich-text-editor";
import { useToast } from "@/components/ui/toast";
import {
  createProviderLifecycle,
  type ProviderLifecycle,
} from "./provider-lifecycle";
import {
  captureOfflineDraft,
  createConflictCheckpointLabel,
  createReconciliationWindow,
  finalizeConflictReview,
  isReconciliationUpdateRelevant,
  recordReconciliationUpdate,
  type ConflictReview,
  type ReconciliationWindow,
} from "./conflict-review";
import {
  createOfflineDocument,
  type OfflineDocumentResult,
} from "./offline-document";
import { getCollaborationWebSocketEndpoint } from "./websocket-endpoint";

type LocalPersistenceStatus = "disabled" | "loading" | "saved" | "unavailable";
type RemoteSyncStatus =
  "connecting" | "synced" | "offline" | "error" | "viewing";

interface StudyUser {
  clientId: number;
  color: string;
  name: string;
}

interface CollaborationConnection {
  document: Y.Doc;
  provider: WebsocketProvider;
  user: StudyUser;
}

const USER_NAMES = [
  "Maya",
  "Theo",
  "Iris",
  "Noah",
  "Sam",
  "Lena",
  "Kai",
  "Ari",
];
const USER_COLORS = ["#7352FA", "#f04623", "#9c614f", "#16866d", "#d98b22"];

function createStudyUser(clientId: number, displayName: string): StudyUser {
  return {
    clientId,
    name: displayName || USER_NAMES[clientId % USER_NAMES.length],
    color: USER_COLORS[clientId % USER_COLORS.length],
  };
}

function readParticipants(provider: WebsocketProvider): StudyUser[] {
  const participants = new Map<number, StudyUser>();

  provider.awareness.getStates().forEach((state: unknown, clientId: number) => {
    if (typeof state !== "object" || state === null || !("user" in state)) {
      return;
    }

    const user = (state as { user?: Partial<StudyUser> }).user;

    if (typeof user?.name !== "string" || typeof user.color !== "string") {
      return;
    }

    participants.set(clientId, {
      clientId,
      name: user.name,
      color: user.color,
    });
  });

  return Array.from(participants.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

interface NotesCollaborationOptions {
  canEdit: boolean;
  currentUser: { displayName: string; id: string };
  initialState: string | null;
  roomId: string;
}

export function useNotesCollaboration({
  canEdit,
  currentUser,
  initialState,
  roomId,
}: NotesCollaborationOptions) {
  const router = useRouter();
  const { success } = useToast();
  const collaborationEndpoint = getCollaborationWebSocketEndpoint();
  const [connection, setConnection] = useState<CollaborationConnection | null>(
    null,
  );
  const [conflictReview, setConflictReview] = useState<ConflictReview | null>(
    null,
  );
  const [localStatus, setLocalStatus] =
    useState<LocalPersistenceStatus>("loading");
  const [remoteStatus, setRemoteStatus] =
    useState<RemoteSyncStatus>("connecting");
  const [participants, setParticipants] = useState<StudyUser[]>([]);
  const lifecycleRef = useRef<ProviderLifecycle | null>(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const documentRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const reconciliationWindowRef = useRef<ReconciliationWindow | null>(null);
  const reviewIdRef = useRef(0);
  const offlineInitializationRef =
    useRef<Promise<OfflineDocumentResult> | null>(null);
  const isSigningOutRef = useRef(false);
  const beginReconciliationWindow = useCallback((): void => {
    if (!canEdit) {
      return;
    }

    reconciliationWindowRef.current ??= createReconciliationWindow();
  }, [canEdit]);

  useEffect(() => {
    let active = true;
    const abortController = new AbortController();
    let offlinePersistence: OfflineDocumentResult["persistence"] = null;
    let snapshotMessage = "";
    const document = new Y.Doc();

    if (initialState) {
      try {
        const binary = window.atob(initialState);
        const update = Uint8Array.from(binary, (character) =>
          character.charCodeAt(0),
        );
        Y.applyUpdate(document, update);
      } catch {
        snapshotMessage =
          "The saved notes snapshot could not be decoded. Refresh before relying on this view.";
      }
    }

    const user = createStudyUser(document.clientID, currentUser.displayName);
    const provider = new WebsocketProvider(
      collaborationEndpoint.url,
      roomId,
      document,
      {
        connect: false,
        maxBackoffTime: 4000,
        params: {},
        resyncInterval: 2500,
      },
    );
    documentRef.current = document;
    providerRef.current = provider;

    const handleBeforeTransaction = (transaction: Y.Transaction): void => {
      const reconciliationWindow = reconciliationWindowRef.current;

      if (
        reconciliationWindow === null ||
        transaction.origin !== provider ||
        reconciliationWindow.localUpdateCount === 0
      ) {
        return;
      }

      captureOfflineDraft(
        reconciliationWindow,
        editorRef.current?.captureDraft() ?? null,
      );
    };
    const handleDocumentUpdate = (
      _update: Uint8Array,
      origin: unknown,
    ): void => {
      const reconciliationWindow = reconciliationWindowRef.current;

      if (reconciliationWindow === null) {
        return;
      }

      const isRemoteUpdate = origin === provider;
      const updateSource = isRemoteUpdate ? "remote" : "local";

      if (
        !isReconciliationUpdateRelevant(
          updateSource,
          editorRef.current?.isFocused() ?? false,
        )
      ) {
        return;
      }

      recordReconciliationUpdate(reconciliationWindow, updateSource);
    };
    const handleStatus = ({
      status,
    }: {
      status: "connected" | "disconnected" | "connecting";
    }): void => {
      if (status === "disconnected") {
        beginReconciliationWindow();
        setRemoteStatus(navigator.onLine ? "connecting" : "offline");
        return;
      }

      if (status === "connected") {
        const reconciliationWindow = reconciliationWindowRef.current;

        if (reconciliationWindow?.localUpdateCount) {
          captureOfflineDraft(
            reconciliationWindow,
            editorRef.current?.captureDraft() ?? null,
          );
        }
      }

      setRemoteStatus(canEdit ? "connecting" : "viewing");
    };
    const handleSync = (synced: boolean): void => {
      setRemoteStatus(synced ? (canEdit ? "synced" : "viewing") : "connecting");

      if (!synced) {
        beginReconciliationWindow();
        return;
      }

      setConnectionMessage("");
      const reconciliationWindow = reconciliationWindowRef.current;
      reconciliationWindowRef.current = null;

      if (reconciliationWindow === null) {
        return;
      }

      queueMicrotask(() => {
        if (!active || isSigningOutRef.current) {
          return;
        }

        reviewIdRef.current += 1;
        const review = finalizeConflictReview(
          reconciliationWindow,
          editorRef.current?.captureDraft() ?? null,
          reviewIdRef.current,
        );

        if (review !== null) {
          setConflictReview(review);
          return;
        }

        if (reconciliationWindow.localUpdateCount > 0) {
          success(
            "Your offline edits are live. No shared changes needed review.",
          );
        }
      });
    };
    const handleConnectionError = (): void => {
      beginReconciliationWindow();
      setConnectionMessage(
        navigator.onLine
          ? "The collaboration service rejected or lost this connection."
          : "The network is unavailable. Your local notes remain open.",
      );
      setRemoteStatus(navigator.onLine ? "error" : "offline");
    };
    const handleAwarenessChange = (): void => {
      setParticipants(readParticipants(provider));
    };

    document.on("beforeTransaction", handleBeforeTransaction);
    document.on("update", handleDocumentUpdate);
    provider.awareness.setLocalStateField("user", user);

    const initializeLocalDocument = async (): Promise<void> => {
      const initialization = createOfflineDocument(
        currentUser.id,
        roomId,
        document,
        "notes",
        abortController.signal,
      );
      offlineInitializationRef.current = initialization;
      const result = await initialization;
      offlinePersistence = result.persistence;

      if (!active) {
        await result.persistence?.destroy();
        return;
      }

      if (isSigningOutRef.current) {
        return;
      }

      setLocalStatus(result.status);
      setLocalMessage(
        result.status === "saved"
          ? ""
          : "Local saving is unavailable. Keep this tab open until live sync returns.",
      );
      beginReconciliationWindow();
      setConnection({ document, provider, user });
    };

    let ready: Promise<void> = Promise.resolve();
    if (!canEdit) {
      queueMicrotask(() => {
        if (!active || isSigningOutRef.current) {
          return;
        }

        setLocalMessage(snapshotMessage);
        setLocalStatus("disabled");
        setRemoteStatus("viewing");
        setConnection({ document, provider, user });
      });
    } else {
      ready = initializeLocalDocument().catch(() => {
        if (!active || isSigningOutRef.current) {
          return;
        }

        setLocalStatus("unavailable");
        setLocalMessage(
          "Local saving is unavailable. Keep this tab open until live sync returns.",
        );
        beginReconciliationWindow();
        setConnection({ document, provider, user });
      });
    }

    const lifecycle = createProviderLifecycle({
      provider,
      authentication: collaborationEndpoint.authentication,
      ready,
      onStatus: handleStatus,
      onSync: handleSync,
      onError: handleConnectionError,
      onAwareness: handleAwarenessChange,
      onOffline: () => {
        beginReconciliationWindow();
        setRemoteStatus("offline");
        setParticipants([]);
        setConnectionMessage(
          "The network is unavailable. Your local notes remain open.",
        );
      },
      onConnecting: () => {
        beginReconciliationWindow();
        setRemoteStatus("connecting");
        setConnectionMessage("");
      },
    });
    lifecycleRef.current = lifecycle;
    void lifecycle.reconnect();

    return () => {
      active = false;
      abortController.abort();
      lifecycle.dispose();
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
      document.off("beforeTransaction", handleBeforeTransaction);
      document.off("update", handleDocumentUpdate);
      provider.destroy();
      void offlinePersistence?.destroy();
      document.destroy();

      if (providerRef.current === provider) {
        providerRef.current = null;
      }

      if (documentRef.current === document) {
        documentRef.current = null;
        reconciliationWindowRef.current = null;
      }
    };
  }, [
    beginReconciliationWindow,
    canEdit,
    collaborationEndpoint.url,
    collaborationEndpoint.authentication,
    currentUser.displayName,
    currentUser.id,
    initialState,
    roomId,
    success,
  ]);

  const reconnect = useCallback((): void => {
    void lifecycleRef.current?.reconnect();
  }, []);

  const prepareForSignOut = useCallback(async (): Promise<void> => {
    isSigningOutRef.current = true;
    lifecycleRef.current?.dispose();
    reconciliationWindowRef.current = null;
    providerRef.current?.destroy();
    providerRef.current = null;
    const initialization = offlineInitializationRef.current;

    if (initialization) {
      const result = await initialization;
      await result.persistence?.clearData();
    }

    documentRef.current?.destroy();
    documentRef.current = null;
  }, []);

  const keepMergedNote = useCallback(
    (reviewId: number): void => {
      setConflictReview((currentReview) =>
        currentReview?.id === reviewId ? null : currentReview,
      );
      success(
        "Merged note kept. Your offline and shared changes remain live together.",
      );
    },
    [success],
  );

  const finishConflictReview = useCallback(
    (reviewId: number, message: string): void => {
      setConflictReview((currentReview) =>
        currentReview?.id === reviewId ? null : currentReview,
      );
      success(message);
    },
    [success],
  );

  const useOfflineDraft = useCallback(
    async (review: ConflictReview): Promise<ConflictResolutionResult> => {
      const provider = providerRef.current;
      if (!provider?.synced) {
        return {
          message:
            "Reconnect to live sync before replacing the shared note. The merged note is unchanged.",
          ok: false,
        };
      }

      const mergedSnapshot = editorRef.current?.captureSnapshot();

      if (!mergedSnapshot) {
        return {
          message:
            "Wait for the shared document to finish opening. The merged note is unchanged.",
          ok: false,
        };
      }

      const checkpointResult = await createVersionAction(
        roomId,
        createConflictCheckpointLabel(),
        mergedSnapshot,
      ).catch(() => null);

      if (checkpointResult === null) {
        return {
          message:
            "The safety checkpoint could not be confirmed. The merged note is unchanged.",
          ok: false,
        };
      }

      if (checkpointResult.data === null) {
        return {
          message: `${checkpointResult.error} The merged note is unchanged.`,
          ok: false,
        };
      }

      if (
        isSigningOutRef.current ||
        providerRef.current !== provider ||
        !provider.synced
      ) {
        return {
          ok: false,
          message:
            "The safety checkpoint was saved, but this session changed. The merged note is unchanged.",
        };
      }

      const latestSnapshot = editorRef.current?.captureSnapshot();

      if (!latestSnapshot) {
        return {
          message:
            "The safety checkpoint was saved, but the editor is reconnecting. The merged note is unchanged.",
          ok: false,
        };
      }

      if (latestSnapshot.yjsState !== mergedSnapshot.yjsState) {
        const latestDraft = editorRef.current?.captureDraft();

        if (latestDraft) {
          setConflictReview((currentReview) =>
            currentReview?.id === review.id
              ? { ...currentReview, mergedDraft: latestDraft }
              : currentReview,
          );
        }

        return {
          message:
            "The live note changed while its checkpoint was saving, so nothing was replaced. Review the refreshed merge before trying again.",
          ok: false,
        };
      }

      try {
        const restored = editorRef.current?.restoreContent(
          review.offlineDraft.content,
        );

        if (!restored) {
          return {
            message:
              "The safety checkpoint was saved, but the editor is reconnecting. Try using the offline draft again.",
            ok: false,
          };
        }
      } catch {
        return {
          message:
            "The safety checkpoint was saved, but this offline draft is not compatible with the editor.",
          ok: false,
        };
      }

      router.refresh();

      return {
        message: `Offline draft restored. The merged result remains saved as “${checkpointResult.data.label}”.`,
        ok: true,
      };
    },
    [roomId, router],
  );

  const remoteActionsAvailable = canEdit && remoteStatus === "synced";
  const remoteCopy: Record<RemoteSyncStatus, string> = {
    connecting: "Connecting to live sync",
    error: "Live sync needs attention",
    offline: "Offline — edits stay on this device",
    synced: "Live sync active",
    viewing: "Read-only room access",
  };

  return {
    connection,
    conflictReview,
    localStatus,
    remoteStatus,
    participants,
    connectionMessage,
    localMessage,
    editorRef,
    reconnect,
    prepareForSignOut,
    keepMergedNote,
    finishConflictReview,
    useOfflineDraft,
    remoteActionsAvailable,
    remoteCopy,
  };
}

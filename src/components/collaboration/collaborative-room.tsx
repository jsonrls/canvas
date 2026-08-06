"use client";

import {
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Globe2,
  House,
  Eye,
  LockKeyhole,
  MousePointer2,
  PanelLeft,
  PanelsTopLeft,
  Presentation,
  Radio,
  RefreshCw,
  Split,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { createVersionAction } from "@/app/rooms/[roomId]/actions";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import {
  ConflictReviewPanel,
  type ConflictResolutionResult,
} from "@/components/collaboration/conflict-review-panel";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/collaboration/rich-text-editor";
import { VersionHistoryPanel } from "@/components/collaboration/version-history-panel";
import {
  ViewerCollaborationStatus,
  ViewerCollaborationToggle,
} from "@/components/rooms/viewer-collaboration-toggle";
import {
  captureOfflineDraft,
  createConflictCheckpointLabel,
  createReconciliationWindow,
  finalizeConflictReview,
  isReconciliationUpdateRelevant,
  recordReconciliationUpdate,
  type ConflictReview,
  type ReconciliationWindow,
} from "@/lib/collaboration/conflict-review";
import {
  createOfflineDocument,
  type OfflineDocumentResult,
} from "@/lib/collaboration/offline-document";
import { getCollaborationWebSocketEndpoint } from "@/lib/collaboration/websocket-endpoint";
import type { VersionSummary } from "@/lib/version-history/types";
import type {
  RoomDocumentKind,
  RoomPdfAsset,
  RoomRole,
} from "@/lib/rooms/repository";
import { useRoomPresentation } from "@/hooks/use-room-presentation";
import { useViewerCollaboration } from "@/hooks/use-viewer-collaboration";

type LocalPersistenceStatus = "disabled" | "loading" | "saved" | "unavailable";
type RemoteSyncStatus =
  "connecting" | "synced" | "offline" | "error" | "viewing";
type WorkspaceTool = RoomDocumentKind | "assistant";

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

interface CollaborativeRoomProps {
  availableRooms: Array<{ name: string; slug: string }>;
  breakoutRoomCount: number;
  currentUser: {
    displayName: string;
    id: string;
  };
  currentUserRole: RoomRole;
  initialDocumentStates: Record<RoomDocumentKind, string | null>;
  initialPdfAsset: RoomPdfAsset | null;
  initialVersions: VersionSummary[];
  initialViewerCanCollaborate: boolean;
  isPublic: boolean;
  roomId: string;
}

const PdfStudyTool = dynamic(
  () => import("@/components/collaboration/pdf-study-tool"),
  {
    loading: () => <ToolLoading label="Opening the PDF studio…" />,
    ssr: false,
  },
);
const WhiteboardStudyTool = dynamic(
  () => import("@/components/collaboration/whiteboard-study-tool"),
  {
    loading: () => <ToolLoading label="Opening the whiteboard…" />,
    ssr: false,
  },
);
const AiStudyTool = dynamic(
  () => import("@/components/collaboration/ai-study-tool"),
  {
    loading: () => <ToolLoading label="Opening the AI study assistant…" />,
    ssr: false,
  },
);

function ToolLoading({ label }: { label: string }): React.ReactElement {
  return (
    <div className="editor-initializing" role="status">
      <RefreshCw className="spin" aria-hidden="true" size={18} />
      {label}
    </div>
  );
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
const USER_COLORS = [
  "#3871c2",
  "#f04623",
  "#9c614f",
  "#7c5bb3",
  "#16866d",
  "#d98b22",
];

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

export function CollaborativeRoom({
  availableRooms,
  breakoutRoomCount,
  currentUser,
  currentUserRole,
  initialDocumentStates,
  initialPdfAsset,
  initialVersions,
  initialViewerCanCollaborate,
  isPublic,
  roomId,
}: CollaborativeRoomProps): React.ReactElement {
  const router = useRouter();
  const collaborationEndpoint = getCollaborationWebSocketEndpoint();
  const { setViewerCanCollaborate, viewerCanCollaborate } =
    useViewerCollaboration({
      initialEnabled: initialViewerCanCollaborate,
      role: currentUserRole,
      roomSlug: roomId,
    });
  const canManagePdf = currentUserRole !== "viewer";
  const canEdit = canManagePdf || viewerCanCollaborate;
  const [activeTool, setActiveTool] = useState<WorkspaceTool>("notes");
  const [followingPresenterId, setFollowingPresenterId] = useState<
    string | null
  >(null);
  const [showFollowPrompt, setShowFollowPrompt] = useState(false);
  const [assistantSourceText, setAssistantSourceText] = useState("");
  const [isVersionHistoryCollapsed, setIsVersionHistoryCollapsed] =
    useState(false);
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
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [localMessage, setLocalMessage] = useState("");
  const [reconciliationMessage, setReconciliationMessage] = useState("");
  const editorRef = useRef<RichTextEditorHandle>(null);
  const notesWorkspaceRef = useRef<HTMLElement>(null);
  const documentRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const reconciliationWindowRef = useRef<ReconciliationWindow | null>(null);
  const reviewIdRef = useRef(0);
  const offlineInitializationRef =
    useRef<Promise<OfflineDocumentResult> | null>(null);
  const isSigningOutRef = useRef(false);
  const presentedWorkspace: RoomDocumentKind =
    activeTool === "assistant" ? "notes" : activeTool;
  const roomPresentation = useRoomPresentation({
    canPresent: canEdit,
    currentUser,
    roomId,
    workspace: presentedWorkspace,
  });
  const {
    isPresenting,
    presentation,
    startPresenting,
    stopPresenting,
    updateCursor,
    updateScroll,
  } = roomPresentation;
  const isFollowingPresenter = Boolean(
    presentation && followingPresenterId === presentation.presenterId,
  );
  const presenterId = presentation?.presenterId;
  const presenterWorkspace = presentation?.workspace;

  useEffect(() => {
    if (activeTool === "assistant" && isPresenting) {
      stopPresenting();
    }
  }, [activeTool, isPresenting, stopPresenting]);

  const chooseTool = useCallback(
    (nextTool: WorkspaceTool): void => {
      if (!canEdit) {
        setFollowingPresenterId(null);
        setShowFollowPrompt(false);
      }
      setActiveTool(nextTool);
    },
    [canEdit],
  );

  const followPresenter = useCallback((): void => {
    if (!presentation || canEdit) return;
    setFollowingPresenterId(presentation.presenterId);
    setShowFollowPrompt(false);
    setActiveTool(presentation.workspace);
  }, [canEdit, presentation]);

  useEffect(() => {
    if (canEdit) return;

    if (!presenterId || !presenterWorkspace) return;

    if (followingPresenterId === presenterId) {
      if (activeTool !== presenterWorkspace) {
        queueMicrotask(() => setActiveTool(presenterWorkspace));
      }
      return;
    }

    const promptTimer = setTimeout(() => setShowFollowPrompt(true), 3_000);
    return () => clearTimeout(promptTimer);
  }, [
    activeTool,
    canEdit,
    followingPresenterId,
    presenterId,
    presenterWorkspace,
  ]);

  const handleNotesScroll = useCallback(
    (event: React.UIEvent<HTMLElement>): void => {
      const target = event.target;
      if (
        !canEdit ||
        !(target instanceof HTMLElement) ||
        !target.classList.contains("boardprep-editor")
      ) {
        return;
      }

      const maximumScroll = Math.max(
        0,
        target.scrollHeight - target.clientHeight,
      );
      updateScroll(maximumScroll > 0 ? target.scrollTop / maximumScroll : 0);
    },
    [canEdit, updateScroll],
  );

  useEffect(() => {
    const scrollY = presentation?.scrollY;
    if (
      activeTool !== "notes" ||
      !isFollowingPresenter ||
      presentation?.workspace !== "notes" ||
      typeof scrollY !== "number"
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const scroller =
        notesWorkspaceRef.current?.querySelector<HTMLElement>(
          ".boardprep-editor",
        );
      if (!scroller) return;
      const maximumScroll = Math.max(
        0,
        scroller.scrollHeight - scroller.clientHeight,
      );
      scroller.scrollTo({
        behavior: "auto",
        top: scrollY * maximumScroll,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [
    activeTool,
    isFollowingPresenter,
    presentation?.scrollY,
    presentation?.updatedAt,
    presentation?.workspace,
  ]);

  const beginReconciliationWindow = useCallback((): void => {
    if (!canEdit) {
      return;
    }

    reconciliationWindowRef.current ??= createReconciliationWindow();
  }, [canEdit]);

  useEffect(() => {
    let active = true;
    let offlinePersistence: OfflineDocumentResult["persistence"] = null;
    let snapshotMessage = "";
    const document = new Y.Doc();

    if (initialDocumentStates.notes) {
      try {
        const binary = window.atob(initialDocumentStates.notes);
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
        if (!active) {
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
          setReconciliationMessage("");
          return;
        }

        if (reconciliationWindow.localUpdateCount > 0) {
          setReconciliationMessage(
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
    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    provider.on("connection-error", handleConnectionError);
    provider.awareness.on("change", handleAwarenessChange);
    provider.awareness.setLocalStateField("user", user);

    const initializeLocalDocument = async (): Promise<void> => {
      const initialization = createOfflineDocument(
        currentUser.id,
        roomId,
        document,
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

    if (!canEdit) {
      queueMicrotask(() => {
        if (!active) {
          return;
        }

        setLocalMessage(snapshotMessage);
        setLocalStatus("disabled");
        setRemoteStatus("viewing");
        setConnection({ document, provider, user });
      });
    } else {
      void initializeLocalDocument().catch(() => {
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

    return () => {
      active = false;
      document.off("beforeTransaction", handleBeforeTransaction);
      document.off("update", handleDocumentUpdate);
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.off("connection-error", handleConnectionError);
      provider.awareness.off("change", handleAwarenessChange);
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
    currentUser.displayName,
    currentUser.id,
    initialDocumentStates.notes,
    roomId,
  ]);

  useEffect(() => {
    if (!connection) {
      return;
    }

    const provider = providerRef.current;

    if (!provider) {
      return;
    }

    const abortController = new AbortController();
    let active = true;

    const openRemoteConnection = async (): Promise<void> => {
      await Promise.resolve();

      if (!navigator.onLine) {
        beginReconciliationWindow();
        setRemoteStatus("offline");
        return;
      }

      setRemoteStatus("connecting");
      if (collaborationEndpoint.authentication === "access-token") {
        const tokenResponse = await fetch("/api/auth/access-token", {
          cache: "no-store",
          credentials: "same-origin",
          signal: abortController.signal,
        });

        if (!tokenResponse.ok) {
          throw new Error(
            "Your secure collaboration session could not be opened.",
          );
        }

        const tokenPayload = (await tokenResponse.json()) as {
          accessToken?: unknown;
        };

        if (typeof tokenPayload.accessToken !== "string") {
          throw new Error("The collaboration token response was invalid.");
        }

        provider.params = { access_token: tokenPayload.accessToken };
      }

      if (active) {
        provider.disconnect();
        provider.connect();
      }
    };

    void openRemoteConnection().catch((error: unknown) => {
      if (!active || abortController.signal.aborted) {
        return;
      }

      beginReconciliationWindow();
      setConnectionMessage(
        error instanceof Error
          ? error.message
          : "The secure collaboration session could not be opened.",
      );
      setRemoteStatus(navigator.onLine ? "error" : "offline");
    });

    return () => {
      active = false;
      abortController.abort();
      provider.disconnect();
    };
  }, [
    beginReconciliationWindow,
    canEdit,
    collaborationEndpoint.authentication,
    connection,
    connectionAttempt,
  ]);

  const reconnect = useCallback((): void => {
    beginReconciliationWindow();
    providerRef.current?.disconnect();
    setRemoteStatus("connecting");
    setConnectionMessage("");
    setParticipants([]);
    setConnectionAttempt((attempt) => attempt + 1);
  }, [beginReconciliationWindow]);

  useEffect(() => {
    const handleOnline = (): void => reconnect();
    const handleOffline = (): void => {
      beginReconciliationWindow();
      providerRef.current?.disconnect();
      setRemoteStatus("offline");
      setParticipants([]);
      setConnectionMessage(
        "The network is unavailable. Your local notes remain open.",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [beginReconciliationWindow, canEdit, reconnect]);

  const prepareForSignOut = useCallback(async (): Promise<void> => {
    isSigningOutRef.current = true;
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

  const keepMergedNote = useCallback((reviewId: number): void => {
    setConflictReview((currentReview) =>
      currentReview?.id === reviewId ? null : currentReview,
    );
    setReconciliationMessage(
      "Merged note kept. Your offline and shared changes remain live together.",
    );
  }, []);

  const finishConflictReview = useCallback(
    (reviewId: number, message: string): void => {
      setConflictReview((currentReview) =>
        currentReview?.id === reviewId ? null : currentReview,
      );
      setReconciliationMessage(message);
    },
    [],
  );

  const useOfflineDraft = useCallback(
    async (review: ConflictReview): Promise<ConflictResolutionResult> => {
      if (!providerRef.current?.synced) {
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

  const openAssistant = (): void => {
    setAssistantSourceText(editorRef.current?.captureDraft()?.text ?? "");
    chooseTool("assistant");
  };

  return (
    <main
      className="room-shell"
      onPointerMove={(event) => {
        if (isPresenting) {
          updateCursor(
            event.clientX / Math.max(1, window.innerWidth),
            event.clientY / Math.max(1, window.innerHeight),
          );
        }
      }}
    >
      <header className="room-header">
        <div className="brand-lockup">
          <Link
            className="brand-home-link"
            href="/rooms"
            aria-label="All study rooms"
          >
            <QollabBrandLogo />
          </Link>
          <span className="brand-divider" aria-hidden="true" />
          <label className="room-switcher" aria-label="Switch study room">
            <select
              value={roomId}
              onChange={(event) => router.push(`/rooms/${event.target.value}`)}
            >
              {availableRooms.map((room) => (
                <option value={room.slug} key={room.slug}>
                  {room.name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" size={15} />
          </label>
        </div>

        <div className="header-actions">
          <Link
            className="icon-button mobile-only"
            href="/rooms"
            aria-label="All study rooms"
          >
            <PanelLeft aria-hidden="true" size={18} />
          </Link>
          <Link
            className="icon-button mobile-only"
            href={`/rooms/${roomId}/breakouts`}
            aria-label="Breakout rooms"
          >
            <Split aria-hidden="true" size={18} />
          </Link>
          <Link
            className="icon-button"
            href="/rooms"
            aria-label="All study rooms"
          >
            <House aria-hidden="true" size={18} />
          </Link>
          <div
            className="participant-stack"
            aria-label={`${participants.length} active participants`}
          >
            {participants.slice(0, 3).map((participant) => (
              <span
                className="participant-avatar"
                key={participant.clientId}
                style={{ backgroundColor: participant.color }}
                title={participant.name}
              >
                {participant.name.charAt(0)}
              </span>
            ))}
          </div>
          {canEdit ? (
            <button
              aria-pressed={isPresenting}
              aria-label={
                isPresenting
                  ? "Stop presenting"
                  : "Start presenting this workspace"
              }
              className={`presentation-control${isPresenting ? " presentation-control--active" : ""}`}
              onClick={isPresenting ? stopPresenting : startPresenting}
              type="button"
            >
              <Presentation aria-hidden="true" size={16} />
              {isPresenting ? "Stop presenting" : "Present"}
            </button>
          ) : (
            <button
              aria-pressed={isFollowingPresenter}
              aria-label={
                isFollowingPresenter && presentation
                  ? `Stop following ${presentation.presenterName}`
                  : presentation
                    ? `Follow ${presentation.presenterName}`
                    : "No active presenter"
              }
              className={`presentation-control${isFollowingPresenter ? " presentation-control--following" : ""}`}
              disabled={!presentation}
              onClick={() => {
                if (isFollowingPresenter) {
                  setFollowingPresenterId(null);
                  setShowFollowPrompt(false);
                } else {
                  followPresenter();
                }
              }}
              type="button"
            >
              <Eye aria-hidden="true" size={16} />
              {isFollowingPresenter && presentation
                ? `Following ${presentation.presenterName}`
                : presentation
                  ? `Follow ${presentation.presenterName}`
                  : "No presenter"}
            </button>
          )}
          {currentUserRole === "owner" ? (
            <Link className="invite-button" href={`/rooms/${roomId}/settings`}>
              <UsersRound aria-hidden="true" size={16} />
              Manage
            </Link>
          ) : (
            <span className="header-room-context">
              {isPublic ? (
                <Globe2 aria-hidden="true" size={14} />
              ) : (
                <LockKeyhole aria-hidden="true" size={14} />
              )}
              {currentUserRole}
            </span>
          )}
          <SignOutButton
            beforeSignOut={prepareForSignOut}
            userId={currentUser.id}
          />
        </div>
      </header>

      <nav className="mobile-workspace-tabs" aria-label="Room workspace">
        <button
          aria-pressed={activeTool === "notes"}
          onClick={() => chooseTool("notes")}
          type="button"
        >
          <BookOpenText aria-hidden="true" size={17} />
          Notes
        </button>
        <button
          aria-pressed={activeTool === "pdf"}
          onClick={() => chooseTool("pdf")}
          type="button"
        >
          <FileText aria-hidden="true" size={17} />
          PDF
        </button>
        <button
          aria-pressed={activeTool === "whiteboard"}
          onClick={() => chooseTool("whiteboard")}
          type="button"
        >
          <PanelsTopLeft aria-hidden="true" size={17} />
          Board
        </button>
        <button
          aria-pressed={activeTool === "assistant"}
          onClick={openAssistant}
          type="button"
        >
          <BrainCircuit aria-hidden="true" size={17} />
          AI
        </button>
      </nav>
      <div className="mobile-collaboration-control">
        {currentUserRole === "viewer" ? (
          <ViewerCollaborationStatus enabled={viewerCanCollaborate} />
        ) : (
          <ViewerCollaborationToggle
            enabled={viewerCanCollaborate}
            onEnabledChange={setViewerCanCollaborate}
            roomSlug={roomId}
          />
        )}
      </div>

      <div
        className={`room-body${activeTool === "notes" ? " room-body--notes" : " room-body--study-tool"}${activeTool === "notes" && isVersionHistoryCollapsed ? " room-body--history-collapsed" : ""}`}
      >
        <aside
          className="room-sidebar"
          id="room-menu-sidebar"
          aria-label="Study room navigation"
        >
          <div className="sidebar-section">
            <p className="sidebar-label">Study rooms</p>
            <nav className="sidebar-nav">
              {availableRooms.map((room) => (
                <Link
                  className={`sidebar-link${room.slug === roomId ? " sidebar-link--active" : ""}`}
                  href={`/rooms/${room.slug}`}
                  key={room.slug}
                >
                  <BookOpenText aria-hidden="true" size={17} />
                  {room.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Workspace</p>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-link${activeTool === "notes" ? " sidebar-link--active" : ""}`}
                onClick={() => chooseTool("notes")}
                type="button"
              >
                <BookOpenText aria-hidden="true" size={17} />
                Shared notes
              </button>
              <button
                className={`sidebar-link${activeTool === "pdf" ? " sidebar-link--active" : ""}`}
                onClick={() => chooseTool("pdf")}
                type="button"
              >
                <FileText aria-hidden="true" size={17} />
                PDF annotation
              </button>
              <button
                className={`sidebar-link${activeTool === "whiteboard" ? " sidebar-link--active" : ""}`}
                onClick={() => chooseTool("whiteboard")}
                type="button"
              >
                <PanelsTopLeft aria-hidden="true" size={17} />
                Whiteboard
              </button>
              <button
                className={`sidebar-link${activeTool === "assistant" ? " sidebar-link--active" : ""}`}
                onClick={openAssistant}
                type="button"
              >
                <BrainCircuit aria-hidden="true" size={17} />
                AI study assistant
              </button>
            </nav>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Collaboration</p>
            <nav className="sidebar-nav">
              <Link
                className="sidebar-link"
                href={`/rooms/${roomId}/breakouts`}
              >
                <Split aria-hidden="true" size={17} />
                Breakouts
                <span>{breakoutRoomCount}</span>
              </Link>
            </nav>
            {currentUserRole === "viewer" ? (
              <ViewerCollaborationStatus enabled={viewerCanCollaborate} />
            ) : (
              <ViewerCollaborationToggle
                enabled={viewerCanCollaborate}
                onEnabledChange={setViewerCanCollaborate}
                roomSlug={roomId}
              />
            )}
          </div>

          <div className="sidebar-footer">
            <div
              className="current-user"
              style={
                {
                  "--user-color": connection?.user.color,
                } as React.CSSProperties
              }
            >
              <span>{connection?.user.name.charAt(0) ?? "?"}</span>
              <div>
                <strong>{connection?.user.name ?? "Joining…"}</strong>
                <small>You · {currentUserRole}</small>
              </div>
            </div>
          </div>
        </aside>

        {activeTool === "notes" ? (
          <section
            className="editor-workspace"
            id="notes"
            aria-label="Shared notes workspace"
            onScrollCapture={handleNotesScroll}
            ref={notesWorkspaceRef}
          >
            {conflictReview ? (
              <ConflictReviewPanel
                canUseOfflineDraft={remoteActionsAvailable}
                onKeepMerged={keepMergedNote}
                onResolved={finishConflictReview}
                onUseOfflineDraft={useOfflineDraft}
                review={conflictReview}
              />
            ) : reconciliationMessage ? (
              <p className="reconciliation-message" role="status">
                <CheckCircle2 aria-hidden="true" size={16} />
                {reconciliationMessage}
              </p>
            ) : null}

            {connection ? (
              <RichTextEditor
                ref={editorRef}
                document={connection.document}
                editable={canEdit}
                provider={connection.provider}
                syncLabel={
                  remoteStatus === "synced" ? "Live" : remoteCopy[remoteStatus]
                }
                syncStatus={remoteStatus}
                user={connection.user}
              />
            ) : (
              <div className="editor-initializing" role="status">
                <RefreshCw className="spin" aria-hidden="true" size={18} />
                Opening the collaborative document…
              </div>
            )}

            {(remoteStatus === "error" || remoteStatus === "offline") && (
              <div
                className="connection-callout"
                role={remoteStatus === "error" ? "alert" : "status"}
              >
                <Radio aria-hidden="true" size={18} />
                <div>
                  <strong>
                    {remoteStatus === "offline"
                      ? "You are editing offline."
                      : "The live room is temporarily unavailable."}
                  </strong>
                  <p>{connectionMessage || remoteCopy[remoteStatus]}</p>
                </div>
                <button type="button" onClick={reconnect}>
                  Retry now
                </button>
              </div>
            )}

            {localStatus === "unavailable" ? (
              <div
                className="connection-callout connection-callout--storage"
                role="status"
              >
                <Radio aria-hidden="true" size={18} />
                <div>
                  <strong>Local saving is unavailable.</strong>
                  <p>{localMessage}</p>
                </div>
              </div>
            ) : null}

            {!canEdit && localMessage ? (
              <div
                className="connection-callout connection-callout--storage"
                role="alert"
              >
                <Radio aria-hidden="true" size={18} />
                <div>
                  <strong>The saved notes snapshot is unavailable.</strong>
                  <p>{localMessage}</p>
                </div>
              </div>
            ) : null}
          </section>
        ) : (
          <section
            className={`study-tool-workspace${activeTool === "pdf" || activeTool === "whiteboard" ? " study-tool-workspace--visual" : ""}`}
          >
            {activeTool === "pdf" ? (
              <PdfStudyTool
                canEdit={canEdit}
                canManageAsset={canManagePdf}
                currentUser={currentUser}
                initialAsset={initialPdfAsset}
                initialState={initialDocumentStates.pdf}
                roomId={roomId}
              />
            ) : activeTool === "whiteboard" ? (
              <WhiteboardStudyTool
                canEdit={canEdit}
                currentUser={currentUser}
                initialState={initialDocumentStates.whiteboard}
                roomId={roomId}
              />
            ) : (
              <AiStudyTool
                onReturnToNotes={() => chooseTool("notes")}
                roomId={roomId}
                sourceText={assistantSourceText}
              />
            )}
          </section>
        )}

        {!canEdit &&
        !isFollowingPresenter &&
        showFollowPrompt &&
        presentation ? (
          <div
            aria-labelledby="follow-presenter-title"
            className="follow-presenter-dialog"
            role="dialog"
          >
            <div className="follow-presenter-dialog__icon" aria-hidden="true">
              <Presentation size={20} />
            </div>
            <div className="follow-presenter-dialog__copy">
              <strong id="follow-presenter-title">Lost the presenter?</strong>
              <p>
                {presentation.presenterName} is now presenting{" "}
                {presentation.workspace === "notes"
                  ? "Shared Notes"
                  : presentation.workspace === "pdf"
                    ? "PDF Annotation"
                    : "the Whiteboard"}
                . Follow to move with them automatically.
              </p>
            </div>
            <div className="follow-presenter-dialog__actions">
              <button onClick={() => setShowFollowPrompt(false)} type="button">
                Not now
              </button>
              <button onClick={followPresenter} type="button">
                <Eye aria-hidden="true" size={15} /> Follow presenter
              </button>
            </div>
          </div>
        ) : null}

        {!canEdit && isFollowingPresenter && presentation?.cursor ? (
          <div
            aria-hidden="true"
            className="presenter-cursor"
            style={{
              left: `${presentation.cursor.x * 100}vw`,
              top: `${presentation.cursor.y * 100}vh`,
            }}
          >
            <MousePointer2 fill="currentColor" size={22} />
            <span>{presentation.presenterName}</span>
          </div>
        ) : null}

        {activeTool === "notes" ? (
          <>
            <button
              aria-controls="version-history-sidebar"
              aria-expanded={!isVersionHistoryCollapsed}
              aria-label={
                isVersionHistoryCollapsed
                  ? "Expand Version History sidebar"
                  : "Collapse Version History sidebar"
              }
              className={`sidebar-edge-toggle history-sidebar-toggle${isVersionHistoryCollapsed ? " history-sidebar-toggle--collapsed" : ""}`}
              onClick={() =>
                setIsVersionHistoryCollapsed((isCollapsed) => !isCollapsed)
              }
              title={
                isVersionHistoryCollapsed
                  ? "Expand Version History sidebar"
                  : "Collapse Version History sidebar"
              }
              type="button"
            >
              {isVersionHistoryCollapsed ? (
                <ChevronLeft aria-hidden="true" size={18} strokeWidth={2} />
              ) : (
                <ChevronRight aria-hidden="true" size={18} strokeWidth={2} />
              )}
            </button>

            <VersionHistoryPanel
              currentUserId={currentUser.id}
              editorRef={editorRef}
              initialVersions={initialVersions}
              remoteActionsAvailable={remoteActionsAvailable}
              roomId={roomId}
            />
          </>
        ) : null}
      </div>
    </main>
  );
}

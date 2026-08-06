"use client";

import {
  ArrowLeft,
  BookOpenText,
  Check,
  Copy,
  DoorOpen,
  FileText,
  House,
  MessageCircleQuestion,
  PanelsTopLeft,
  Radio,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { BreakoutQaPanel } from "@/components/collaboration/breakout-qa-panel";
import { RichTextEditor } from "@/components/collaboration/rich-text-editor";
import {
  ViewerCollaborationStatus,
  ViewerCollaborationToggle,
} from "@/components/rooms/viewer-collaboration-toggle";
import { useViewerCollaboration } from "@/hooks/use-viewer-collaboration";
import { buildBreakoutCollaborativeDocumentName } from "@/lib/collaboration/document-name";
import type { BreakoutRoomWorkspace as BreakoutWorkspace } from "@/lib/breakout-rooms/repository";
import type { RoomDocumentKind } from "@/lib/rooms/repository";

interface BreakoutRoomWorkspaceProps {
  breakout: BreakoutWorkspace;
  currentUser: {
    displayName: string;
    id: string;
  };
}

interface StudyUser {
  clientId: number;
  color: string;
  name: string;
}

interface Connection {
  document: Y.Doc;
  provider: WebsocketProvider;
  user: StudyUser;
}

type SyncStatus = "connecting" | "error" | "synced" | "viewing";

const PdfStudyTool = dynamic(
  () => import("@/components/collaboration/pdf-study-tool"),
  {
    loading: () => <BreakoutToolLoading label="Opening PDF Annotation…" />,
    ssr: false,
  },
);
const WhiteboardStudyTool = dynamic(
  () => import("@/components/collaboration/whiteboard-study-tool"),
  {
    loading: () => <BreakoutToolLoading label="Opening the Whiteboard…" />,
    ssr: false,
  },
);

const USER_COLORS = [
  "#3871c2",
  "#f04623",
  "#9c614f",
  "#7c5bb3",
  "#16866d",
  "#d98b22",
];

async function prepareBreakoutSignOut(): Promise<void> {
  await Promise.resolve();
}

function BreakoutToolLoading({ label }: { label: string }): React.ReactElement {
  return (
    <div className="editor-initializing" role="status">
      <RefreshCw className="spin" aria-hidden="true" size={18} />
      {label}
    </div>
  );
}

function readParticipants(provider: WebsocketProvider): StudyUser[] {
  const participants: StudyUser[] = [];

  provider.awareness.getStates().forEach((state: unknown, clientId) => {
    if (!state || typeof state !== "object" || !("user" in state)) return;
    const user = (state as { user?: Partial<StudyUser> }).user;

    if (typeof user?.name !== "string" || typeof user.color !== "string") {
      return;
    }

    participants.push({ clientId, color: user.color, name: user.name });
  });

  return participants.sort((first, second) =>
    first.name.localeCompare(second.name),
  );
}

export function BreakoutRoomWorkspace({
  breakout,
  currentUser,
}: BreakoutRoomWorkspaceProps): React.ReactElement {
  const { setViewerCanCollaborate, viewerCanCollaborate } =
    useViewerCollaboration({
      initialEnabled: breakout.viewerCanCollaborate,
      role: breakout.role,
      roomSlug: breakout.parentRoomSlug,
    });
  const canManagePdf = breakout.role !== "viewer";
  const canEdit = canManagePdf || viewerCanCollaborate;
  const [activeTool, setActiveTool] = useState<RoomDocumentKind>("notes");
  const [connection, setConnection] = useState<Connection | null>(null);
  const [participants, setParticipants] = useState<StudyUser[]>([]);
  const [status, setStatus] = useState<SyncStatus>(
    canEdit ? "connecting" : "viewing",
  );
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const providerRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    let active = true;
    const document = new Y.Doc();

    if (breakout.initialDocumentState) {
      try {
        const binary = window.atob(breakout.initialDocumentState);
        Y.applyUpdate(
          document,
          Uint8Array.from(binary, (character) => character.charCodeAt(0)),
        );
      } catch {
        queueMicrotask(() => {
          if (active) {
            setMessage("The saved breakout notes could not be decoded.");
          }
        });
      }
    }

    const user: StudyUser = {
      clientId: document.clientID,
      color: USER_COLORS[document.clientID % USER_COLORS.length],
      name: currentUser.displayName || "Study partner",
    };
    const provider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_YJS_WS_URL ?? "ws://localhost:1234",
      buildBreakoutCollaborativeDocumentName(
        breakout.parentRoomSlug,
        breakout.code,
      ),
      document,
      {
        connect: false,
        maxBackoffTime: 4_000,
        params: {},
        resyncInterval: 2_500,
      },
    );

    const handleStatus = ({
      status: connectionStatus,
    }: {
      status: "connected" | "connecting" | "disconnected";
    }): void => {
      if (!active) return;
      setStatus(
        connectionStatus === "connected"
          ? canEdit
            ? "connecting"
            : "viewing"
          : "connecting",
      );
    };
    const handleSync = (synced: boolean): void => {
      if (!active) return;
      setStatus(synced ? (canEdit ? "synced" : "viewing") : "connecting");
      if (synced) setMessage("");
    };
    const handleError = (): void => {
      if (!active) return;
      setStatus("error");
      setMessage("The live breakout connection needs attention.");
    };
    const handleAwareness = (): void => {
      if (active) setParticipants(readParticipants(provider));
    };

    provider.on("status", handleStatus);
    provider.on("sync", handleSync);
    provider.on("connection-error", handleError);
    provider.awareness.on("change", handleAwareness);
    provider.awareness.setLocalStateField("user", user);
    providerRef.current = provider;
    queueMicrotask(() => {
      if (active) setConnection({ document, provider, user });
    });

    return () => {
      active = false;
      provider.off("status", handleStatus);
      provider.off("sync", handleSync);
      provider.off("connection-error", handleError);
      provider.awareness.off("change", handleAwareness);
      provider.destroy();
      document.destroy();
      if (providerRef.current === provider) providerRef.current = null;
    };
  }, [
    breakout.code,
    breakout.initialDocumentState,
    breakout.parentRoomSlug,
    canEdit,
    currentUser.displayName,
  ]);

  useEffect(() => {
    if (!connection) return;

    let active = true;
    const abortController = new AbortController();
    const provider = providerRef.current;

    if (!provider) return;

    const connect = async (): Promise<void> => {
      setStatus(canEdit ? "connecting" : "viewing");
      const response = await fetch("/api/auth/access-token", {
        cache: "no-store",
        credentials: "same-origin",
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Your secure breakout session could not be opened.");
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

    void connect().catch((error: unknown) => {
      if (!active || abortController.signal.aborted) return;
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "The secure breakout session could not be opened.",
      );
    });

    return () => {
      active = false;
      abortController.abort();
      provider.disconnect();
    };
  }, [attempt, canEdit, connection]);

  const reconnect = useCallback((): void => {
    providerRef.current?.disconnect();
    setMessage("");
    setStatus(canEdit ? "connecting" : "viewing");
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, [canEdit]);

  const copyCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(breakout.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_800);
    } catch {
      setMessage(`Share this breakout code: ${breakout.code}`);
    }
  };

  const statusCopy: Record<SyncStatus, string> = {
    connecting: "Connecting to live notes",
    error: "Live sync needs attention",
    synced: "Live sync active",
    viewing: "Read-only breakout access",
  };

  return (
    <main className="breakout-workspace">
      <header className="room-header breakout-workspace__header">
        <div className="brand-lockup">
          <Link
            className="brand-home-link"
            href="/rooms"
            aria-label="All study rooms"
          >
            <QollabBrandLogo />
          </Link>
          <span className="brand-divider" aria-hidden="true" />
          <span className="breakout-workspace__parent">
            {breakout.parentRoomName}
          </span>
        </div>

        <div className="header-actions">
          <Link
            className="icon-button"
            href={`/rooms/${breakout.parentRoomSlug}`}
            aria-label={`Back to ${breakout.parentRoomName}`}
          >
            <House aria-hidden="true" size={18} />
          </Link>
          <div
            className="participant-stack"
            aria-label={`${participants.length} active participants`}
          >
            {participants.slice(0, 4).map((participant) => (
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
          <span className="header-room-context">
            <UsersRound aria-hidden="true" size={14} />
            {breakout.role}
          </span>
          <SignOutButton
            beforeSignOut={prepareBreakoutSignOut}
            userId={currentUser.id}
          />
        </div>
      </header>

      <nav
        className="mobile-workspace-tabs breakout-workspace__mobile-tabs"
        aria-label="Breakout workspace"
      >
        <button
          aria-pressed={activeTool === "notes"}
          onClick={() => {
            setActiveTool("notes");
            setQaOpen(false);
          }}
          type="button"
        >
          <BookOpenText aria-hidden="true" size={17} />
          Notes
        </button>
        <button
          aria-pressed={activeTool === "pdf"}
          onClick={() => {
            setActiveTool("pdf");
            setQaOpen(false);
          }}
          type="button"
        >
          <FileText aria-hidden="true" size={17} />
          PDF
        </button>
        <button
          aria-pressed={activeTool === "whiteboard"}
          onClick={() => {
            setActiveTool("whiteboard");
            setQaOpen(false);
          }}
          type="button"
        >
          <PanelsTopLeft aria-hidden="true" size={17} />
          Board
        </button>
        <button
          aria-pressed={qaOpen}
          onClick={() => setQaOpen(true)}
          type="button"
        >
          <MessageCircleQuestion aria-hidden="true" size={17} />
          Q&amp;A
        </button>
      </nav>
      <div className="mobile-collaboration-control breakout-workspace__mobile-collaboration">
        {breakout.role === "viewer" ? (
          <ViewerCollaborationStatus enabled={viewerCanCollaborate} />
        ) : (
          <ViewerCollaborationToggle
            enabled={viewerCanCollaborate}
            onEnabledChange={setViewerCanCollaborate}
            roomSlug={breakout.parentRoomSlug}
          />
        )}
      </div>

      <div
        className={`breakout-workspace__body${qaOpen ? " breakout-workspace__body--qa-open" : ""}`}
      >
        <aside
          className="room-sidebar breakout-workspace__sidebar"
          aria-label="Breakout room navigation"
        >
          <div className="sidebar-section">
            <p className="sidebar-label">Breakout room</p>
            <nav className="sidebar-nav">
              <Link
                className="sidebar-link"
                href={`/rooms/${breakout.parentRoomSlug}`}
              >
                <ArrowLeft aria-hidden="true" size={17} />
                Main room
              </Link>
            </nav>

            <div className="breakout-sidebar-code">
              <div>
                <small>Unique room code</small>
                <strong>{breakout.code}</strong>
              </div>
              <button
                aria-label={
                  copied
                    ? "Breakout code copied"
                    : `Copy breakout code ${breakout.code}`
                }
                onClick={() => void copyCode()}
                type="button"
              >
                {copied ? (
                  <Check aria-hidden="true" size={15} />
                ) : (
                  <Copy aria-hidden="true" size={15} />
                )}
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Workspace</p>
            <nav className="sidebar-nav">
              <button
                className={`sidebar-link${activeTool === "notes" ? " sidebar-link--active" : ""}`}
                onClick={() => setActiveTool("notes")}
                type="button"
              >
                <BookOpenText aria-hidden="true" size={17} />
                Shared notes
              </button>
              <button
                className={`sidebar-link${activeTool === "pdf" ? " sidebar-link--active" : ""}`}
                onClick={() => setActiveTool("pdf")}
                type="button"
              >
                <FileText aria-hidden="true" size={17} />
                PDF annotation
              </button>
              <button
                className={`sidebar-link${activeTool === "whiteboard" ? " sidebar-link--active" : ""}`}
                onClick={() => setActiveTool("whiteboard")}
                type="button"
              >
                <PanelsTopLeft aria-hidden="true" size={17} />
                Whiteboard
              </button>
            </nav>
          </div>

          <div className="sidebar-section">
            <p className="sidebar-label">Collaboration</p>
            {breakout.role === "viewer" ? (
              <ViewerCollaborationStatus enabled={viewerCanCollaborate} />
            ) : (
              <ViewerCollaborationToggle
                enabled={viewerCanCollaborate}
                onEnabledChange={setViewerCanCollaborate}
                roomSlug={breakout.parentRoomSlug}
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
                <small>You · {breakout.role}</small>
              </div>
            </div>
          </div>
        </aside>

        <section
          className={`breakout-workspace__content breakout-workspace__content--${activeTool}`}
        >
          <button
            aria-label={
              copied
                ? "Breakout code copied"
                : `Copy breakout code ${breakout.code}`
            }
            className="breakout-workspace__mobile-code"
            onClick={() => void copyCode()}
            type="button"
          >
            {copied ? (
              <Check aria-hidden="true" size={15} />
            ) : (
              <Copy aria-hidden="true" size={15} />
            )}
            {breakout.code}
          </button>

          {activeTool === "notes" ? (
            <>
              <div className="breakout-workspace__status">
                <span
                  className={`connection-badge connection-badge--${status}`}
                >
                  <span className="connection-dot" />
                  {statusCopy[status]}
                </span>
                <span>
                  <DoorOpen aria-hidden="true" size={14} />
                  {participants.length} active
                </span>
                {status === "error" ? (
                  <button onClick={reconnect} type="button">
                    <RefreshCw aria-hidden="true" size={14} />
                    Reconnect
                  </button>
                ) : (
                  <span>
                    <Radio aria-hidden="true" size={14} />
                    Changes save automatically
                  </span>
                )}
              </div>

              {message ? (
                <p className="breakout-workspace__message" role="alert">
                  {message}
                </p>
              ) : null}

              {connection ? (
                <RichTextEditor
                  document={connection.document}
                  editable={canEdit}
                  provider={connection.provider}
                  syncLabel={statusCopy[status]}
                  syncStatus={status}
                  user={connection.user}
                />
              ) : (
                <BreakoutToolLoading label="Preparing breakout notes…" />
              )}
            </>
          ) : null}

          {activeTool === "pdf" ? (
            <section
              className="breakout-workspace__tool breakout-workspace__tool--visual"
              aria-label="Breakout PDF Annotation"
            >
              <PdfStudyTool
                breakoutCode={breakout.code}
                canEdit={canEdit}
                canManageAsset={canManagePdf}
                currentUser={currentUser}
                initialAsset={breakout.pdfAsset}
                initialState={breakout.initialDocumentStates.pdf}
                pdfApiPath={`/api/rooms/${breakout.parentRoomSlug}/breakouts/${breakout.code}/pdf`}
                roomId={breakout.parentRoomSlug}
              />
            </section>
          ) : null}

          {activeTool === "whiteboard" ? (
            <section
              className="breakout-workspace__tool breakout-workspace__tool--visual"
              aria-label="Breakout Whiteboard"
            >
              <WhiteboardStudyTool
                breakoutCode={breakout.code}
                canEdit={canEdit}
                currentUser={currentUser}
                initialState={breakout.initialDocumentStates.whiteboard}
                roomId={breakout.parentRoomSlug}
              />
            </section>
          ) : null}
        </section>
        <BreakoutQaPanel
          activeTool={activeTool}
          canAsk={canEdit}
          document={connection?.document ?? null}
          onClose={() => setQaOpen(false)}
          participantCount={participants.length}
          user={
            connection
              ? {
                  color: connection.user.color,
                  id: currentUser.id,
                  name: connection.user.name,
                }
              : null
          }
        />
      </div>
    </main>
  );
}

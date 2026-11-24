"use client";

import { Button, IconButton } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpenText,
  Copy,
  FileText,
  MessageCircleQuestion,
  PanelsTopLeft,
  RefreshCw,
  UsersRound,
  X,
} from "@/components/ui/icons";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import { QollabAppShell } from "@/components/shell/qollab-app-shell";
import { QollabSideNavigation } from "@/components/shell/qollab-side-navigation";
import { ResponsiveContextPanel } from "@/components/shell/responsive-context-panel";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  createProviderLifecycle,
  type ProviderLifecycle,
} from "@/lib/collaboration/provider-lifecycle";
import { useCallback, useEffect, useRef, useState } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

import { SidebarAccountMenu } from "@/components/auth/sidebar-account-menu";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { BreakoutQaPanel } from "@/components/collaboration/breakout-qa-panel";
import { RichTextEditor } from "@/components/collaboration/rich-text-editor";
import { RoomHeader } from "@/components/collaboration/room-header";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { WORKSPACE_FLAT_CONTROLS } from "@/components/shell/workspace-controls";
import { useToast } from "@/components/ui/toast";
import {
  ViewerCollaborationStatus,
  ViewerCollaborationToggle,
} from "@/components/rooms/viewer-collaboration-toggle";
import { useViewerCollaboration } from "@/hooks/use-viewer-collaboration";
import { buildBreakoutCollaborativeDocumentName } from "@/lib/collaboration/document-name";
import { getCollaborationWebSocketEndpoint } from "@/lib/collaboration/websocket-endpoint";
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

const USER_COLORS = ["#7352FA", "#f04623", "#9c614f", "#16866d", "#d98b22"];

function BreakoutToolLoading({ label }: { label: string }): React.ReactElement {
  return (
    <LoadingIndicator
      className="editor-initializing"
      label={label}
      size="panel"
    />
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
  const { success } = useToast();
  const collaborationEndpoint = getCollaborationWebSocketEndpoint();
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
  const [qaOpen, setQaOpen] = useState(false);
  const [qaDraft, setQaDraft] = useState("");
  const qaTriggerRef = useRef<HTMLButtonElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const [isRoomControlsOpen, setIsRoomControlsOpen] = useState(false);
  const lifecycleRef = useRef<ProviderLifecycle | null>(null);
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
      collaborationEndpoint.url,
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

    const lifecycle = createProviderLifecycle({
      provider,
      authentication: collaborationEndpoint.authentication,
      onStatus: handleStatus,
      onSync: handleSync,
      onError: handleError,
      onAwareness: handleAwareness,
      onOffline: () => {
        setStatus("error");
        setMessage(
          "You are offline. Keep this tab open until live sync returns.",
        );
        setParticipants([]);
      },
      onConnecting: () => {
        setStatus("connecting");
        setMessage("");
      },
    });
    lifecycleRef.current = lifecycle;
    void lifecycle.reconnect();
    provider.awareness.setLocalStateField("user", user);
    providerRef.current = provider;
    queueMicrotask(() => {
      if (active) setConnection({ document, provider, user });
    });

    return () => {
      active = false;
      lifecycle.dispose();
      if (lifecycleRef.current === lifecycle) lifecycleRef.current = null;
      provider.destroy();
      document.destroy();
      if (providerRef.current === provider) providerRef.current = null;
    };
  }, [
    breakout.code,
    breakout.initialDocumentState,
    breakout.parentRoomSlug,
    canEdit,
    collaborationEndpoint.url,
    collaborationEndpoint.authentication,
    currentUser.displayName,
  ]);

  const reconnect = useCallback((): void => {
    void lifecycleRef.current?.reconnect();
  }, []);

  const prepareBreakoutSignOut = useCallback(async (): Promise<void> => {
    lifecycleRef.current?.dispose();
    providerRef.current?.destroy();
    providerRef.current = null;
  }, []);

  const copyCode = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(breakout.code);
      setMessage("");
      success("Breakout code copied.");
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

  // The labelled button would push the breakout name out of the phone header.
  const isPhone = useMediaQuery("(max-width: 639px)");
  const toolLabels: Record<RoomDocumentKind, string> = {
    notes: "Shared notes",
    pdf: "PDF annotation",
    whiteboard: "Whiteboard",
  };

  const chooseTool = (tool: RoomDocumentKind): void => {
    setActiveTool(tool);
    setIsMobileNavigationOpen(false);
  };
  const closeQa = (): void => {
    setQaOpen(false);
    qaTriggerRef.current?.focus();
  };
  const collaborationControl =
    breakout.role === "viewer" ? (
      <ViewerCollaborationStatus compact enabled={viewerCanCollaborate} />
    ) : (
      <ViewerCollaborationToggle
        compact
        enabled={viewerCanCollaborate}
        onEnabledChange={setViewerCanCollaborate}
        roomSlug={breakout.parentRoomSlug}
      />
    );
  const accountMenu = (
    <SidebarAccountMenu
      beforeSignOut={prepareBreakoutSignOut}
      displayName={connection?.user.name ?? currentUser.displayName}
      role={breakout.role}
      userColor={connection?.user.color}
      userId={currentUser.id}
    />
  );

  return (
    <VStack className="h-dvh min-h-0 min-w-0 bg-surface text-primary">
      <QollabAppShell
        isContentScrollable={false}
        mobileNavigation={{
          isOpen: isMobileNavigationOpen,
          onOpenChange: (open) => {
            setIsMobileNavigationOpen(open);
            if (open) setIsSidebarCollapsed(false);
          },
        }}
        header={
          <RoomHeader
            roomName={breakout.name}
            roomIconUrl={null}
            isPublic={false}
            role={breakout.role}
            toolLabel={`${toolLabels[activeTool]} · ${breakout.parentRoomName}`}
            syncStatus={status}
            syncLabel={status === "synced" ? "Live" : statusCopy[status]}
            actions={
              <HStack gap={1} vAlign="center">
                {status === "error" ? (
                  <Button
                    label="Reconnect"
                    variant="ghost"
                    icon={<RefreshCw aria-hidden="true" size={16} />}
                    isIconOnly={isPhone}
                    tooltip={isPhone ? "Reconnect" : undefined}
                    onClick={reconnect}
                  />
                ) : null}
                <IconButton
                  as={Link}
                  href={`/rooms/${breakout.parentRoomSlug}`}
                  label={`Back to ${breakout.parentRoomName}`}
                  icon={<ArrowLeft aria-hidden="true" size={18} />}
                />
                <IconButton
                  label="Breakout room controls"
                  icon={<UsersRound aria-hidden="true" size={18} />}
                  onClick={() => setIsRoomControlsOpen(true)}
                />
                <IconButton
                  ref={qaTriggerRef}
                  label="Open Q and A"
                  aria-controls="breakout-qa-panel"
                  aria-expanded={qaOpen}
                  icon={<MessageCircleQuestion aria-hidden="true" size={18} />}
                  onClick={() => setQaOpen(true)}
                />
              </HStack>
            }
          />
        }
        sideNavigation={
          <QollabSideNavigation
            label="Breakout room navigation"
            isCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
            collapsedHeader={<QollabBrandLogo variant="mark" />}
            header={
              <Link
                href="/rooms"
                aria-label="All study rooms"
                className="block p-3"
              >
                <QollabBrandLogo />
              </Link>
            }
            linkComponent={Link}
            topContent={
              !isSidebarCollapsed ? (
                <VStack padding={3}>
                  <HStack
                    gap={3}
                    vAlign="center"
                    className="qollab-room-card rounded-2xl bg-surface p-3"
                  >
                    <VStack gap={0} className="min-w-0 flex-1">
                      <Text type="supporting">Breakout code</Text>
                      <Text className="font-mono" weight="semibold">
                        {breakout.code}
                      </Text>
                    </VStack>
                    <IconButton
                      label="Copy breakout code"
                      tooltip="Copy code"
                      icon={<Copy aria-hidden="true" size={16} />}
                      onClick={() => void copyCode()}
                    />
                  </HStack>
                </VStack>
              ) : undefined
            }
            sections={[
              {
                id: "room",
                title: "Breakout room",
                items: [
                  {
                    id: "parent",
                    label: "Main room",
                    href: `/rooms/${breakout.parentRoomSlug}`,
                    icon: ArrowLeft,
                    size: "lg",
                  },
                  {
                    id: "people",
                    label: "People",
                    icon: UsersRound,
                    onClick: () => setIsRoomControlsOpen(true),
                    size: "lg",
                  },
                ],
              },
              {
                id: "workspace",
                title: "Study tools",
                items: [
                  {
                    id: "notes",
                    label: "Shared notes",
                    icon: BookOpenText,
                    isSelected: activeTool === "notes",
                    onClick: () => chooseTool("notes"),
                    size: "lg",
                  },
                  {
                    id: "pdf",
                    label: "PDF annotation",
                    icon: FileText,
                    isSelected: activeTool === "pdf",
                    onClick: () => chooseTool("pdf"),
                    size: "lg",
                  },
                  {
                    id: "whiteboard",
                    label: "Whiteboard",
                    icon: PanelsTopLeft,
                    isSelected: activeTool === "whiteboard",
                    onClick: () => chooseTool("whiteboard"),
                    size: "lg",
                  },
                ],
              },
            ]}
            extraContent={
              !isSidebarCollapsed ? (
                <VStack paddingInline={1} className={WORKSPACE_FLAT_CONTROLS}>
                  {collaborationControl}
                </VStack>
              ) : undefined
            }
            footer={
              !isSidebarCollapsed ? (
                <VStack padding={2} className={WORKSPACE_FLAT_CONTROLS}>
                  {accountMenu}
                </VStack>
              ) : undefined
            }
            footerIcons={
              // Expanded, "People" is a labelled item in the Breakout room group instead.
              isSidebarCollapsed ? (
                <IconButton
                  label="Breakout room controls"
                  icon={<UsersRound aria-hidden="true" size={18} />}
                  onClick={() => setIsRoomControlsOpen(true)}
                />
              ) : undefined
            }
          />
        }
        contextPanel={
          <ResponsiveContextPanel
            isOpen={qaOpen}
            onOpenChange={setQaOpen}
            label="Breakout room Q and A"
            fillContent
          >
            <BreakoutQaPanel
              activeTool={activeTool}
              canAsk={canEdit}
              document={connection?.document ?? null}
              draft={qaDraft}
              onDraftChange={setQaDraft}
              onClose={closeQa}
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
          </ResponsiveContextPanel>
        }
      >
        <VStack gap={0} className="h-full min-h-0 min-w-0 overflow-hidden">
          <HStack
            padding={3}
            className="md:hidden! shrink-0 border-b border-border"
          >
            <Selector
              label="Breakout workspace"
              isLabelHidden
              value={activeTool}
              onChange={(value) => chooseTool(value as RoomDocumentKind)}
              options={[
                { value: "notes", label: "Shared notes" },
                { value: "pdf", label: "PDF annotation" },
                { value: "whiteboard", label: "Whiteboard" },
              ]}
              width="100%"
            />
          </HStack>
          {message ? (
            <Text role="alert" className="shrink-0 bg-muted px-4 py-2">
              {message}
            </Text>
          ) : null}
          {activeTool === "notes" ? (
            <VStack
              as="section"
              aria-label="Breakout shared notes"
              className="flex-1 min-h-0 overflow-hidden"
              gap={0}
            >
              {connection ? (
                <RichTextEditor
                  document={connection.document}
                  editable={canEdit}
                  provider={connection.provider}
                  user={connection.user}
                />
              ) : (
                <BreakoutToolLoading label="Preparing breakout notes…" />
              )}
            </VStack>
          ) : (
            <VStack
              as="section"
              aria-label={
                activeTool === "pdf"
                  ? "Breakout PDF Annotation"
                  : "Breakout Whiteboard"
              }
              className="workspace-visual-tool flex-1 min-h-0 overflow-hidden bg-surface"
            >
              {activeTool === "pdf" ? (
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
              ) : (
                <WhiteboardStudyTool
                  breakoutCode={breakout.code}
                  canEdit={canEdit}
                  currentUser={currentUser}
                  initialState={breakout.initialDocumentStates.whiteboard}
                  roomId={breakout.parentRoomSlug}
                />
              )}
            </VStack>
          )}
        </VStack>
      </QollabAppShell>
      <Dialog
        isOpen={isRoomControlsOpen}
        onOpenChange={setIsRoomControlsOpen}
        aria-label="Breakout room controls"
        purpose="info"
        width={480}
      >
        {/* Flat sections split by quiet rules, like Google Meet's meeting
            details: no boxes inside the box, room to breathe. */}
        <VStack padding={6} gap={6}>
          <HStack hAlign="between" vAlign="start" gap={4}>
            <VStack gap={1.5} className="min-w-0">
              <Heading level={2} maxLines={2}>
                {breakout.name}
              </Heading>
              <Text type="supporting">
                Breakout room in {breakout.parentRoomName}
              </Text>
            </VStack>
            <IconButton
              label="Close room controls"
              icon={<X aria-hidden="true" size={18} />}
              onClick={() => setIsRoomControlsOpen(false)}
            />
          </HStack>

          <VStack gap={2}>
            <Text type="supporting" size="sm" weight="semibold">
              Breakout code
            </Text>
            <HStack hAlign="between" vAlign="center" gap={4}>
              <Text
                size="2xl"
                weight="semibold"
                className="font-mono tracking-widest"
              >
                {breakout.code}
              </Text>
              <IconButton
                label="Copy breakout code"
                icon={<Copy aria-hidden="true" size={18} />}
                onClick={() => void copyCode()}
              />
            </HStack>
          </VStack>

          <Divider />

          <VStack gap={4}>
            <HStack gap={2} vAlign="center" hAlign="between" wrap="wrap">
              <Text type="supporting" size="sm" weight="semibold">
                {participants.length === 1
                  ? "1 person here now"
                  : `${participants.length} people here now`}
              </Text>
              <Token
                size="sm"
                label={`You are ${breakout.role === "owner" ? "the owner" : breakout.role === "editor" ? "an editor" : "a viewer"}`}
              />
            </HStack>
            <VStack gap={3}>
              {participants.map((participant) => (
                <HStack gap={3} vAlign="center" key={participant.clientId}>
                  <Avatar name={participant.name} size="md" tooltip={false} />
                  <Text weight="medium">{participant.name}</Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
          {/* Viewer editing and the account menu live in the sidebar only. */}
        </VStack>
      </Dialog>
    </VStack>
  );
}

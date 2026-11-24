"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Button, IconButton } from "@/components/ui/button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import {
  BookOpenText,
  BrainCircuit,
  ChartColumnBig,
  ChevronsUpDown,
  FileText,
  History,
  MousePointer2,
  PanelsTopLeft,
  Presentation,
  Split,
  UsersRound,
  X,
} from "@/components/ui/icons";
import { QollabAppShell } from "@/components/shell/qollab-app-shell";
import { QollabSideNavigation } from "@/components/shell/qollab-side-navigation";
import { RoomHeader } from "@/components/collaboration/room-header";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useNotesCollaboration } from "@/lib/collaboration/use-notes-collaboration";
import { useCallback, useEffect, useRef, useState } from "react";

import { SidebarAccountMenu } from "@/components/auth/sidebar-account-menu";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { ConflictReviewPanel } from "@/components/collaboration/conflict-review-panel";
import {
  NOTES_SCROLL_REGION_CLASS,
  RichTextEditor,
} from "@/components/collaboration/rich-text-editor";
import { VersionHistoryPanel } from "@/components/collaboration/version-history-panel";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { WORKSPACE_FLAT_CONTROLS } from "@/components/shell/workspace-controls";
import {
  ViewerCollaborationStatus,
  ViewerCollaborationToggle,
} from "@/components/rooms/viewer-collaboration-toggle";
import type { VersionSummary } from "@/lib/version-history/types";
import type {
  RoomDocumentKind,
  RoomPdfAsset,
  RoomRole,
} from "@/lib/rooms/repository";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import {
  useRoomPresentation,
  type PresentedWorkspace,
} from "@/hooks/use-room-presentation";
import { useLiveActivities } from "@/components/collaboration/live/use-live-activities";
import { useViewerCollaboration } from "@/hooks/use-viewer-collaboration";

type WorkspaceTool = RoomDocumentKind | "assistant" | "live";

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
  roomIconUrl: string | null;
  roomName: string;
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
const LiveActivitiesTool = dynamic(
  () => import("@/components/collaboration/live/live-activities-tool"),
  {
    loading: () => <ToolLoading label="Opening live activities…" />,
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
    <LoadingIndicator
      className="editor-initializing"
      label={label}
      size="panel"
    />
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
  roomIconUrl,
  roomName,
}: CollaborativeRoomProps): React.ReactElement {
  const router = useRouter();
  const { setViewerCanCollaborate, viewerCanCollaborate } =
    useViewerCollaboration({
      initialEnabled: initialViewerCanCollaborate,
      role: currentUserRole,
      roomSlug: roomId,
    });
  const canManagePdf = currentUserRole !== "viewer";
  const canEdit = canManagePdf || viewerCanCollaborate;
  const [activeTool, setActiveTool] = useState<WorkspaceTool>("notes");
  const live = useLiveActivities({
    roomSlug: roomId,
    isActive: activeTool === "live",
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRoomControlsOpen, setIsRoomControlsOpen] = useState(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
  const isPhone = useMediaQuery("(max-width: 639px)");
  const [followingPresenterId, setFollowingPresenterId] = useState<
    string | null
  >(null);
  const [showFollowPrompt, setShowFollowPrompt] = useState(false);
  const [assistantSourceText, setAssistantSourceText] = useState("");
  const [isVersionHistoryCollapsed, setIsVersionHistoryCollapsed] =
    useState(true);
  const notesWorkspaceRef = useRef<HTMLElement>(null);
  const {
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
  } = useNotesCollaboration({
    canEdit,
    currentUser,
    initialState: initialDocumentStates.notes,
    roomId,
  });
  const presentedWorkspace: PresentedWorkspace =
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
  const followAccessibleLabel = presentation
    ? `${isFollowingPresenter ? "Stop following" : "Follow"} ${presentation.presenterName}`
    : "No active presenter";
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
      setIsMobileNavigationOpen(false);
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
        !target.classList.contains(NOTES_SCROLL_REGION_CLASS)
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
      const scroller = notesWorkspaceRef.current?.querySelector<HTMLElement>(
        `.${NOTES_SCROLL_REGION_CLASS}`,
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

  const openAssistant = (): void => {
    setAssistantSourceText(editorRef.current?.captureDraft()?.text ?? "");
    chooseTool("assistant");
  };

  const otherRooms = availableRooms.filter((room) => room.slug !== roomId);
  const toolLabels: Record<WorkspaceTool, string> = {
    notes: "Shared notes",
    pdf: "PDF annotation",
    whiteboard: "Whiteboard",
    assistant: "AI study assistant",
    live: "Live activities",
  };
  const liveSession = live.snapshot?.session;
  const showLivePrompt =
    activeTool !== "live" &&
    live.snapshot?.canHost === false &&
    Boolean(liveSession?.isAccepting) &&
    !live.snapshot?.myResponse;
  const collaborationControl =
    currentUserRole === "viewer" ? (
      <ViewerCollaborationStatus compact enabled={viewerCanCollaborate} />
    ) : (
      <ViewerCollaborationToggle
        compact
        enabled={viewerCanCollaborate}
        onEnabledChange={setViewerCanCollaborate}
        roomSlug={roomId}
      />
    );
  const selectTool = (value: string): void => {
    if (value === "assistant") openAssistant();
    else chooseTool(value as WorkspaceTool);
  };

  return (
    <VStack
      className="h-dvh min-h-0 bg-surface text-primary"
      onPointerMove={(event) => {
        if (isPresenting)
          updateCursor(
            event.clientX / Math.max(1, window.innerWidth),
            event.clientY / Math.max(1, window.innerHeight),
          );
      }}
    >
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
            roomName={roomName}
            roomIconUrl={roomIconUrl}
            isPublic={isPublic}
            role={currentUserRole}
            toolLabel={toolLabels[activeTool]}
            syncStatus={remoteStatus}
            syncLabel={
              remoteStatus === "synced" ? "Live" : remoteCopy[remoteStatus]
            }
            actions={
              <HStack gap={1} vAlign="center">
                {canEdit ? (
                  <Button
                    label={isPresenting ? "Stop presenting" : "Present"}
                    variant="ghost"
                    aria-pressed={isPresenting}
                    icon={<Presentation aria-hidden="true" size={16} />}
                    isIconOnly={isPhone}
                    tooltip={
                      isPhone
                        ? isPresenting
                          ? "Stop presenting"
                          : "Present"
                        : undefined
                    }
                    onClick={isPresenting ? stopPresenting : startPresenting}
                  />
                ) : (
                  <Button
                    label={
                      isPhone
                        ? followAccessibleLabel
                        : isFollowingPresenter
                          ? "Stop following"
                          : "Follow"
                    }
                    aria-label={isPhone ? undefined : followAccessibleLabel}
                    variant="ghost"
                    isDisabled={!presentation}
                    icon={<MousePointer2 aria-hidden="true" size={16} />}
                    isIconOnly={isPhone}
                    tooltip={isPhone ? followAccessibleLabel : undefined}
                    aria-pressed={isFollowingPresenter}
                    onClick={() => {
                      if (isFollowingPresenter) {
                        setFollowingPresenterId(null);
                        setShowFollowPrompt(false);
                      } else followPresenter();
                    }}
                  />
                )}
                {activeTool === "notes" ? (
                  <IconButton
                    label="Version history"
                    tooltip="Version history"
                    aria-controls="version-history-sidebar"
                    aria-expanded={!isVersionHistoryCollapsed}
                    icon={<History aria-hidden="true" size={16} />}
                    onClick={() =>
                      setIsVersionHistoryCollapsed((value) => !value)
                    }
                  />
                ) : null}
                {currentUserRole === "owner" ? (
                  <Button
                    as={Link}
                    href={`/rooms/${roomId}/settings`}
                    label="Manage"
                    variant="ghost"
                  />
                ) : null}
              </HStack>
            }
          />
        }
        sideNavigation={
          <QollabSideNavigation
            footerIcons={
              // Expanded, "People" is a labelled item in the Room group instead.
              isSidebarCollapsed ? (
                <Button
                  label="People and room"
                  isIconOnly
                  icon={<UsersRound aria-hidden="true" size={16} />}
                  variant="ghost"
                  onClick={() => setIsRoomControlsOpen(true)}
                />
              ) : undefined
            }
            collapsedHeader={<QollabBrandLogo variant="mark" />}
            isCollapsed={isSidebarCollapsed}
            onCollapsedChange={setIsSidebarCollapsed}
            linkComponent={Link}
            header={
              <Link
                href="/rooms"
                aria-label="All study rooms"
                className="block p-3"
              >
                <QollabBrandLogo />
              </Link>
            }
            topContent={
              !isSidebarCollapsed ? (
                <VStack padding={3}>
                  <HStack
                    gap={2}
                    vAlign="center"
                    className="qollab-room-card rounded-2xl bg-surface p-3"
                  >
                    <Avatar
                      name={roomName}
                      src={roomIconUrl ?? undefined}
                      size="md"
                      tooltip={false}
                    />
                    <VStack gap={0} className="min-w-0 flex-1">
                      <Text
                        weight="semibold"
                        maxLines={2}
                        wordBreak="break-word"
                      >
                        {roomName}
                      </Text>
                      <Text type="supporting">
                        {currentUserRole.charAt(0).toUpperCase() +
                          currentUserRole.slice(1)}{" "}
                        · {isPublic ? "Public" : "Private"}
                      </Text>
                    </VStack>
                    {otherRooms.length > 0 ? (
                      <DropdownMenu
                        button={{
                          label: "Switch room",
                          isIconOnly: true,
                          icon: <ChevronsUpDown aria-hidden="true" size={16} />,
                          variant: "ghost",
                          size: "sm",
                        }}
                        hasChevron={false}
                        alignment="end"
                        menuWidth={240}
                        items={otherRooms.map((room) => ({
                          label: room.name,
                          onClick: () => router.push(`/rooms/${room.slug}`),
                        }))}
                      />
                    ) : null}
                  </HStack>
                </VStack>
              ) : undefined
            }
            sections={[
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
                  {
                    id: "live",
                    label: "Live activities",
                    icon: ChartColumnBig,
                    isSelected: activeTool === "live",
                    onClick: () => chooseTool("live"),
                    size: "lg",
                  },
                  {
                    id: "assistant",
                    label: "AI study assistant",
                    icon: BrainCircuit,
                    isSelected: activeTool === "assistant",
                    onClick: openAssistant,
                    size: "lg",
                  },
                ],
              },
              {
                id: "collaboration",
                title: "Room",
                items: [
                  {
                    id: "breakouts",
                    label: "Breakout rooms",
                    icon: Split,
                    href: `/rooms/${roomId}/breakouts`,
                    endContent: (
                      <Text type="supporting">{breakoutRoomCount}</Text>
                    ),
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
                  <SidebarAccountMenu
                    beforeSignOut={prepareForSignOut}
                    displayName={
                      connection?.user.name ?? currentUser.displayName
                    }
                    role={currentUserRole}
                    userColor={connection?.user.color}
                    userId={currentUser.id}
                  />
                </VStack>
              ) : undefined
            }
          />
        }
        contextPanel={
          activeTool === "notes" ? (
            <VersionHistoryPanel
              currentUserId={currentUser.id}
              editorRef={editorRef}
              initialVersions={initialVersions}
              remoteActionsAvailable={remoteActionsAvailable}
              roomId={roomId}
              isOpen={!isVersionHistoryCollapsed}
              onOpenChange={(open) => setIsVersionHistoryCollapsed(!open)}
            />
          ) : undefined
        }
      >
        <VStack className="h-full min-h-0" gap={0}>
          <HStack padding={3} className="md:hidden! border-b border-border">
            <Selector
              label="Workspace"
              isLabelHidden
              value={activeTool}
              onChange={selectTool}
              options={Object.entries(toolLabels).map(([value, label]) => ({
                value,
                label,
              }))}
              width="100%"
            />
          </HStack>
          {!canEdit &&
          !isFollowingPresenter &&
          showFollowPrompt &&
          presentation ? (
            <HStack
              gap={3}
              padding={3}
              wrap="wrap"
              vAlign="center"
              className="border-b border-border bg-surface"
              role="status"
            >
              <Text className="flex-1">
                {presentation.presenterName} is presenting{" "}
                {toolLabels[presentation.workspace]}. Follow to move with them.
              </Text>
              <Button
                label="Not now"
                variant="ghost"
                onClick={() => setShowFollowPrompt(false)}
              />
              <Button label="Follow presenter" onClick={followPresenter} />
            </HStack>
          ) : null}
          {showLivePrompt ? (
            <HStack
              gap={3}
              padding={3}
              wrap="wrap"
              vAlign="center"
              className="border-b border-border bg-surface"
              role="status"
            >
              <Text className="flex-1">A live question is open.</Text>
              <Button
                label="Answer now"
                icon={<ChartColumnBig aria-hidden="true" size={16} />}
                onClick={() => chooseTool("live")}
              />
            </HStack>
          ) : null}
          {activeTool === "notes" ? (
            <VStack
              as="section"
              className="flex-1 min-h-0"
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
              ) : null}
              {remoteStatus === "error" || remoteStatus === "offline" ? (
                <HStack
                  gap={3}
                  padding={3}
                  wrap="wrap"
                  vAlign="center"
                  role={remoteStatus === "error" ? "alert" : "status"}
                  className="border-b border-border"
                >
                  <VStack gap={1} className="flex-1">
                    <Text weight="semibold">
                      {remoteStatus === "offline"
                        ? "You are editing offline."
                        : "Live sync is temporarily unavailable."}
                    </Text>
                    <Text type="supporting">
                      {connectionMessage || remoteCopy[remoteStatus]}
                    </Text>
                  </VStack>
                  <Button label="Retry now" onClick={reconnect} />
                </HStack>
              ) : null}
              {localStatus === "unavailable" || (!canEdit && localMessage) ? (
                <VStack
                  gap={1}
                  padding={3}
                  role="alert"
                  className="border-b border-border"
                >
                  <Text weight="semibold">
                    {canEdit
                      ? "Local saving is unavailable."
                      : "The saved notes snapshot is unavailable."}
                  </Text>
                  <Text type="supporting">{localMessage}</Text>
                </VStack>
              ) : null}
              {connection ? (
                <RichTextEditor
                  ref={editorRef}
                  document={connection.document}
                  editable={canEdit}
                  provider={connection.provider}
                  user={connection.user}
                />
              ) : (
                <LoadingIndicator
                  label="Opening the collaborative document…"
                  size="panel"
                />
              )}
            </VStack>
          ) : (
            <VStack
              as="section"
              className={
                activeTool === "assistant" || activeTool === "live"
                  ? "flex-1 min-h-0 overflow-auto bg-surface"
                  : "workspace-visual-tool flex-1 min-h-0 overflow-hidden bg-surface"
              }
              aria-label={toolLabels[activeTool]}
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
              ) : activeTool === "live" ? (
                <LiveActivitiesTool live={live} />
              ) : (
                <AiStudyTool
                  onReturnToNotes={() => chooseTool("notes")}
                  roomId={roomId}
                  sourceText={assistantSourceText}
                />
              )}
            </VStack>
          )}
        </VStack>
      </QollabAppShell>
      <Dialog
        isOpen={isRoomControlsOpen}
        onOpenChange={setIsRoomControlsOpen}
        aria-label="People and room"
        purpose="info"
        width={480}
      >
        {/* Same flat, spacious layout as the breakout room controls. */}
        <VStack gap={6} padding={6}>
          <HStack hAlign="between" vAlign="center" gap={4}>
            <Heading level={2}>People and room</Heading>
            <IconButton
              label="Close"
              icon={<X aria-hidden="true" size={18} />}
              onClick={() => setIsRoomControlsOpen(false)}
            />
          </HStack>
          <Selector
            label="Current room"
            value={roomId}
            onChange={(slug) => router.push(`/rooms/${slug}`)}
            options={availableRooms.map((room) => ({
              value: room.slug,
              label: room.name,
            }))}
            startIcon={
              <Avatar
                name={roomName}
                src={roomIconUrl ?? undefined}
                size="sm"
              />
            }
          />
          <Divider />
          <VStack gap={4}>
            <Text type="supporting" size="sm" weight="semibold">
              {participants.length === 1
                ? "1 person here now"
                : `${participants.length} people here now`}
            </Text>
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
      {!canEdit && isFollowingPresenter && presentation?.cursor ? (
        <VStack
          aria-hidden="true"
          className="presenter-cursor"
          style={{
            left: `${presentation.cursor.x * 100}vw`,
            top: `${presentation.cursor.y * 100}vh`,
          }}
        >
          <MousePointer2 fill="currentColor" size={22} />
          <Text>{presentation.presenterName}</Text>
        </VStack>
      ) : null}
    </VStack>
  );
}

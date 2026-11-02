"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Badge } from "@astryxdesign/core/Badge";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Button } from "@/components/ui/button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import {
  BookOpenText,
  BrainCircuit,
  FileText,
  MousePointer2,
  PanelsTopLeft,
  Presentation,
  Split,
  UsersRound,
} from "@/components/ui/icons";
import { QollabAppShell } from "@/components/shell/qollab-app-shell";
import { QollabSideNavigation } from "@/components/shell/qollab-side-navigation";
import { QollabWorkspaceHeader } from "@/components/shell/qollab-workspace-header";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useNotesCollaboration } from "@/lib/collaboration/use-notes-collaboration";
import { useCallback, useEffect, useRef, useState } from "react";

import { SidebarAccountMenu } from "@/components/auth/sidebar-account-menu";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { ConflictReviewPanel } from "@/components/collaboration/conflict-review-panel";
import { RichTextEditor } from "@/components/collaboration/rich-text-editor";
import { VersionHistoryPanel } from "@/components/collaboration/version-history-panel";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
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
import { useRoomPresentation } from "@/hooks/use-room-presentation";
import { useViewerCollaboration } from "@/hooks/use-viewer-collaboration";

type WorkspaceTool = RoomDocumentKind | "assistant";

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRoomControlsOpen, setIsRoomControlsOpen] = useState(false);
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);
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

  const openAssistant = (): void => {
    setAssistantSourceText(editorRef.current?.captureDraft()?.text ?? "");
    chooseTool("assistant");
  };

  const toolLabels: Record<WorkspaceTool, string> = {
    notes: "Shared notes",
    pdf: "PDF annotation",
    whiteboard: "Whiteboard",
    assistant: "AI study assistant",
  };
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
          <QollabWorkspaceHeader
            label="Room controls"
            startContent={
              <VStack gap={0} className="min-w-0">
                <Text type="label" maxLines={1}>
                  {roomName}
                </Text>
                <Text type="supporting" className="hidden sm:block">
                  {toolLabels[activeTool]}
                </Text>
              </VStack>
            }
            endContent={
              <HStack gap={2} vAlign="center">
                {canEdit ? (
                  <Button
                    label={isPresenting ? "Stop presenting" : "Present"}
                    variant="secondary"
                    className="min-h-11"
                    aria-pressed={isPresenting}
                    icon={<Presentation aria-hidden="true" size={16} />}
                    onClick={isPresenting ? stopPresenting : startPresenting}
                  />
                ) : (
                  <Button
                    label={isFollowingPresenter ? "Stop following" : "Follow"}
                    aria-label={
                      presentation
                        ? `${isFollowingPresenter ? "Stop following" : "Follow"} ${presentation.presenterName}`
                        : "No active presenter"
                    }
                    variant="ghost"
                    className="min-h-11"
                    isDisabled={!presentation}
                    aria-pressed={isFollowingPresenter}
                    onClick={() => {
                      if (isFollowingPresenter) {
                        setFollowingPresenterId(null);
                        setShowFollowPrompt(false);
                      } else followPresenter();
                    }}
                  />
                )}
                {currentUserRole === "owner" ? (
                  <Button
                    as={Link}
                    href={`/rooms/${roomId}/settings`}
                    label="Manage"
                    variant="ghost"
                    className="min-h-11"
                  />
                ) : (
                  <Text type="supporting" className="hidden sm:block">
                    {currentUserRole}
                  </Text>
                )}
              </HStack>
            }
          />
        }
        sideNavigation={
          <QollabSideNavigation
            footerIcons={
              <Button
                label="Room controls"
                isIconOnly
                icon={<UsersRound aria-hidden="true" size={16} />}
                variant="ghost"
                onClick={() => setIsRoomControlsOpen(true)}
              />
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
                <VStack gap={3} padding={4}>
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
                        tooltip={false}
                      />
                    }
                    className="[&_button]:min-h-11"
                  />
                  <Text type="supporting">
                    {isPublic ? "Public room" : "Private room"}
                  </Text>
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
                title: "Collaboration",
                items: [
                  {
                    id: "breakouts",
                    label: "Breakout rooms",
                    icon: Split,
                    href: `/rooms/${roomId}/breakouts`,
                    endContent: <Badge label={breakoutRoomCount} />,
                    size: "lg",
                  },
                ],
              },
            ]}
            footer={
              !isSidebarCollapsed ? (
                <VStack
                  gap={1}
                  padding={2}
                  className="border-t border-border [&_.viewer-collaboration-control]:border-0! [&_.viewer-collaboration-control]:shadow-none! [&_.viewer-collaboration-control]:bg-transparent! [&_.viewer-collaboration-control]:p-2! [&_.viewer-collaboration-control]:m-0! [&_.viewer-collaboration-control_small]:hidden [&_.viewer-collaboration-control_strong]:font-normal! [&_.viewer-collaboration-control_strong]:text-sm! [&_.viewer-collaboration-control__icon]:bg-transparent! [&_.viewer-collaboration-control__icon]:text-secondary! [&_.viewer-collaboration-status]:border-0! [&_.viewer-collaboration-status]:shadow-none! [&_.viewer-collaboration-status]:bg-transparent! [&_.current-user]:border-0! [&_.current-user]:shadow-none! [&_.current-user]:bg-transparent! [&_.current-user]:rounded-md! [&_.current-user]:p-2! [&_.current-user:hover]:bg-surface-hover! [&_.current-user_strong]:text-sm! [&_.current-user_small]:text-xs!"
                >
                  {collaborationControl}
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
              className="[&_button]:min-h-11"
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
          {activeTool === "notes" ? (
            <VStack
              as="section"
              className="flex-1 min-h-0"
              id="notes"
              aria-label="Shared notes workspace"
              onScrollCapture={handleNotesScroll}
              ref={notesWorkspaceRef}
            >
              <HStack
                gap={3}
                paddingInline={5}
                paddingBlock={3}
                hAlign="between"
                vAlign="center"
                className="border-b border-border"
              >
                <Heading level={1} className="text-lg!">
                  Shared notes
                </Heading>
                <Button
                  label="Version history"
                  aria-controls="version-history-sidebar"
                  variant="ghost"
                  className="min-h-11"
                  aria-expanded={!isVersionHistoryCollapsed}
                  onClick={() =>
                    setIsVersionHistoryCollapsed((value) => !value)
                  }
                />
              </HStack>
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
                  syncLabel={
                    remoteStatus === "synced"
                      ? "Live"
                      : remoteCopy[remoteStatus]
                  }
                  syncStatus={remoteStatus}
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
                activeTool === "assistant"
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
        aria-label="Room controls"
        purpose="info"
      >
        <VStack gap={4} padding={4}>
          <HStack hAlign="between" vAlign="center">
            <Heading level={2}>Room controls</Heading>
            <Button
              label="Close"
              variant="ghost"
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
          {collaborationControl}
          <VStack gap={2}>
            <Text type="label">{participants.length} active participants</Text>
            {participants.map((participant) => (
              <HStack gap={2} vAlign="center" key={participant.clientId}>
                <Avatar name={participant.name} size="sm" />
                <Text>{participant.name}</Text>
              </HStack>
            ))}
          </VStack>
          <SidebarAccountMenu
            beforeSignOut={prepareForSignOut}
            displayName={connection?.user.name ?? currentUser.displayName}
            role={currentUserRole}
            userColor={connection?.user.color}
            userId={currentUser.id}
          />
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

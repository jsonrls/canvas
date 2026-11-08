import { Avatar } from "@astryxdesign/core/Avatar";
import {
  AvatarGroup,
  AvatarGroupOverflow,
} from "@astryxdesign/core/AvatarGroup";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import type { ReactElement, ReactNode } from "react";
import { ButtonControl } from "@/components/ui/button";
import { QollabWorkspaceHeader } from "@/components/shell/qollab-workspace-header";
import type { RoomRole } from "@/lib/rooms/repository";

export type RoomSyncStatus =
  "connecting" | "synced" | "offline" | "error" | "viewing";

export interface RoomHeaderParticipant {
  clientId: number;
  name: string;
}

export interface RoomHeaderProps {
  roomName: string;
  roomIconUrl: string | null;
  isPublic: boolean;
  role: RoomRole;
  toolLabel: string;
  participants: readonly RoomHeaderParticipant[];
  onOpenParticipants: () => void;
  syncStatus: RoomSyncStatus;
  syncLabel: string;
  actions: ReactNode;
}

export const ROOM_HEADER_VISIBLE_AVATARS = 4;

const dotVariant = {
  synced: "success",
  offline: "warning",
  error: "error",
  connecting: "neutral",
  viewing: "neutral",
} as const;

export function RoomHeader({
  roomName,
  roomIconUrl,
  isPublic,
  role,
  toolLabel,
  participants,
  onOpenParticipants,
  syncStatus,
  syncLabel,
  actions,
}: RoomHeaderProps): ReactElement {
  const count = participants.length;
  const overflow = count - ROOM_HEADER_VISIBLE_AVATARS;
  return (
    <QollabWorkspaceHeader
      label="Room controls"
      startContent={
        <HStack gap={3} vAlign="center" className="min-w-0">
          <Avatar
            name={roomName}
            src={roomIconUrl ?? undefined}
            size="sm"
            tooltip={false}
            aria-hidden
          />
          <VStack gap={0} className="min-w-0">
            <Heading level={1} maxLines={1} className="truncate text-base!">
              {roomName}
            </Heading>
            <Text type="supporting" className="hidden sm:block">
              {toolLabel}
            </Text>
          </VStack>
          <HStack gap={2} vAlign="center" className="hidden lg:flex">
            <Token size="sm" label={isPublic ? "Public" : "Private"} />
            {role === "owner" ? null : (
              <Token
                size="sm"
                label={role === "editor" ? "Editor" : "Viewer"}
              />
            )}
          </HStack>
        </HStack>
      }
      endContent={
        <HStack gap={3} vAlign="center">
          {count > 0 ? (
            <ButtonControl
              variant="ghost"
              className="hidden sm:flex"
              aria-label={
                count === 1
                  ? "1 person in this room"
                  : `${count} people in this room`
              }
              onClick={onOpenParticipants}
            >
              <AvatarGroup size="sm">
                {participants
                  .slice(0, ROOM_HEADER_VISIBLE_AVATARS)
                  .map((participant) => (
                    <Avatar
                      key={participant.clientId}
                      name={participant.name}
                      tooltip={false}
                    />
                  ))}
                {overflow > 0 ? <AvatarGroupOverflow count={overflow} /> : null}
              </AvatarGroup>
            </ButtonControl>
          ) : null}
          <HStack
            gap={2}
            vAlign="center"
            role="status"
            className="hidden lg:flex"
          >
            <StatusDot
              variant={dotVariant[syncStatus]}
              label={syncLabel}
              aria-hidden
            />
            <Text type="supporting">{syncLabel}</Text>
          </HStack>
          {actions}
        </HStack>
      }
    />
  );
}

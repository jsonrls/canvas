import { Avatar } from "@astryxdesign/core/Avatar";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/Layout";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import type { ReactElement, ReactNode } from "react";
import { QollabWorkspaceHeader } from "@/components/shell/qollab-workspace-header";
import type { RoomRole } from "@/lib/rooms/repository";

export type RoomSyncStatus =
  "connecting" | "synced" | "offline" | "error" | "viewing";

export interface RoomHeaderProps {
  roomName: string;
  roomIconUrl: string | null;
  isPublic: boolean;
  role: RoomRole;
  toolLabel: string;
  syncStatus: RoomSyncStatus;
  syncLabel: string;
  actions: ReactNode;
}

const dotVariant = {
  synced: "success",
  offline: "warning",
  error: "error",
  connecting: "neutral",
  viewing: "neutral",
} as const;

// Colour belongs on state, not on the controls: the pill takes the tone of the
// sync status, and stays neutral while there is nothing to report.
const pillTone = {
  synced: "bg-success-muted",
  offline: "bg-warning-muted",
  error: "bg-error-muted",
  connecting: "bg-muted",
  viewing: "bg-muted",
} as const;

export function RoomHeader({
  roomName,
  roomIconUrl,
  isPublic,
  role,
  toolLabel,
  syncStatus,
  syncLabel,
  actions,
}: RoomHeaderProps): ReactElement {
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
          {/* One line: the room, then the tool you are in. */}
          <HStack gap={2} vAlign="center" className="min-w-0">
            <Heading level={1} maxLines={1} className="truncate text-base!">
              {roomName}
            </Heading>
            <Text
              type="supporting"
              className="hidden shrink-0 sm:block"
              aria-hidden
            >
              /
            </Text>
            <Text type="supporting" className="hidden shrink-0 sm:block">
              {toolLabel}
            </Text>
          </HStack>
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
          <HStack
            gap={2}
            vAlign="center"
            role="status"
            className={`hidden rounded-full px-3 py-1 lg:flex ${pillTone[syncStatus]}`}
          >
            <StatusDot
              variant={dotVariant[syncStatus]}
              label={syncLabel}
              isPulsing={syncStatus === "synced"}
              aria-hidden
            />
            <Text type="supporting">{syncLabel}</Text>
          </HStack>
          {actions ? (
            <HStack
              vAlign="center"
              className="qollab-pill-tray rounded-full bg-muted p-0.5"
            >
              {actions}
            </HStack>
          ) : null}
        </HStack>
      }
    />
  );
}

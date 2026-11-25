"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List } from "@astryxdesign/core/List";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import Link from "next/link";
import { startTransition, useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import { INITIAL_ROOM_ACTION_STATE } from "@/app/rooms/action-state";
import {
  createRoomAction,
  joinRoomAction,
  leaveRoomAction,
} from "@/app/rooms/actions";
import { SidebarAccountMenu } from "@/components/auth/sidebar-account-menu";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { RoomIconField } from "@/components/rooms/room-banner-field";
import {
  ArrowRight,
  DoorOpen,
  Globe2,
  LibraryBig,
  LockKeyhole,
  Plus,
} from "@/components/ui/icons";
import { PANEL_ACCENT, PANEL_MUTED } from "@/components/ui/panel";
import { useSuccessToast } from "@/components/ui/toast";
import {
  formatRoomDate,
  summarizeJoinedRooms,
} from "@/lib/rooms/directory-summary";
import type { RoomDirectory, RoomSummary } from "@/lib/rooms/repository";

interface RoomsDashboardProps {
  directory: RoomDirectory;
  displayName: string;
  userId: string;
}

async function prepareRoomHomeSignOut(): Promise<void> {
  await Promise.resolve();
}

function formatUpdatedAt(value: string): string {
  const date = formatRoomDate(value);
  return date ? `Updated ${date}` : "Recently active";
}

const roomActionClassName = "px-4";
// The public panel is narrow beside the joined one, so its action drops under the name there.
const roomRowClassName =
  "w-full flex-col rounded-2xl bg-surface sm:flex-row sm:items-center";
const publicRoomRowClassName = `${roomRowClassName} lg:flex-col lg:items-start`;
// Each access choice is a tile; the chosen one takes the Soft Blue selection surface.
const accessOptionClassName =
  "min-h-11 min-w-0 flex-1 rounded-2xl bg-muted p-4 has-checked:bg-accent-muted";

function PendingButton({
  label,
  pendingLabel,
  roomName,
  primary = false,
}: {
  label: string;
  pendingLabel: string;
  roomName?: string;
  primary?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      label={pending ? pendingLabel : label}
      aria-label={roomName ? `${label}: ${roomName}` : undefined}
      isLoading={pending}
      variant={primary ? "primary" : "secondary"}
      icon={roomName ? <DoorOpen aria-hidden="true" size={16} /> : undefined}
      className={
        roomName
          ? roomActionClassName
          : `font-normal! ${primary ? "text-on-accent!" : ""}`
      }
    />
  );
}

function JoinRoomForm({ room }: { room: RoomSummary }) {
  const [state, action] = useActionState(
    joinRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );
  useSuccessToast(state);
  return (
    <form action={action}>
      <VStack gap={2} hAlign="start">
        {state.status === "error" ? (
          <Text role="alert" className="text-error">
            {state.message}
          </Text>
        ) : null}
        <PendingButton
          label="Join room"
          pendingLabel="Joining…"
          roomName={room.name}
        />
      </VStack>
    </form>
  );
}

function LeaveRoomForm({ room }: { room: RoomSummary }) {
  const [state, action, pending] = useActionState(
    leaveRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  useSuccessToast(state);
  return (
    <>
      <Button
        label="Leave"
        aria-label={`Leave room: ${room.name}`}
        variant="danger-ghost"
        onClick={() => setIsOpen(true)}
      />
      <Dialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        purpose="form"
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <VStack gap={4} padding={4}>
          <Heading level={2} id={titleId}>
            Leave “{room.name}”?
          </Heading>
          <Text color="secondary" id={descriptionId}>
            You’ll lose access to this room and its shared study materials. You
            can return if the room is public or you’re invited again.
          </Text>
          {state.status === "error" ? (
            <Text role="alert" className="text-error">
              {state.message}
            </Text>
          ) : null}
          <HStack gap={2} hAlign="end" wrap="wrap">
            <Button
              label="Keep room"
              variant="ghost"
              data-autofocus
              onClick={() => setIsOpen(false)}
            />
            <Button
              label={pending ? "Leaving…" : "Leave room"}
              variant="destructive"
              isLoading={pending}
              onClick={() => startTransition(() => action(new FormData()))}
            />
          </HStack>
        </VStack>
      </Dialog>
    </>
  );
}

function RoomRow({ room, joined }: { room: RoomSummary; joined: boolean }) {
  return (
    <HStack
      as="li"
      gap={4}
      padding={4}
      vAlign="start"
      className={joined ? roomRowClassName : publicRoomRowClassName}
    >
      <HStack gap={3} vAlign="center" className="min-w-0 flex-1 w-full">
        <Avatar
          name={room.name}
          src={room.iconUrl ?? undefined}
          size="md"
          tooltip={false}
        />
        <VStack gap={1} className="min-w-0 flex-1">
          <Heading level={3} className="break-words text-base!">
            {room.name}
          </Heading>
          <HStack gap={2} wrap="wrap" vAlign="center">
            {joined ? (
              <Token
                size="sm"
                label={room.isPublic ? "Public" : "Private"}
                icon={
                  room.isPublic ? (
                    <Globe2 aria-hidden="true" size={12} />
                  ) : (
                    <LockKeyhole aria-hidden="true" size={12} />
                  )
                }
              />
            ) : null}
            {joined && room.role ? (
              <Token
                size="sm"
                label={room.role.charAt(0).toUpperCase() + room.role.slice(1)}
              />
            ) : null}
            <Text type="supporting">{formatUpdatedAt(room.updatedAt)}</Text>
          </HStack>
        </VStack>
      </HStack>
      <HStack gap={2} wrap="wrap" vAlign="center" className="shrink-0">
        {joined ? (
          <>
            {room.role === "owner" ? (
              <Button
                as={Link}
                href={`/rooms/${room.slug}/settings`}
                label="Manage"
                aria-label={`Manage room: ${room.name}`}
                variant="ghost"
              />
            ) : (
              <LeaveRoomForm room={room} />
            )}
            <Button
              as={Link}
              href={`/rooms/${room.slug}`}
              label="Open room"
              aria-label={`Open room: ${room.name}`}
              variant="secondary"
              endContent={<ArrowRight aria-hidden="true" size={16} />}
              className={roomActionClassName}
            />
          </>
        ) : (
          <JoinRoomForm room={room} />
        )}
      </HStack>
    </HStack>
  );
}

export function RoomsDashboard({
  directory,
  displayName,
  userId,
}: RoomsDashboardProps): React.ReactElement {
  const [createState, createAction] = useActionState(
    createRoomAction,
    INITIAL_ROOM_ACTION_STATE,
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState("private");
  useSuccessToast(createState);
  const openCreate = () => setIsCreateOpen(true);
  const greetingName = displayName.trim();

  return (
    <>
      <VStack className="min-h-dvh bg-surface">
        <a
          href="#rooms-content"
          className="sr-only focus:not-sr-only focus:p-4 focus:bg-surface focus:text-accent"
        >
          Skip to rooms
        </a>
        <VStack as="header" className="border-b border-border" hAlign="center">
          <HStack
            maxWidth={1120}
            className="w-full min-h-20 md:px-8"
            paddingInline={4}
            paddingBlock={3}
            hAlign="between"
            vAlign="center"
            gap={4}
          >
            <Link href="/" aria-label="Qollab home">
              <QollabBrandLogo />
            </Link>
            <SidebarAccountMenu
              appearance="header"
              beforeSignOut={prepareRoomHomeSignOut}
              displayName={displayName}
              userId={userId}
            />
          </HStack>
        </VStack>
        <VStack
          as="main"
          id="rooms-content"
          tabIndex={-1}
          maxWidth={1120}
          className="w-full mx-auto md:px-8 md:py-12"
          paddingInline={4}
          paddingBlock={8}
          gap={8}
        >
          <HStack gap={5} hAlign="between" vAlign="end" wrap="wrap">
            <VStack gap={2} className="min-w-0">
              <Heading
                level={1}
                maxLines={2}
                className="text-2xl! md:text-3xl!"
              >
                {greetingName
                  ? `Your study rooms, ${greetingName}`
                  : "Your study rooms"}
              </Heading>
              <Text color="secondary">
                {summarizeJoinedRooms(directory.joinedRooms)}
              </Text>
            </VStack>
            <Button
              label="Create room"
              variant="primary"
              icon={<Plus aria-hidden="true" />}
              onClick={openCreate}
            />
          </HStack>
          <HStack gap={4} vAlign="start" className="flex-col lg:flex-row">
            <VStack
              as="section"
              gap={4}
              aria-labelledby="your-rooms-title"
              className={`${PANEL_MUTED} lg:flex-3`}
            >
              <HStack gap={2} vAlign="center">
                <Heading level={2} id="your-rooms-title" className="text-base!">
                  Joined rooms
                </Heading>
                <Badge label={directory.joinedRooms.length} />
              </HStack>
              {directory.joinedRooms.length ? (
                <List
                  aria-labelledby="your-rooms-title"
                  className="flex w-full flex-col gap-2"
                >
                  {directory.joinedRooms.map((room) => (
                    <RoomRow key={room.id} room={room} joined />
                  ))}
                </List>
              ) : (
                <EmptyState
                  isCompact
                  title="No rooms joined yet"
                  description="Rooms you create or join appear here."
                  icon={<LibraryBig />}
                />
              )}
            </VStack>
            <VStack
              as="section"
              gap={4}
              aria-labelledby="public-rooms-title"
              className={`${PANEL_ACCENT} lg:flex-2`}
            >
              <VStack gap={1}>
                <HStack gap={2} vAlign="center">
                  <Heading
                    level={2}
                    id="public-rooms-title"
                    className="text-base!"
                  >
                    Open to join
                  </Heading>
                  <Badge label={directory.publicRooms.length} />
                </HStack>
                <Text type="supporting">
                  Public rooms. Join one to add it to your list.
                </Text>
              </VStack>
              {directory.publicRooms.length ? (
                <List
                  aria-labelledby="public-rooms-title"
                  className="flex w-full flex-col gap-2"
                >
                  {directory.publicRooms.map((room) => (
                    <RoomRow key={room.id} room={room} joined={false} />
                  ))}
                </List>
              ) : (
                <EmptyState
                  isCompact
                  title="No public rooms right now"
                  description="When someone opens a room to everyone, it appears here."
                  icon={<Globe2 />}
                />
              )}
            </VStack>
          </HStack>
        </VStack>
      </VStack>
      {/* The modal stays mounted across closing and viewport changes to preserve the selected icon file. */}
      <Dialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        purpose="form"
        width={560}
      >
        <DialogHeader
          title="Create a room"
          subtitle="Give your group a focused place to study together."
          onOpenChange={setIsCreateOpen}
          className="[&_button]:min-w-9"
        />
        <form action={createAction} className="w-full">
          <VStack gap={4} padding={4}>
            <VStack className="w-full [&_label]:flex-row [&_label]:items-center [&_label_span]:text-error!">
              <TextInput
                label="Room name"
                id="room-name"
                hasAutoFocus
                size="lg"
                width="100%"
                className="[&_input]:text-lg"
                htmlName="name"
                value={name}
                onChange={setName}
                placeholder="e.g. World history"
                isRequired
                {...{ maxLength: 120, required: true }}
              />
            </VStack>
            <RoomIconField compact inputId="room-icon" previewName={name} />
            <RadioList
              label="Access"
              description="You can change this anytime."
              htmlName="visibility"
              orientation="horizontal"
              width="100%"
              value={visibility}
              onChange={setVisibility}
            >
              <RadioListItem
                label="Private"
                className={accessOptionClassName}
                value="private"
                description="Invite only"
                endContent={<LockKeyhole aria-hidden="true" size={16} />}
              />
              <RadioListItem
                label="Public"
                className={accessOptionClassName}
                value="public"
                description="Anyone can join"
                endContent={<Globe2 aria-hidden="true" size={16} />}
              />
            </RadioList>
            {createState.status === "error" && createState.message ? (
              <Text role="alert" className="text-error">
                {createState.message}
              </Text>
            ) : null}
            <HStack gap={2} hAlign="end" vAlign="center" wrap="wrap">
              <Button
                label="Cancel"
                className="font-normal!"
                onClick={() => setIsCreateOpen(false)}
              />
              <PendingButton
                label="Create room"
                pendingLabel="Creating room…"
                primary
              />
            </HStack>
          </VStack>
        </form>
      </Dialog>
    </>
  );
}

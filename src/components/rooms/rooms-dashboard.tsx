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
import { useSuccessToast } from "@/components/ui/toast";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently active";
  return `Updated ${new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date)}`;
}

const roomActionClassName = "min-h-11 px-4";

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
          : `min-h-11 font-normal! ${primary ? "text-on-accent!" : ""}`
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
        className="min-h-11"
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
              className="min-h-11"
              onClick={() => setIsOpen(false)}
            />
            <Button
              label={pending ? "Leaving…" : "Leave room"}
              variant="destructive"
              className="min-h-11"
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
    <VStack
      as="li"
      paddingBlock={5}
      gap={3}
      className="w-full border-b border-border last:border-b-0"
    >
      <HStack gap={4} vAlign="start" className="flex-col md:flex-row">
        <HStack gap={3} vAlign="start" className="min-w-0 flex-1 w-full">
          <Avatar
            name={room.name}
            src={room.iconUrl ?? undefined}
            size="md"
            tooltip={false}
          />
          <VStack gap={2} className="min-w-0 flex-1">
            <Heading level={3} className="break-words text-lg!">
              {room.name}
            </Heading>
            <HStack gap={2} wrap="wrap" vAlign="center">
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
                  className="min-h-11"
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
    </VStack>
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
            <Link href="/rooms" aria-label="Qollab rooms">
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
          gap={10}
        >
          <VStack gap={8}>
            <HStack gap={4} hAlign="between" vAlign="start" wrap="wrap">
              <Text weight="semibold">Study commons</Text>
              <HStack gap={6} wrap="wrap" className="hidden md:flex">
                <Text type="supporting">Shared notes / PDF annotation</Text>
                <Text type="supporting">Whiteboard / AI study assistant</Text>
              </HStack>
            </HStack>
            <HStack gap={5} hAlign="between" vAlign="end" wrap="wrap">
              <VStack gap={3}>
                <Heading level={1} className="text-2xl! md:text-3xl!">
                  Your study rooms
                </Heading>
                <Text color="secondary">
                  Return to your group, or join a public room to study together.
                </Text>
              </VStack>
              <Button
                label="Create room"
                variant="primary"
                icon={<Plus aria-hidden="true" />}
                onClick={openCreate}
                className="min-h-11"
              />
            </HStack>
          </VStack>
          <VStack as="section" gap={0} aria-labelledby="your-rooms-title">
            <HStack
              gap={3}
              vAlign="center"
              paddingBlock={4}
              className="border-b border-border-strong"
            >
              <Heading level={2} id="your-rooms-title">
                Joined rooms
              </Heading>
              <Badge label={directory.joinedRooms.length} />
            </HStack>
            {directory.joinedRooms.length ? (
              <List aria-labelledby="your-rooms-title" className="w-full">
                {directory.joinedRooms.map((room) => (
                  <RoomRow key={room.id} room={room} joined />
                ))}
              </List>
            ) : (
              <EmptyState
                isCompact
                title="No rooms joined yet"
                description="Create a room for your group, or join a public room below."
                icon={<LibraryBig />}
              />
            )}
          </VStack>
          <VStack as="section" gap={0} aria-labelledby="public-rooms-title">
            <VStack
              gap={2}
              paddingBlock={4}
              className="border-b border-border-strong"
            >
              <HStack gap={2} vAlign="center">
                <Heading level={2} id="public-rooms-title">
                  Public rooms
                </Heading>
                <Badge label={directory.publicRooms.length} />
              </HStack>
              <Text color="secondary">
                Open to anyone. Join a room to add it to your list.
              </Text>
            </VStack>
            {directory.publicRooms.length ? (
              <List aria-labelledby="public-rooms-title" className="w-full">
                {directory.publicRooms.map((room) => (
                  <RoomRow key={room.id} room={room} joined={false} />
                ))}
              </List>
            ) : (
              <EmptyState
                isCompact
                title="No public rooms available"
                description="There are no public rooms to join right now. You can create one with the Create room button above."
                icon={<Globe2 />}
              />
            )}
          </VStack>
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
          className="[&_button]:min-h-11 [&_button]:min-w-11"
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
                className="min-h-11 [&_input]:text-lg"
                htmlName="name"
                value={name}
                onChange={setName}
                placeholder="e.g. Cardiovascular pharmacology"
                isRequired
                {...{ maxLength: 120, required: true }}
              />
            </VStack>
            <RoomIconField compact inputId="room-icon" />
            <RadioList
              label="Access"
              htmlName="visibility"
              value={visibility}
              onChange={setVisibility}
            >
              <RadioListItem
                label="Private"
                className="min-h-11"
                value="private"
                description="Invite only"
              />
              <RadioListItem
                label="Public"
                className="min-h-11"
                value="public"
                description="Anyone can join"
              />
            </RadioList>
            <Text type="supporting">You can change access anytime.</Text>
            {createState.status === "error" && createState.message ? (
              <Text role="alert" className="text-error">
                {createState.message}
              </Text>
            ) : null}
            <HStack gap={2} hAlign="end" vAlign="center" wrap="wrap">
              <Button
                label="Cancel"
                className="min-h-11 font-normal!"
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

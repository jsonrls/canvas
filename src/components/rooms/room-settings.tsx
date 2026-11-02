"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Selector } from "@astryxdesign/core/Selector";
import { List } from "@astryxdesign/core/List";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  addRoomMemberAction,
  changeRoomMemberRoleAction,
  deleteRoomAction,
  removeRoomMemberAction,
  updateRoomAction,
} from "@/app/rooms/actions";
import {
  INITIAL_ROOM_ACTION_STATE,
  type RoomActionState,
} from "@/app/rooms/action-state";
import { RoomIconField } from "@/components/rooms/room-banner-field";
import { ArrowLeft, Crown } from "@/components/ui/icons";
import { useSuccessToast } from "@/components/ui/toast";
import type { RoomMember, RoomSettings } from "@/lib/rooms/repository";

const destructiveClassName =
  "min-h-11 font-bold! text-error! bg-transparent! bg-none!";
const roleOptions = [
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

function SettingsSubmitButton({
  label,
  pendingLabel,
  variant = "secondary",
  disabled = false,
  accessibleLabel,
  className = "",
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "destructive";
  disabled?: boolean;
  accessibleLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      aria-label={accessibleLabel}
      type="submit"
      label={pending ? pendingLabel : label}
      variant={variant}
      isLoading={pending}
      isDisabled={disabled}
      className={`min-h-11 ${variant === "primary" ? "text-on-accent!" : ""} ${className}`}
    />
  );
}

function ActionMessage({ state }: { state: RoomActionState }) {
  useSuccessToast(state);
  if (!state.message || state.status !== "error") return null;
  return (
    <Text as="p" className="text-error" role="alert">
      {state.message}
    </Text>
  );
}

function MemberRow({
  member,
  roomSlug,
}: {
  member: RoomMember;
  roomSlug: string;
}) {
  const [roleState, roleAction] = useActionState(
    changeRoomMemberRoleAction.bind(null, roomSlug, member.userId),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeRoomMemberAction.bind(null, roomSlug, member.userId),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [role, setRole] = useState(member.role);
  const [removeOpen, setRemoveOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const isOwner = member.role === "owner";
  const joinedAt = new Date(member.joinedAt);
  const joinedLabel = Number.isNaN(joinedAt.getTime())
    ? "Collaborator"
    : `Joined ${joinedAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}`;

  return (
    <VStack
      as="li"
      gap={2}
      paddingBlock={4}
      className="border-b border-border last:border-b-0"
    >
      <HStack gap={4} hAlign="between" vAlign="center" wrap="wrap">
        <HStack gap={3} vAlign="center" className="min-w-0 flex-1">
          <Avatar name={member.displayName} size="md" />
          <VStack gap={0.5} className="min-w-0">
            <Text weight="semibold" className="break-words">
              {member.displayName}
            </Text>
            <Text type="supporting">
              {isOwner ? "Room owner" : joinedLabel}
            </Text>
          </VStack>
        </HStack>
        {isOwner ? (
          <Token label="Owner" icon={<Crown aria-hidden="true" size={16} />} />
        ) : (
          <HStack
            gap={2}
            wrap="wrap"
            vAlign="center"
            className="w-full sm:w-auto"
          >
            <form action={roleAction}>
              <HStack gap={2} wrap="wrap" vAlign="center">
                <Selector
                  label={`Role for ${member.displayName}`}
                  isLabelHidden
                  htmlName="role"
                  value={role}
                  onChange={(value) => setRole(value as RoomMember["role"])}
                  options={roleOptions}
                  size="lg"
                  width={128}
                  className="min-h-11"
                />
                <SettingsSubmitButton
                  label="Save"
                  accessibleLabel={`Save role for ${member.displayName}`}
                  pendingLabel="Saving…"
                  disabled={role === member.role}
                />
              </HStack>
            </form>
            <Button
              label="Remove"
              aria-label={`Remove ${member.displayName}`}
              variant="danger-ghost"
              className={destructiveClassName}
              onClick={() => setRemoveOpen(true)}
            />
          </HStack>
        )}
      </HStack>
      <ActionMessage state={roleState} />
      <Dialog
        isOpen={removeOpen}
        onOpenChange={(open) => {
          if (!removing) setRemoveOpen(open);
        }}
        purpose="form"
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form action={removeAction}>
          <VStack gap={4} padding={4}>
            <Heading level={2} id={titleId}>
              Remove {member.displayName}?
            </Heading>
            <Text as="p" color="secondary" id={descriptionId}>
              They’ll lose access to this room and its shared study materials.
              You can add them again later.
            </Text>
            <ActionMessage state={removeState} />
            <HStack gap={2} hAlign="end" wrap="wrap">
              <Button
                label="Cancel"
                variant="ghost"
                data-autofocus
                className="min-h-11"
                isDisabled={removing}
                onClick={() => setRemoveOpen(false)}
              />
              <SettingsSubmitButton
                label="Remove collaborator"
                pendingLabel="Removing…"
                variant="destructive"
              />
            </HStack>
          </VStack>
        </form>
      </Dialog>
    </VStack>
  );
}

export function RoomSettingsPanel({
  room,
}: {
  room: RoomSettings;
}): React.ReactElement {
  const [settingsState, settingsAction] = useActionState(
    updateRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [memberState, memberAction] = useActionState(
    addRoomMemberAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [name, setName] = useState(room.name);
  const [visibility, setVisibility] = useState(
    room.isPublic ? "public" : "private",
  );
  const [startingRole, setStartingRole] = useState("editor");
  const [email, setEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const deleteTitleId = useId();
  const deleteDescriptionId = useId();

  return (
    <>
      <HStack
        as="header"
        className="border-b border-border bg-surface"
        hAlign="center"
        paddingInline={4}
      >
        <HStack
          width="100%"
          maxWidth={1120}
          className="min-h-20"
          vAlign="center"
          paddingBlock={3}
        >
          <Link
            href="/rooms"
            aria-label="Qollab rooms"
            className="inline-flex min-h-11 min-w-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <QollabBrandLogo />
          </Link>
        </HStack>
      </HStack>
      <VStack
        as="main"
        gap={8}
        padding={6}
        className="mx-auto w-full max-w-3xl text-primary sm:py-10"
      >
        <VStack as="header" gap={5}>
          <Button
            as={Link}
            href={`/rooms/${room.slug}`}
            label="Back to room"
            variant="ghost"
            icon={<ArrowLeft aria-hidden="true" size={16} />}
            className="self-start min-h-11 hover:bg-transparent! hover:bg-none!"
          />
          <VStack gap={2}>
            <Text type="supporting" className="break-words">
              {room.name}
            </Text>
            <Heading level={1}>Room settings</Heading>
            <Text as="p" color="secondary">
              Manage your room’s details, access, and collaborators.
            </Text>
          </VStack>
        </VStack>

        <VStack as="section" gap={5} aria-labelledby="room-details-title">
          <VStack gap={1}>
            <Heading level={2} id="room-details-title">
              Room details
            </Heading>
            <Text as="p" color="secondary">
              Give your shared space a name and choose who can join.
            </Text>
          </VStack>
          <form action={settingsAction}>
            <VStack gap={5}>
              <TextInput
                label="Room name"
                id="settings-room-name"
                htmlName="name"
                value={name}
                onChange={setName}
                size="lg"
                isRequired
                {...{ maxLength: 120, required: true }}
              />
              <RoomIconField
                initialIconUrl={room.roomIconUrl}
                inputId="settings-room-icon"
              />
              <RadioList
                label="Visibility"
                htmlName="visibility"
                value={visibility}
                onChange={setVisibility}
              >
                <RadioListItem
                  label="Private"
                  value="private"
                  description="Only people you add can access this room."
                  className="min-h-11"
                />
                <RadioListItem
                  label="Public"
                  value="public"
                  description="Signed-in users can discover and join this room."
                  className="min-h-11"
                />
              </RadioList>
              <ActionMessage state={settingsState} />
              <HStack hAlign="end">
                <SettingsSubmitButton
                  label="Save settings"
                  className="w-full sm:w-auto"
                  pendingLabel="Saving settings…"
                  variant="primary"
                />
              </HStack>
            </VStack>
          </form>
        </VStack>

        <VStack
          as="section"
          gap={5}
          paddingBlockStart={6}
          className="border-t border-border"
          aria-labelledby="collaborators-title"
        >
          <VStack gap={1}>
            <HStack gap={2} vAlign="center">
              <Heading level={2} id="collaborators-title">
                Collaborators
              </Heading>
              <Badge label={room.members.length} />
            </HStack>
            <Text as="p" color="secondary">
              Manage who can access this room.
            </Text>
          </VStack>
          <form action={memberAction}>
            <VStack gap={3}>
              <Text weight="semibold">Add collaborator</Text>
              <HStack
                gap={3}
                className="w-full flex-col! items-stretch! sm:flex-row! sm:items-end!"
              >
                <VStack className="w-full min-w-0 sm:flex-1 [&_label+span]:sr-only">
                  <TextInput
                    label="Email address"
                    description="They’ll need an existing Qollab account."
                    id="member-email"
                    htmlName="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                    size="lg"
                    className="min-h-11"
                    isRequired
                    width="100%"
                    {...{ required: true, autoComplete: "email" }}
                  />
                </VStack>
                <HStack gap={3} vAlign="end" className="w-full sm:w-auto">
                  <VStack className="min-w-0 flex-1 sm:flex-none">
                    <Selector
                      label="Role"
                      htmlName="role"
                      value={startingRole}
                      onChange={setStartingRole}
                      options={roleOptions}
                      size="lg"
                      width="100%"
                      className="min-h-11 sm:w-32"
                    />
                  </VStack>
                  <SettingsSubmitButton
                    label="Add"
                    accessibleLabel="Add collaborator"
                    className="flex-1 sm:flex-none"
                    pendingLabel="Adding…"
                    variant="primary"
                  />
                </HStack>
              </HStack>
              <Text type="supporting" aria-hidden="true">
                They’ll need an existing Qollab account.
              </Text>
              <ActionMessage state={memberState} />
            </VStack>
          </form>
          <List
            aria-label="Room collaborators"
            className="border-t border-border"
          >
            {room.members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                roomSlug={room.slug}
              />
            ))}
          </List>
        </VStack>

        <HStack
          as="section"
          gap={4}
          paddingBlockStart={6}
          className="border-t border-border"
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          aria-labelledby="delete-room-title"
        >
          <VStack gap={1} className="flex-1">
            <Heading level={2} id="delete-room-title">
              Delete room
            </Heading>
            <Text as="p" color="secondary">
              Permanently delete this room and all its shared content.
            </Text>
          </VStack>
          <Button
            label="Delete room"
            variant="danger-ghost"
            className={destructiveClassName}
            onClick={() => setDeleteOpen(true)}
          />
        </HStack>
        <Dialog
          isOpen={deleteOpen}
          onOpenChange={(open) => {
            if (!deleting) setDeleteOpen(open);
          }}
          purpose="form"
          role="alertdialog"
          aria-labelledby={deleteTitleId}
          aria-describedby={deleteDescriptionId}
        >
          <form action={deleteAction}>
            <VStack gap={4} padding={4}>
              <Heading level={2} id={deleteTitleId}>
                Delete this room?
              </Heading>
              <Text as="p" color="secondary" id={deleteDescriptionId}>
                This permanently removes the room, notes, versions, and
                memberships. This can’t be undone.
              </Text>
              <Text as="p" className="break-words">
                Type <strong>{room.name}</strong> to confirm.
              </Text>
              <TextInput
                label="Room name confirmation"
                id="delete-confirmation"
                htmlName="confirmation"
                value={confirmation}
                onChange={setConfirmation}
                hasAutoFocus
                isRequired
                {...{ required: true, autoComplete: "off" }}
              />
              <ActionMessage state={deleteState} />
              <HStack gap={2} hAlign="end" wrap="wrap">
                <Button
                  label="Cancel"
                  variant="ghost"
                  className="min-h-11"
                  isDisabled={deleting}
                  onClick={() => setDeleteOpen(false)}
                />
                <SettingsSubmitButton
                  label="Delete room permanently"
                  pendingLabel="Deleting room…"
                  variant="destructive"
                  disabled={confirmation !== room.name}
                />
              </HStack>
            </VStack>
          </form>
        </Dialog>
      </VStack>
    </>
  );
}

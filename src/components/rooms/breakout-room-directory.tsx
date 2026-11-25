"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { Link as AstryxLink } from "@astryxdesign/core/Link";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  DoorOpen,
  FileText,
  KeyRound,
  Plus,
  Split,
} from "@/components/ui/icons";
import NextLink from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createBreakoutRoomAction,
  openBreakoutRoomAction,
} from "@/app/rooms/[roomId]/breakouts/actions";
import {
  INITIAL_ROOM_ACTION_STATE,
  type RoomActionState,
} from "@/app/rooms/action-state";
import { PANEL_HEADING, PANEL_MUTED, PANEL_ROW } from "@/components/ui/panel";
import { useSuccessToast } from "@/components/ui/toast";
import type { BreakoutRoomDirectoryItem } from "@/lib/breakout-rooms/repository";
import type { RoomRole } from "@/lib/rooms/repository";

interface BreakoutRoomDirectoryProps {
  breakoutRooms: BreakoutRoomDirectoryItem[];
  parentRoomName: string;
  parentRoomSlug: string;
  role: RoomRole;
}

function SubmitButton({
  canSubmit,
  icon,
  label,
  pendingLabel,
}: {
  canSubmit: boolean;
  icon: React.ReactNode;
  label: string;
  pendingLabel: string;
}): React.ReactElement {
  const { pending } = useFormStatus();

  return (
    <Button
      icon={icon}
      isDisabled={!canSubmit || pending}
      isLoading={pending}
      label={pending ? pendingLabel : label}
      size="lg"
      type="submit"
      variant="primary"
      width="100%"
    />
  );
}

function FormMessage({ state }: { state: RoomActionState }) {
  useSuccessToast(state);

  if (!state.message || state.status !== "error") return null;

  return (
    <Text as="p" role="alert" className="rounded-xl bg-error-muted p-3">
      {state.message}
    </Text>
  );
}

function formatCreatedAt(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

export function BreakoutRoomDirectory({
  breakoutRooms,
  parentRoomName,
  parentRoomSlug,
  role,
}: BreakoutRoomDirectoryProps): React.ReactElement {
  const canCreate = role !== "viewer";
  const isNarrow = useMediaQuery("(max-width: 960px)");
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [createState, createAction] = useActionState(
    createBreakoutRoomAction.bind(null, parentRoomSlug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [openState, openAction] = useActionState(
    openBreakoutRoomAction.bind(null, parentRoomSlug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const canSubmitRoom =
    roomName.trim().length > 0 && roomDescription.trim().length > 0;
  const canOpenRoom = /^[A-Z0-9]{8}$/.test(roomCode);

  const sidePanel = (
    <VStack
      as="section"
      gap={4}
      className={PANEL_MUTED}
      aria-labelledby="breakout-form-title"
    >
      <VStack gap={1}>
        <Heading level={2} id="breakout-form-title" className={PANEL_HEADING}>
          {canCreate ? "Add a breakout room" : "Open a room"}
        </Heading>
        <Text color="secondary">
          {canCreate
            ? "Give the group a clear purpose. Every room starts with collaborative notes, a PDF workspace, and a shared board."
            : "Enter the eight-character code shared by your room facilitator."}
        </Text>
      </VStack>

      {canCreate ? (
        <form action={createAction} className="breakout-hub__form">
          <FormLayout defaultOptionality="required">
            <TextInput
              description="Keep it specific and easy to scan."
              htmlName="name"
              label="Room Name"
              onChange={(value) => setRoomName(value.slice(0, 80))}
              placeholder="Case review · Group 1"
              size="lg"
              startIcon={DoorOpen}
              value={roomName}
              width="100%"
            />
            <TextArea
              description="Describe what this group should work on."
              htmlName="description"
              label="Description"
              maxLength={240}
              onChange={(value) => setRoomDescription(value.slice(0, 240))}
              placeholder="Review the evidence and prepare a short recommendation."
              rows={5}
              size="lg"
              startIcon={FileText}
              value={roomDescription}
              width="100%"
            />
            <SubmitButton
              canSubmit={canSubmitRoom}
              icon={<Icon icon={Plus} size="sm" />}
              label="Create breakout room"
              pendingLabel="Creating room…"
            />
            <FormMessage state={createState} />
          </FormLayout>
        </form>
      ) : (
        <form action={openAction} className="breakout-hub__form">
          <FormLayout defaultOptionality="required">
            <TextInput
              description="Codes use letters and numbers."
              htmlName="code"
              label="Breakout Code"
              onChange={(value) =>
                setRoomCode(
                  value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 8),
                )
              }
              placeholder="A1B2C3D4"
              size="lg"
              startIcon={KeyRound}
              value={roomCode}
              width="100%"
            />
            <SubmitButton
              canSubmit={canOpenRoom}
              icon={<Icon icon="chevronRight" size="sm" />}
              label="Open breakout room"
              pendingLabel="Opening room…"
            />
            <FormMessage state={openState} />
          </FormLayout>
        </form>
      )}
    </VStack>
  );

  const roomDirectory = (
    <LayoutContent
      isScrollable
      label="Breakout room directory"
      padding={isNarrow ? 4 : 8}
    >
      <VStack gap={6}>
        <VStack as="header" gap={4} hAlign="start">
          <AstryxLink
            as={NextLink}
            color="secondary"
            href={`/rooms/${parentRoomSlug}`}
            className="hover:bg-transparent! hover:bg-none!"
            isStandalone
            weight="semibold"
          >
            <HStack as="span" align="center" gap={2}>
              <Icon icon={ArrowLeft} size="sm" />
              Back to {parentRoomName}
            </HStack>
          </AstryxLink>
          <VStack gap={2}>
            <Heading
              id="breakout-list-title"
              level={1}
              className="text-2xl! md:text-3xl!"
            >
              Breakout rooms
            </Heading>
            <Text color="secondary">
              Choose a room and continue working with your group.
            </Text>
          </VStack>
        </VStack>

        <VStack
          as="section"
          gap={4}
          className={PANEL_MUTED}
          aria-labelledby="breakout-rooms-title"
        >
          <HStack gap={2} vAlign="center">
            <Heading
              level={2}
              id="breakout-rooms-title"
              className={PANEL_HEADING}
            >
              Rooms
            </Heading>
            <Badge label={breakoutRooms.length} />
          </HStack>

          {breakoutRooms.length > 0 ? (
            <VStack as="ul" gap={2} aria-labelledby="breakout-rooms-title">
              {breakoutRooms.map((breakout) => (
                <HStack
                  as="li"
                  key={breakout.id}
                  gap={4}
                  vAlign="start"
                  className={`${PANEL_ROW} flex-col sm:flex-row sm:items-center`}
                >
                  <VStack gap={1} className="min-w-0 flex-1">
                    <Heading level={3} maxLines={2} className="text-base!">
                      {breakout.name}
                    </Heading>
                    <Text color="secondary" className="wrap-anywhere">
                      {breakout.description ||
                        "A focused space for notes, review, and shared problem-solving."}
                    </Text>
                    <HStack gap={2} wrap="wrap" vAlign="center">
                      {canCreate && breakout.code ? (
                        <code
                          className="breakout-hub__code"
                          aria-label={`Private breakout code ${breakout.code}`}
                        >
                          {breakout.code}
                        </code>
                      ) : breakout.isJoined ? (
                        <Token
                          size="sm"
                          color="green"
                          label="Joined"
                          icon={<CircleCheck aria-hidden="true" size={12} />}
                        />
                      ) : null}
                      <Text type="supporting">
                        Created {formatCreatedAt(breakout.createdAt)}
                      </Text>
                    </HStack>
                  </VStack>
                  {breakout.code && (canCreate || breakout.isJoined) ? (
                    <Button
                      as={NextLink}
                      variant="secondary"
                      label={canCreate ? "Open breakout" : "Reopen breakout"}
                      aria-label={`${canCreate ? "Open" : "Reopen"} breakout: ${breakout.name}`}
                      size="sm"
                      endContent={<ArrowRight aria-hidden="true" size={14} />}
                      href={`/rooms/${parentRoomSlug}/breakouts/${breakout.code}`}
                      className="shrink-0 px-3"
                    />
                  ) : (
                    <HStack gap={2} vAlign="center" className="shrink-0">
                      <KeyRound aria-hidden="true" size={16} />
                      <Text type="supporting">
                        Enter its private code to open
                      </Text>
                    </HStack>
                  )}
                </HStack>
              ))}
            </VStack>
          ) : (
            <EmptyState
              isCompact
              title="No breakout rooms yet"
              description={
                canCreate
                  ? "Use the form to create the first focused room."
                  : "An owner or editor can create the first breakout room."
              }
              icon={<Split />}
            />
          )}
        </VStack>

        {isNarrow ? sidePanel : null}
      </VStack>
    </LayoutContent>
  );

  return (
    <main className="breakout-hub">
      <Layout
        content={roomDirectory}
        end={
          isNarrow ? undefined : (
            <LayoutPanel
              hasDivider
              isScrollable
              label={canCreate ? "Create a breakout room" : "Open a room"}
              padding={6}
              width={384}
            >
              {sidePanel}
            </LayoutPanel>
          )
        }
        height="fill"
      />
    </main>
  );
}

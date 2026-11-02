"use client";

import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@astryxdesign/core/Card";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Icon } from "@astryxdesign/core/Icon";
import { Layout, LayoutContent, LayoutPanel } from "@astryxdesign/core/Layout";
import { Link as AstryxLink } from "@astryxdesign/core/Link";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { useMediaQuery } from "@astryxdesign/core/hooks";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CircleCheck,
  DoorOpen,
  FileText,
  KeyRound,
  PanelsTopLeft,
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
import { useSuccessToast } from "@/components/ui/toast";
import type { BreakoutRoomDirectoryItem } from "@/lib/breakout-rooms/repository";
import type { RoomRole } from "@/lib/rooms/repository";

interface BreakoutRoomDirectoryProps {
  breakoutRooms: BreakoutRoomDirectoryItem[];
  parentRoomName: string;
  parentRoomSlug: string;
  role: RoomRole;
}

const CARD_VARIANTS = [
  "green",
  "purple",
  "orange",
  "blue",
  "pink",
  "teal",
] as const;

const TOOL_TOKENS = [
  { icon: BookOpenText, label: "Notes" },
  { icon: FileText, label: "PDF" },
  { icon: PanelsTopLeft, label: "Board" },
] as const;

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
    <p className="breakout-hub__message" role="alert">
      {state.message}
    </p>
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

  const sidePanel = canCreate ? (
    <Card
      className="breakout-hub__form-card"
      elevation="low"
      padding={6}
      width="100%"
    >
      <VStack gap={6}>
        <HStack align="center" gap={3}>
          <HStack
            as="span"
            align="center"
            className="breakout-hub__panel-icon"
            justify="center"
          >
            <Icon icon={Plus} color="accent" size="lg" />
          </HStack>
          <header className="breakout-hub__form-heading">
            <p>Create a breakout</p>
            <Heading level={2}>Add a new room</Heading>
          </header>
        </HStack>

        <p className="breakout-hub__form-intro">
          Give the group a clear purpose. Every room starts with collaborative
          notes, a PDF workspace, and a shared board.
        </p>

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
      </VStack>
    </Card>
  ) : (
    <Card
      className="breakout-hub__form-card"
      elevation="low"
      padding={6}
      width="100%"
    >
      <VStack gap={6}>
        <HStack align="center" gap={3}>
          <HStack
            as="span"
            align="center"
            className="breakout-hub__panel-icon"
            justify="center"
          >
            <Icon icon={KeyRound} color="accent" size="lg" />
          </HStack>
          <header className="breakout-hub__form-heading">
            <p>Private access</p>
            <Heading level={2}>Open a room</Heading>
          </header>
        </HStack>

        <p className="breakout-hub__form-intro">
          Enter the eight-character code shared by your room facilitator.
        </p>

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
      </VStack>
    </Card>
  );

  const roomDirectory = (
    <LayoutContent
      isScrollable
      label="Breakout room directory"
      padding={isNarrow ? 4 : 8}
    >
      <VStack as="section" gap={6}>
        <header className="breakout-hub__intro">
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

          <HStack align="end" gap={4} justify="between" wrap="wrap">
            <section>
              <p className="breakout-hub__eyebrow">Focused group work</p>
              <Heading id="breakout-list-title" level={1} textWrap="balance">
                Breakout rooms
              </Heading>
              <p className="breakout-hub__subtitle">
                Choose a room and continue working with your group.
              </p>
            </section>
            <Badge
              label={`${breakoutRooms.length} ${
                breakoutRooms.length === 1 ? "room" : "rooms"
              }`}
              variant="neutral"
            />
          </HStack>
        </header>

        {breakoutRooms.length > 0 ? (
          <Grid
            aria-labelledby="breakout-list-title"
            columns={{ max: 3, minWidth: 240, repeat: "fit" }}
            gap={4}
          >
            {breakoutRooms.map((breakout, index) => {
              const variant = CARD_VARIANTS[index % CARD_VARIANTS.length];

              return (
                <article className="breakout-hub__room" key={breakout.id}>
                  <Card
                    className="breakout-hub__room-card"
                    height="100%"
                    padding={5}
                    variant={variant}
                  >
                    <VStack gap={3} height="100%">
                      <HStack align="center" justify="between">
                        <HStack
                          as="span"
                          align="center"
                          className="breakout-hub__card-icon"
                          justify="center"
                        >
                          <Icon icon={DoorOpen} size="lg" />
                        </HStack>
                        {canCreate && breakout.code ? (
                          <code
                            className="breakout-hub__code"
                            aria-label={`Private breakout code ${breakout.code}`}
                          >
                            {breakout.code}
                          </code>
                        ) : breakout.isJoined ? (
                          <Badge
                            icon={<Icon icon={CircleCheck} size="xsm" />}
                            label="Joined"
                            variant="green"
                          />
                        ) : null}
                      </HStack>

                      <section className="breakout-hub__card-copy">
                        <p className="breakout-hub__meta">
                          Created {formatCreatedAt(breakout.createdAt)}
                        </p>
                        <Heading level={3} maxLines={2} textWrap="balance">
                          {breakout.name}
                        </Heading>
                        <p className="breakout-hub__description">
                          {breakout.description ||
                            "A focused space for notes, review, and shared problem-solving."}
                        </p>
                      </section>

                      <HStack
                        aria-label="Available tools"
                        as="ul"
                        gap={2}
                        wrap="wrap"
                      >
                        {TOOL_TOKENS.map((tool) => (
                          <li key={tool.label}>
                            <Token
                              color={variant}
                              icon={<Icon icon={tool.icon} size="xsm" />}
                              label={tool.label}
                              size="sm"
                            />
                          </li>
                        ))}
                      </HStack>

                      {breakout.code && (canCreate || breakout.isJoined) ? (
                        <Button
                          as={NextLink}
                          className="breakout-hub__open"
                          variant="secondary"
                          label={
                            canCreate ? "Open breakout" : "Reopen breakout"
                          }
                          endContent={<Icon icon={ArrowRight} size="sm" />}
                          href={`/rooms/${parentRoomSlug}/breakouts/${breakout.code}`}
                        />
                      ) : (
                        <p className="breakout-hub__locked">
                          <Icon icon={KeyRound} size="sm" />
                          Enter its private code to open
                        </p>
                      )}
                    </VStack>
                  </Card>
                </article>
              );
            })}
          </Grid>
        ) : (
          <Card className="breakout-hub__empty" padding={8} variant="muted">
            <VStack align="center" gap={3}>
              <Icon icon={Split} color="accent" label="" size="lg" />
              <Heading justify="center" level={3}>
                No breakout rooms yet
              </Heading>
              <p>
                {canCreate
                  ? "Use the form to create the first focused room."
                  : "An owner or editor can create the first breakout room."}
              </p>
            </VStack>
          </Card>
        )}

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

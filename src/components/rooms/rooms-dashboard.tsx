"use client";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  DoorOpen,
  Globe2,
  LibraryBig,
  LoaderCircle,
  LogOut,
  LockKeyhole,
  Plus,
  Settings2,
  TriangleAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import {
  createRoomAction,
  joinRoomAction,
  leaveRoomAction,
} from "@/app/rooms/actions";
import { INITIAL_ROOM_ACTION_STATE } from "@/app/rooms/action-state";
import { SidebarAccountMenu } from "@/components/auth/sidebar-account-menu";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import type { RoomDirectory, RoomSummary } from "@/lib/rooms/repository";

import styles from "./rooms-dashboard.module.css";

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

  if (Number.isNaN(date.getTime())) {
    return "Recently active";
  }

  return `Updated ${new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date)}`;
}

function getRoomInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function PendingButton({
  children,
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  className: string;
  pendingLabel: string;
}): React.ReactElement {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="spin" aria-hidden="true" size={17} />
      ) : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  const Icon = isPublic ? Globe2 : LockKeyhole;

  return (
    <span
      className={`${styles.badge} ${
        isPublic ? styles.badgeOpen : styles.badgePrivate
      }`}
    >
      <Icon aria-hidden="true" size={13} />
      {isPublic ? "Open" : "Private"}
    </span>
  );
}

function JoinRoomForm({ room }: { room: RoomSummary }) {
  const [state, action] = useActionState(
    joinRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );

  return (
    <form action={action} className={styles.roomActionForm}>
      {state.status === "error" ? (
        <p
          className="room-inline-message room-inline-message--error"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <PendingButton
        className={styles.roomPrimaryAction}
        pendingLabel="Joining…"
      >
        <DoorOpen aria-hidden="true" size={16} />
        Join room
      </PendingButton>
    </form>
  );
}

function LeaveRoomForm({ room }: { room: RoomSummary }) {
  const [state, action] = useActionState(
    leaveRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const openLeaveDialog = (): void => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    window.requestAnimationFrame(() => {
      dialog
        ?.querySelector<HTMLButtonElement>("[data-leave-dialog-cancel]")
        ?.focus();
    });
  };

  const closeLeaveDialog = (): void => {
    dialogRef.current?.close();
  };

  return (
    <>
      <div className={styles.roomActionForm}>
        <button
          className={styles.roomSecondaryAction}
          onClick={openLeaveDialog}
          ref={triggerRef}
          type="button"
        >
          Leave
        </button>
      </div>

      <dialog
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        className={styles.leaveDialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeLeaveDialog();
          }
        }}
        onClose={() => triggerRef.current?.focus()}
        ref={dialogRef}
      >
        <div className={styles.leaveDialogPanel}>
          <span className={styles.leaveDialogIcon} aria-hidden="true">
            <TriangleAlert size={20} />
          </span>
          <div className={styles.leaveDialogCopy}>
            <p>Room membership</p>
            <h2 id={titleId}>Leave “{room.name}”?</h2>
            <p id={descriptionId}>
              You’ll lose access to this room and its shared study materials.
              You can return if the room is public or you’re invited again.
            </p>
          </div>

          <form action={action} className={styles.leaveDialogForm}>
            {state.status === "error" ? (
              <p
                className="room-inline-message room-inline-message--error"
                role="alert"
              >
                {state.message}
              </p>
            ) : null}
            <div className={styles.leaveDialogActions}>
              <button
                className={styles.leaveDialogCancel}
                data-leave-dialog-cancel
                onClick={closeLeaveDialog}
                type="button"
              >
                Keep room
              </button>
              <PendingButton
                className={styles.leaveDialogConfirm}
                pendingLabel="Leaving…"
              >
                <LogOut aria-hidden="true" size={16} />
                Leave room
              </PendingButton>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

function JoinedRoomRow({ room }: { room: RoomSummary }) {
  const roleClassName =
    room.role === "owner"
      ? styles.badgeOwner
      : room.role === "viewer"
        ? styles.badgeViewer
        : styles.badgeEditor;

  return (
    <article className={styles.roomRow}>
      <div className={styles.roomMonogram} aria-hidden="true">
        {getRoomInitials(room.name)}
      </div>
      <div className={styles.roomDetails}>
        <div className={styles.roomTitleLine}>
          <h2>{room.name}</h2>
          <VisibilityBadge isPublic={room.isPublic} />
        </div>
        <div className={styles.roomMeta}>
          <span className={`${styles.badge} ${roleClassName}`}>
            {room.role}
          </span>
          <span className={styles.roomUpdated}>
            <Clock3 aria-hidden="true" size={13} />
            {formatUpdatedAt(room.updatedAt)}
          </span>
        </div>
      </div>
      <div className={styles.roomActions}>
        {room.role === "owner" ? (
          <Link
            className={styles.roomSecondaryAction}
            href={`/rooms/${room.slug}/settings`}
          >
            <Settings2 aria-hidden="true" size={15} />
            Manage
          </Link>
        ) : (
          <LeaveRoomForm room={room} />
        )}
        <Link className={styles.roomPrimaryAction} href={`/rooms/${room.slug}`}>
          Open room
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  );
}

function PublicRoomRow({ room }: { room: RoomSummary }) {
  return (
    <article className={`${styles.roomRow} ${styles.roomRowPublic}`}>
      <div className={styles.roomMonogram} aria-hidden="true">
        {getRoomInitials(room.name)}
      </div>
      <div className={styles.roomDetails}>
        <div className={styles.roomTitleLine}>
          <h2>{room.name}</h2>
          <VisibilityBadge isPublic />
        </div>
        <span className={styles.roomUpdated}>
          <CalendarDays aria-hidden="true" size={13} />
          {formatUpdatedAt(room.updatedAt)}
        </span>
      </div>
      <JoinRoomForm room={room} />
    </article>
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
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const roomCount = directory.joinedRooms.length;

  const openCreateDialog = (): void => {
    const dialog = createDialogRef.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  };

  const closeCreateDialog = (): void => {
    createDialogRef.current?.close();
  };

  return (
    <main className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brandGroup}>
            <Link
              className={styles.brand}
              href="/rooms"
              aria-label="Qollab rooms"
            >
              <QollabBrandLogo />
            </Link>
          </div>
          <div className={styles.headerActions}>
            <button
              className={styles.newRoomButton}
              onClick={openCreateDialog}
              type="button"
            >
              <Plus aria-hidden="true" size={16} />
              <span>New room</span>
            </button>
            <div className={styles.account}>
              <SidebarAccountMenu
                appearance="header"
                beforeSignOut={prepareRoomHomeSignOut}
                displayName={displayName}
                userId={userId}
              />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <section className={styles.roomsSection} aria-labelledby="rooms-title">
          <header className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>Workspace</p>
              <h1 id="rooms-title">Your rooms</h1>
            </div>
            <p>
              {roomCount} {roomCount === 1 ? "room" : "rooms"}
            </p>
          </header>

          {roomCount > 0 ? (
            <div className={styles.roomList}>
              {directory.joinedRooms.map((room) => (
                <JoinedRoomRow key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateIcon}>
                <LibraryBig aria-hidden="true" size={25} />
              </span>
              <div>
                <h2>No rooms yet</h2>
                <p>Create a room to begin studying with your group.</p>
              </div>
              <button
                className={styles.emptyAction}
                onClick={openCreateDialog}
                type="button"
              >
                Create a room
              </button>
            </div>
          )}
        </section>

        {directory.publicRooms.length > 0 ? (
          <section
            className={`${styles.roomsSection} ${styles.openRoomsSection}`}
            aria-labelledby="open-rooms-title"
          >
            <header className={styles.secondaryHeading}>
              <div>
                <p className={styles.eyebrow}>Available to join</p>
                <h2 id="open-rooms-title">Open rooms</h2>
              </div>
              <p>{directory.publicRooms.length}</p>
            </header>
            <div className={styles.roomList}>
              {directory.publicRooms.map((room) => (
                <PublicRoomRow key={room.id} room={room} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <dialog
        aria-labelledby="create-room-title"
        className={styles.createDialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeCreateDialog();
          }
        }}
        ref={createDialogRef}
      >
        <div className={styles.dialogPanel}>
          <header className={styles.dialogHeading}>
            <div>
              <p className={styles.eyebrow}>New workspace</p>
              <h2 id="create-room-title">Create a room</h2>
            </div>
            <button
              aria-label="Close create room dialog"
              className={styles.dialogClose}
              onClick={closeCreateDialog}
              type="button"
            >
              <X aria-hidden="true" size={18} />
            </button>
          </header>
          <p className={styles.dialogIntro}>
            Give your group a focused place for notes, files, and live study
            sessions.
          </p>

          <form action={createAction} className={styles.createForm}>
            <label htmlFor="room-name">Room name</label>
            <input
              id="room-name"
              maxLength={120}
              name="name"
              placeholder="e.g. Cardiovascular pharmacology"
              required
              type="text"
            />

            <fieldset>
              <legend>Access</legend>
              <div className={styles.visibilityGrid}>
                <label className={styles.visibilityOption}>
                  <input
                    defaultChecked
                    name="visibility"
                    type="radio"
                    value="private"
                  />
                  <span className={styles.visibilityIcon}>
                    <LockKeyhole aria-hidden="true" size={17} />
                  </span>
                  <span>
                    <strong>Private</strong>
                    <small>Invite only</small>
                  </span>
                </label>
                <label className={styles.visibilityOption}>
                  <input name="visibility" type="radio" value="public" />
                  <span className={styles.visibilityIcon}>
                    <Globe2 aria-hidden="true" size={17} />
                  </span>
                  <span>
                    <strong>Public</strong>
                    <small>Anyone can join</small>
                  </span>
                </label>
              </div>
            </fieldset>

            {createState.message ? (
              <p
                className={`room-inline-message room-inline-message--${createState.status}`}
                role={createState.status === "error" ? "alert" : "status"}
              >
                {createState.message}
              </p>
            ) : null}

            <PendingButton
              className={styles.createSubmit}
              pendingLabel="Creating room…"
            >
              Create room
              <ArrowRight aria-hidden="true" size={17} />
            </PendingButton>
          </form>
          <p className={styles.createFootnote}>
            <LockKeyhole aria-hidden="true" size={12} />
            You can change access anytime
          </p>
        </div>
      </dialog>
    </main>
  );
}

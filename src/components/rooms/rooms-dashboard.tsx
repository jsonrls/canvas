"use client";

import {
  ArrowRight,
  BookOpenText,
  DoorOpen,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Settings2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createRoomAction,
  INITIAL_ROOM_ACTION_STATE,
  joinRoomAction,
  leaveRoomAction,
} from "@/app/rooms/actions";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { RoomDirectory, RoomSummary } from "@/lib/rooms/repository";

interface RoomsDashboardProps {
  directory: RoomDirectory;
  displayName: string;
  userId: string;
}

async function prepareRoomHomeSignOut(): Promise<void> {
  await Promise.resolve();
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
    <span className="room-visibility-badge">
      <Icon aria-hidden="true" size={14} />
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

function JoinRoomForm({ room }: { room: RoomSummary }) {
  const [state, action] = useActionState(
    joinRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );

  return (
    <form action={action} className="room-card-action-form">
      {state.status === "error" ? (
        <p
          className="room-inline-message room-inline-message--error"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <PendingButton
        className="room-card-primary-action"
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

  return (
    <form
      action={action}
      className="room-card-action-form"
      onSubmit={(event) => {
        if (!window.confirm(`Leave “${room.name}”?`)) {
          event.preventDefault();
        }
      }}
    >
      {state.status === "error" ? (
        <p
          className="room-inline-message room-inline-message--error"
          role="alert"
        >
          {state.message}
        </p>
      ) : null}
      <PendingButton className="room-card-link-action" pendingLabel="Leaving…">
        Leave
      </PendingButton>
    </form>
  );
}

function JoinedRoomCard({ room }: { room: RoomSummary }) {
  return (
    <article className="room-directory-card room-directory-card--joined">
      <div className="room-card-topline">
        <VisibilityBadge isPublic={room.isPublic} />
        <span className={`room-role-badge room-role-badge--${room.role}`}>
          {room.role}
        </span>
      </div>
      <div>
        <h3>{room.name}</h3>
        <p>Shared notes, live presence, and version history.</p>
      </div>
      <div className="room-card-actions">
        <Link className="room-card-primary-action" href={`/rooms/${room.slug}`}>
          Open room
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
        {room.role === "owner" ? (
          <Link
            className="room-card-link-action"
            href={`/rooms/${room.slug}/settings`}
          >
            <Settings2 aria-hidden="true" size={15} />
            Manage
          </Link>
        ) : (
          <LeaveRoomForm room={room} />
        )}
      </div>
    </article>
  );
}

function PublicRoomCard({ room }: { room: RoomSummary }) {
  return (
    <article className="room-directory-card">
      <div className="room-card-topline">
        <VisibilityBadge isPublic />
        <span className="room-role-badge">Discover</span>
      </div>
      <div>
        <h3>{room.name}</h3>
        <p>Join explicitly to open this room and collaborate on its notes.</p>
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

  return (
    <main className="rooms-home-shell">
      <header className="rooms-home-header">
        <Link
          className="brand-lockup"
          href="/rooms"
          aria-label="BoardPrep rooms"
        >
          <span className="brand-mark" aria-hidden="true">
            BP
          </span>
          <span className="brand-name">BoardPrep</span>
        </Link>
        <div className="rooms-home-user">
          <span>
            Signed in as <strong>{displayName}</strong>
          </span>
          <SignOutButton
            beforeSignOut={prepareRoomHomeSignOut}
            userId={userId}
          />
        </div>
      </header>

      <div className="rooms-home-content">
        <section className="rooms-home-hero" aria-labelledby="rooms-title">
          <div>
            <p className="eyebrow">Your study workspace</p>
            <h1 id="rooms-title">Build a room for the next exam block.</h1>
            <p>
              Keep one dependable set of notes with the people preparing beside
              you.
            </p>
          </div>
          <div className="rooms-home-stat" aria-label="Joined room count">
            <UsersRound aria-hidden="true" size={21} />
            <strong>{directory.joinedRooms.length}</strong>
            <span>
              {directory.joinedRooms.length === 1
                ? "joined room"
                : "joined rooms"}
            </span>
          </div>
        </section>

        <div className="rooms-home-layout">
          <div className="rooms-directory-column">
            <section
              className="room-list-section"
              aria-labelledby="joined-rooms-title"
            >
              <div className="room-list-heading">
                <div>
                  <p className="eyebrow">Ready to open</p>
                  <h2 id="joined-rooms-title">Your rooms</h2>
                </div>
                <BookOpenText aria-hidden="true" size={22} />
              </div>

              {directory.joinedRooms.length > 0 ? (
                <div className="room-card-grid">
                  {directory.joinedRooms.map((room) => (
                    <JoinedRoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="rooms-empty-state">
                  <BookOpenText aria-hidden="true" size={24} />
                  <h3>No rooms yet</h3>
                  <p>
                    Create a private room for yourself or a public one others
                    can join.
                  </p>
                </div>
              )}
            </section>

            <section
              className="room-list-section"
              aria-labelledby="public-rooms-title"
            >
              <div className="room-list-heading">
                <div>
                  <p className="eyebrow">Open study groups</p>
                  <h2 id="public-rooms-title">Discover public rooms</h2>
                </div>
                <Globe2 aria-hidden="true" size={22} />
              </div>

              {directory.publicRooms.length > 0 ? (
                <div className="room-card-grid">
                  {directory.publicRooms.map((room) => (
                    <PublicRoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="rooms-empty-state rooms-empty-state--compact">
                  <Globe2 aria-hidden="true" size={22} />
                  <p>No other public rooms are available right now.</p>
                </div>
              )}
            </section>
          </div>

          <aside
            className="create-room-panel"
            aria-labelledby="create-room-title"
          >
            <div className="create-room-icon" aria-hidden="true">
              <Plus size={20} />
            </div>
            <p className="eyebrow">New workspace</p>
            <h2 id="create-room-title">Create a study room</h2>
            <p>
              A shared notes document and your owner membership are created
              together.
            </p>

            <form action={createAction} className="create-room-form">
              <label htmlFor="room-name">Room name</label>
              <input
                id="room-name"
                name="name"
                type="text"
                maxLength={120}
                placeholder="Cardiovascular pharmacology"
                required
              />

              <fieldset>
                <legend>Who can find it?</legend>
                <label className="visibility-option">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    defaultChecked
                  />
                  <LockKeyhole aria-hidden="true" size={17} />
                  <span>
                    <strong>Private</strong>
                    <small>Only people you add can open it.</small>
                  </span>
                </label>
                <label className="visibility-option">
                  <input type="radio" name="visibility" value="public" />
                  <Globe2 aria-hidden="true" size={17} />
                  <span>
                    <strong>Public</strong>
                    <small>Signed-in users can discover and join.</small>
                  </span>
                </label>
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
                className="create-room-submit"
                pendingLabel="Creating room…"
              >
                <Plus aria-hidden="true" size={17} />
                Create room
              </PendingButton>
            </form>
          </aside>
        </div>
      </div>
    </main>
  );
}

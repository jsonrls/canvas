"use client";

import {
  ArrowRight,
  BookMarked,
  CalendarDays,
  ChevronRight,
  Clock3,
  DoorOpen,
  Globe2,
  LayoutGrid,
  LibraryBig,
  LoaderCircle,
  List,
  LockKeyhole,
  Plus,
  Search,
  Settings2,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useActionState, useCallback, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";

import {
  createRoomAction,
  joinRoomAction,
  leaveRoomAction,
} from "@/app/rooms/actions";
import { INITIAL_ROOM_ACTION_STATE } from "@/app/rooms/action-state";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import type { RoomDirectory, RoomSummary } from "@/lib/rooms/repository";

interface RoomsDashboardProps {
  directory: RoomDirectory;
  displayName: string;
  userId: string;
}

type RoomLayout = "grid" | "list";

const JOINED_ROOM_LAYOUT_KEY = "qollab:rooms-layout:joined:v1";
const PUBLIC_ROOM_LAYOUT_KEY = "qollab:rooms-layout:public:v1";
const DEFAULT_ROOM_LAYOUT: RoomLayout = "grid";
const roomLayoutMemory = new Map<string, RoomLayout>();
const roomLayoutListeners = new Map<string, Set<() => void>>();
let isStorageListenerActive = false;

async function prepareRoomHomeSignOut(): Promise<void> {
  await Promise.resolve();
}

function isRoomLayout(value: string | null): value is RoomLayout {
  return value === "grid" || value === "list";
}

function getDefaultRoomLayout(): RoomLayout {
  return DEFAULT_ROOM_LAYOUT;
}

function readStoredRoomLayout(storageKey: string): RoomLayout {
  const cachedLayout = roomLayoutMemory.get(storageKey);

  if (cachedLayout) {
    return cachedLayout;
  }

  try {
    const storedLayout = window.localStorage.getItem(storageKey);

    if (isRoomLayout(storedLayout)) {
      roomLayoutMemory.set(storageKey, storedLayout);
      return storedLayout;
    }
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }

  return DEFAULT_ROOM_LAYOUT;
}

function notifyRoomLayoutListeners(storageKey: string): void {
  roomLayoutListeners.get(storageKey)?.forEach((listener) => listener());
}

function handleRoomLayoutStorage(event: StorageEvent): void {
  if (event.key === null) {
    roomLayoutMemory.clear();
    roomLayoutListeners.forEach((listeners) => {
      listeners.forEach((listener) => listener());
    });
    return;
  }

  if (!roomLayoutListeners.has(event.key)) {
    return;
  }

  roomLayoutMemory.delete(event.key);
  notifyRoomLayoutListeners(event.key);
}

function subscribeToRoomLayout(
  storageKey: string,
  listener: () => void,
): () => void {
  const listeners = roomLayoutListeners.get(storageKey) ?? new Set();
  listeners.add(listener);
  roomLayoutListeners.set(storageKey, listeners);

  if (!isStorageListenerActive) {
    window.addEventListener("storage", handleRoomLayoutStorage);
    isStorageListenerActive = true;
  }

  return () => {
    const currentListeners = roomLayoutListeners.get(storageKey);
    currentListeners?.delete(listener);

    if (currentListeners?.size === 0) {
      roomLayoutListeners.delete(storageKey);
    }

    if (roomLayoutListeners.size === 0 && isStorageListenerActive) {
      window.removeEventListener("storage", handleRoomLayoutStorage);
      isStorageListenerActive = false;
    }
  };
}

function writeStoredRoomLayout(storageKey: string, layout: RoomLayout): void {
  roomLayoutMemory.set(storageKey, layout);

  try {
    window.localStorage.setItem(storageKey, layout);
  } catch {
    // Keep the in-memory preference working when storage is unavailable.
  }

  notifyRoomLayoutListeners(storageKey);
}

function usePersistedRoomLayout(
  storageKey: string,
): [RoomLayout, (layout: RoomLayout) => void] {
  const subscribe = useCallback(
    (listener: () => void) => subscribeToRoomLayout(storageKey, listener),
    [storageKey],
  );
  const getSnapshot = useCallback(
    () => readStoredRoomLayout(storageKey),
    [storageKey],
  );
  const layout = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getDefaultRoomLayout,
  );
  const setLayout = useCallback(
    (nextLayout: RoomLayout) => writeStoredRoomLayout(storageKey, nextLayout),
    [storageKey],
  );

  return [layout, setLayout];
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
    <span className="room-visibility-badge">
      <Icon aria-hidden="true" size={14} />
      {isPublic ? "Open" : "Private"}
    </span>
  );
}

function RoomViewToggle({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (layout: RoomLayout) => void;
  value: RoomLayout;
}): React.ReactElement {
  return (
    <div className="room-view-toggle" role="group" aria-label={`${label} view`}>
      <button
        aria-label={`Show ${label} as cards`}
        aria-pressed={value === "grid"}
        onClick={() => onChange("grid")}
        title="Card view"
        type="button"
      >
        <LayoutGrid aria-hidden="true" size={16} />
        <span>Cards</span>
      </button>
      <button
        aria-label={`Show ${label} as a list`}
        aria-pressed={value === "list"}
        onClick={() => onChange("list")}
        title="List view"
        type="button"
      >
        <List aria-hidden="true" size={17} />
        <span>List</span>
      </button>
    </div>
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
        <div className="room-card-monogram" aria-hidden="true">
          {getRoomInitials(room.name)}
        </div>
        <span className={`room-role-badge room-role-badge--${room.role}`}>
          {room.role}
        </span>
      </div>
      <div className="room-card-copy">
        <VisibilityBadge isPublic={room.isPublic} />
        <h3>{room.name}</h3>
        <p>Notes, study tools, and your group’s ideas—all in one place.</p>
        <span className="room-card-updated">
          <Clock3 aria-hidden="true" size={13} />
          {formatUpdatedAt(room.updatedAt)}
        </span>
      </div>
      <div className="room-card-actions">
        <Link className="room-card-primary-action" href={`/rooms/${room.slug}`}>
          Continue
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
    <article className="room-directory-card room-directory-card--public">
      <div className="room-card-topline">
        <div className="room-card-monogram" aria-hidden="true">
          {getRoomInitials(room.name)}
        </div>
        <VisibilityBadge isPublic />
      </div>
      <div className="room-card-copy">
        <h3>{room.name}</h3>
        <p>A public study table with shared notes and live collaboration.</p>
        <span className="room-card-updated">
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
  const [joinedLayout, setJoinedLayout] = usePersistedRoomLayout(
    JOINED_ROOM_LAYOUT_KEY,
  );
  const [publicLayout, setPublicLayout] = usePersistedRoomLayout(
    PUBLIC_ROOM_LAYOUT_KEY,
  );
  const displayInitial = displayName.trim().charAt(0).toUpperCase() || "Q";
  const firstName = displayName.trim().split(/\s+/)[0] || "there";

  return (
    <main className="rooms-home-shell">
      <header className="rooms-home-header">
        <div className="rooms-home-header__inner">
          <div className="rooms-home-brand">
            <Link
              className="brand-lockup"
              href="/rooms"
              aria-label="Qollab rooms"
            >
              <QollabBrandLogo />
            </Link>
            <span className="rooms-home-brand__section">Study rooms</span>
          </div>
          <div className="rooms-home-user">
            <span className="rooms-user-avatar" aria-hidden="true">
              {displayInitial}
            </span>
            <span className="rooms-user-copy">
              <small>Signed in as</small>
              <strong>{displayName}</strong>
            </span>
            <SignOutButton
              beforeSignOut={prepareRoomHomeSignOut}
              userId={userId}
            />
          </div>
        </div>
      </header>

      <div className="rooms-home-content">
        <section
          className="rooms-welcome"
          aria-labelledby="rooms-welcome-title"
        >
          <div className="rooms-welcome__copy">
            <p className="rooms-welcome__eyebrow">
              <span aria-hidden="true" />
              Your shared study space
            </p>
            <h1 id="rooms-welcome-title">
              Make today&apos;s study time <em>count</em>, {firstName}.
            </h1>
            <p>
              Pick up where your group left off, or start a room for the next
              idea worth working through together.
            </p>
          </div>
          <dl className="rooms-welcome__stats">
            <div>
              <dt>On your desk</dt>
              <dd>{directory.joinedRooms.length}</dd>
              <span>active rooms</span>
            </div>
            <div>
              <dt>Open to explore</dt>
              <dd>{directory.publicRooms.length}</dd>
              <span>community rooms</span>
            </div>
          </dl>
          <div className="rooms-welcome__motif" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        <div className="rooms-home-layout">
          <div className="rooms-directory-column">
            <section
              className="room-list-section"
              aria-labelledby="joined-rooms-title"
            >
              <div className="room-list-heading">
                <div className="room-list-title">
                  <span className="room-list-icon room-list-icon--blue">
                    <BookMarked aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <p className="eyebrow">Your study desk</p>
                    <h2 id="joined-rooms-title">Continue studying</h2>
                  </div>
                </div>
                <div className="room-list-heading__actions">
                  <span className="room-list-count">
                    {directory.joinedRooms.length}
                    <span className="sr-only">
                      {directory.joinedRooms.length === 1 ? " room" : " rooms"}
                    </span>
                  </span>
                  <RoomViewToggle
                    label="your rooms"
                    onChange={setJoinedLayout}
                    value={joinedLayout}
                  />
                </div>
              </div>

              {directory.joinedRooms.length > 0 ? (
                <div
                  className={`room-card-grid room-card-grid--${joinedLayout}`}
                >
                  {directory.joinedRooms.map((room) => (
                    <JoinedRoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="rooms-empty-state">
                  <span className="rooms-empty-state__icon">
                    <LibraryBig aria-hidden="true" size={25} />
                  </span>
                  <div>
                    <h3>Your study desk is clear</h3>
                    <p>
                      Create your first room and give your ideas a place to
                      gather.
                    </p>
                  </div>
                  <ChevronRight aria-hidden="true" size={20} />
                </div>
              )}
            </section>

            <section
              className="room-list-section room-list-section--discover"
              aria-labelledby="public-rooms-title"
            >
              <div className="room-list-heading">
                <div className="room-list-title">
                  <span className="room-list-icon room-list-icon--coral">
                    <UsersRound aria-hidden="true" size={18} />
                  </span>
                  <div>
                    <p className="eyebrow">The community shelf</p>
                    <h2 id="public-rooms-title">Discover open rooms</h2>
                  </div>
                </div>
                <div className="room-list-heading__actions">
                  <span className="room-list-count">
                    {directory.publicRooms.length}
                    <span className="sr-only">
                      {directory.publicRooms.length === 1 ? " room" : " rooms"}
                    </span>
                  </span>
                  <RoomViewToggle
                    label="public rooms"
                    onChange={setPublicLayout}
                    value={publicLayout}
                  />
                </div>
              </div>

              {directory.publicRooms.length > 0 ? (
                <div
                  className={`room-card-grid room-card-grid--${publicLayout}`}
                >
                  {directory.publicRooms.map((room) => (
                    <PublicRoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <div className="rooms-empty-state rooms-empty-state--compact">
                  <Search aria-hidden="true" size={21} />
                  <div>
                    <h3>The shelf is quiet</h3>
                    <p>No other public rooms are available right now.</p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside
            className="create-room-panel"
            aria-labelledby="create-room-title"
          >
            <div className="create-room-panel__heading">
              <div className="create-room-icon" aria-hidden="true">
                <Plus size={20} />
              </div>
              <span>01 / New room</span>
            </div>
            <p className="eyebrow">Start something together</p>
            <h2 id="create-room-title">Set a new table.</h2>
            <p>
              Open a focused space for notes, ideas, and the people learning
              alongside you.
            </p>

            <form action={createAction} className="create-room-form">
              <label htmlFor="room-name">What are you studying?</label>
              <input
                id="room-name"
                name="name"
                type="text"
                maxLength={120}
                placeholder="e.g. Cardiovascular pharmacology"
                required
              />

              <fieldset>
                <legend>Choose who can find it</legend>
                <div className="visibility-option-grid">
                  <label className="visibility-option">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      defaultChecked
                    />
                    <span className="visibility-option__icon">
                      <LockKeyhole aria-hidden="true" size={17} />
                    </span>
                    <span>
                      <strong>Private</strong>
                      <small>Invite only</small>
                    </span>
                  </label>
                  <label className="visibility-option">
                    <input type="radio" name="visibility" value="public" />
                    <span className="visibility-option__icon">
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
                className="create-room-submit"
                pendingLabel="Creating room…"
              >
                Create study room
                <ArrowRight aria-hidden="true" size={17} />
              </PendingButton>
            </form>
            <p className="create-room-footnote">
              <LockKeyhole aria-hidden="true" size={12} />
              You can change access anytime
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

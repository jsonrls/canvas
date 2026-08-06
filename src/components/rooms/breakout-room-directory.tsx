"use client";

import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CircleCheck,
  DoorOpen,
  FileText,
  KeyRound,
  LoaderCircle,
  PanelsTopLeft,
  Plus,
  Split,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import {
  createBreakoutRoomAction,
  openBreakoutRoomAction,
} from "@/app/rooms/[roomId]/breakouts/actions";
import { INITIAL_ROOM_ACTION_STATE } from "@/app/rooms/action-state";
import type { BreakoutRoomDirectoryItem } from "@/lib/breakout-rooms/repository";
import type { RoomRole } from "@/lib/rooms/repository";

interface BreakoutRoomDirectoryProps {
  breakoutRooms: BreakoutRoomDirectoryItem[];
  currentUser: {
    displayName: string;
    id: string;
  };
  parentRoomName: string;
  parentRoomSlug: string;
  role: RoomRole;
}

function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "primary" | "secondary";
}): React.ReactElement {
  const { pending } = useFormStatus();

  return (
    <button
      className={`breakout-directory__submit breakout-directory__submit--${variant}`}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle className="spin" aria-hidden="true" size={15} />
      ) : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

function FormMessage({
  message,
  status,
}: {
  message: string;
  status: "idle" | "error" | "success";
}): React.ReactElement | null {
  if (!message) return null;

  return (
    <p
      className={`breakout-directory__message breakout-directory__message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
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

async function prepareDirectorySignOut(): Promise<void> {
  await Promise.resolve();
}

export function BreakoutRoomDirectory({
  breakoutRooms,
  currentUser,
  parentRoomName,
  parentRoomSlug,
  role,
}: BreakoutRoomDirectoryProps): React.ReactElement {
  const canCreate = role !== "viewer";
  const [createState, createAction] = useActionState(
    createBreakoutRoomAction.bind(null, parentRoomSlug),
    INITIAL_ROOM_ACTION_STATE,
  );
  const [openState, openAction] = useActionState(
    openBreakoutRoomAction.bind(null, parentRoomSlug),
    INITIAL_ROOM_ACTION_STATE,
  );

  return (
    <main className="breakout-directory">
      <header className="room-header breakout-directory__header">
        <div className="brand-lockup">
          <Link
            className="brand-home-link"
            href="/rooms"
            aria-label="All study rooms"
          >
            <QollabBrandLogo />
          </Link>
          <span className="brand-divider" aria-hidden="true" />
          <Link
            className="breakout-directory__room-link"
            href={`/rooms/${parentRoomSlug}`}
          >
            {parentRoomName}
          </Link>
        </div>

        <div className="header-actions">
          <span className="header-room-context">
            <UsersRound aria-hidden="true" size={14} />
            {role}
          </span>
          <SignOutButton
            beforeSignOut={prepareDirectorySignOut}
            userId={currentUser.id}
          />
        </div>
      </header>

      <section className="breakout-directory__content">
        <Link
          className="breakout-directory__back"
          href={`/rooms/${parentRoomSlug}`}
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to {parentRoomName}
        </Link>

        <div
          className={`breakout-directory__layout${canCreate ? " breakout-directory__layout--creator" : ""}`}
        >
          <section
            className="breakout-directory__rooms"
            aria-labelledby="breakout-list-title"
          >
            <div className="breakout-directory__section-heading">
              <div>
                <p className="sidebar-label">Room directory</p>
                <h1 id="breakout-list-title">Breakout rooms</h1>
              </div>
              <span>
                {breakoutRooms.length}{" "}
                {breakoutRooms.length === 1 ? "room" : "rooms"}
              </span>
            </div>

            {canCreate ? (
              <form
                action={createAction}
                className="breakout-directory__create-bar"
              >
                <span className="breakout-directory__create-icon">
                  <Plus aria-hidden="true" size={17} />
                </span>
                <div className="breakout-directory__create-copy">
                  <strong>Create a breakout</strong>
                  <span>Start a focused group workspace</span>
                </div>
                <label
                  className="visually-hidden"
                  htmlFor="directory-breakout-name"
                >
                  Breakout room name
                </label>
                <input
                  id="directory-breakout-name"
                  maxLength={80}
                  name="name"
                  placeholder="Group 1 · Case review"
                  required
                />
                <SubmitButton pendingLabel="Creating…">
                  <Plus aria-hidden="true" size={15} />
                  Create
                </SubmitButton>
                <FormMessage {...createState} />
              </form>
            ) : null}

            {breakoutRooms.length > 0 ? (
              <div className="breakout-directory__grid">
                {breakoutRooms.map((breakout, index) => (
                  <article
                    className="breakout-directory__card"
                    key={breakout.id}
                    style={
                      {
                        "--breakout-card-index": index,
                      } as React.CSSProperties
                    }
                  >
                    <div className="breakout-directory__card-top">
                      <span className="breakout-directory__card-icon">
                        <DoorOpen aria-hidden="true" size={19} />
                      </span>
                      {canCreate && breakout.code ? (
                        <span
                          className="breakout-directory__code"
                          aria-label={`Private breakout code ${breakout.code}`}
                        >
                          {breakout.code}
                        </span>
                      ) : breakout.isJoined ? (
                        <span className="breakout-directory__joined">
                          <CircleCheck aria-hidden="true" size={13} />
                          Joined
                        </span>
                      ) : null}
                    </div>
                    <div className="breakout-directory__card-copy">
                      <p>Created {formatCreatedAt(breakout.createdAt)}</p>
                      <h3>{breakout.name}</h3>
                    </div>
                    <ul
                      className="breakout-directory__tools"
                      aria-label="Available tools"
                    >
                      <li>
                        <BookOpenText aria-hidden="true" size={13} />
                        Notes
                      </li>
                      <li>
                        <FileText aria-hidden="true" size={13} />
                        PDF
                      </li>
                      <li>
                        <PanelsTopLeft aria-hidden="true" size={13} />
                        Board
                      </li>
                    </ul>
                    {breakout.code && (canCreate || breakout.isJoined) ? (
                      <Link
                        className="breakout-directory__open"
                        href={`/rooms/${parentRoomSlug}/breakouts/${breakout.code}`}
                      >
                        {canCreate ? "Open breakout" : "Reopen breakout"}
                        <ArrowRight aria-hidden="true" size={16} />
                      </Link>
                    ) : (
                      <div className="breakout-directory__code-required">
                        <KeyRound aria-hidden="true" size={14} />
                        Enter its private code to open
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="breakout-directory__empty">
                <span>
                  <Split aria-hidden="true" size={25} />
                </span>
                <h3>No breakout rooms yet</h3>
                <p>
                  {canCreate
                    ? "Create the first focused space for this study room."
                    : "An owner or editor can create the first breakout room."}
                </p>
              </div>
            )}
          </section>

          {!canCreate ? (
            <aside
              className="breakout-directory__controls"
              aria-label="Participant breakout room access"
            >
              <div className="breakout-directory__control-heading">
                <span>
                  <KeyRound aria-hidden="true" size={18} />
                </span>
                <div>
                  <p className="sidebar-label">Quick access</p>
                  <h2>Enter a room code</h2>
                </div>
              </div>
              <p className="breakout-directory__viewer-note">
                Enter the code shared by your room facilitator.
              </p>
              <form action={openAction} className="breakout-directory__form">
                <label htmlFor="directory-breakout-code">Breakout code</label>
                <input
                  autoCapitalize="characters"
                  autoComplete="off"
                  id="directory-breakout-code"
                  inputMode="text"
                  maxLength={8}
                  minLength={8}
                  name="code"
                  placeholder="A1B2C3D4"
                  required
                />
                <SubmitButton pendingLabel="Opening…" variant="secondary">
                  Open with code
                  <ArrowRight aria-hidden="true" size={15} />
                </SubmitButton>
                <FormMessage {...openState} />
              </form>
            </aside>
          ) : null}
        </div>
      </section>
    </main>
  );
}

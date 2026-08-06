"use client";

import {
  ArrowRight,
  CircleCheck,
  DoorOpen,
  LoaderCircle,
  Plus,
  Split,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createBreakoutRoomAction,
  openBreakoutRoomAction,
} from "@/app/rooms/[roomId]/breakouts/actions";
import { INITIAL_ROOM_ACTION_STATE } from "@/app/rooms/action-state";
import type { BreakoutRoomDirectoryItem } from "@/lib/breakout-rooms/repository";
import type { RoomRole } from "@/lib/rooms/repository";

interface BreakoutRoomMenuProps {
  breakoutRooms: BreakoutRoomDirectoryItem[];
  parentRoomSlug: string;
  role: RoomRole;
}

function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}): React.ReactElement {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      {pending ? (
        <LoaderCircle className="spin" aria-hidden="true" size={14} />
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
      className={`breakout-menu__message breakout-menu__message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
  );
}

export function BreakoutRoomMenu({
  breakoutRooms,
  parentRoomSlug,
  role,
}: BreakoutRoomMenuProps): React.ReactElement {
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
    <details className="breakout-menu">
      <summary className="breakout-menu__trigger">
        <Split aria-hidden="true" size={16} />
        <span>Breakouts</span>
        <strong>{breakoutRooms.length}</strong>
      </summary>

      <div className="breakout-menu__popover">
        <div className="breakout-menu__heading">
          <div>
            <p className="eyebrow">Small-group spaces</p>
            <h2>Breakout rooms</h2>
          </div>
          <span>{breakoutRooms.length}</span>
        </div>

        {breakoutRooms.length > 0 ? (
          <ul className="breakout-menu__list">
            {breakoutRooms.map((breakout) => (
              <li key={breakout.id}>
                {breakout.code && (canCreate || breakout.isJoined) ? (
                  <Link
                    href={`/rooms/${parentRoomSlug}/breakouts/${breakout.code}`}
                  >
                    <span
                      className="breakout-menu__room-icon"
                      aria-hidden="true"
                    >
                      <DoorOpen size={15} />
                    </span>
                    <span>
                      <strong>{breakout.name}</strong>
                      <small>
                        {canCreate ? (
                          <>Private code {breakout.code}</>
                        ) : (
                          <>
                            <CircleCheck aria-hidden="true" size={11} />
                            Joined · reopen anytime
                          </>
                        )}
                      </small>
                    </span>
                    <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                ) : (
                  <div className="breakout-menu__private-room">
                    <span
                      className="breakout-menu__room-icon"
                      aria-hidden="true"
                    >
                      <DoorOpen size={15} />
                    </span>
                    <span>
                      <strong>{breakout.name}</strong>
                      <small>Private code required</small>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="breakout-menu__empty">
            <Split aria-hidden="true" size={20} />
            <p>No breakout rooms yet.</p>
          </div>
        )}

        <form action={openAction} className="breakout-menu__form">
          <label htmlFor="breakout-code">Open with a code</label>
          <div>
            <input
              id="breakout-code"
              name="code"
              inputMode="text"
              maxLength={8}
              minLength={8}
              placeholder="A1B2C3D4"
              autoCapitalize="characters"
              autoComplete="off"
              required
            />
            <SubmitButton pendingLabel="Opening…">Open</SubmitButton>
          </div>
          <FormMessage {...openState} />
        </form>

        {canCreate ? (
          <form
            action={createAction}
            className="breakout-menu__form breakout-menu__form--create"
          >
            <label htmlFor="breakout-name">Create a breakout</label>
            <div>
              <input
                id="breakout-name"
                name="name"
                maxLength={80}
                placeholder="Group 1 · Case review"
                required
              />
              <SubmitButton pendingLabel="Creating…">
                <Plus aria-hidden="true" size={14} />
                Create
              </SubmitButton>
            </div>
            <FormMessage {...createState} />
          </form>
        ) : (
          <p className="breakout-menu__viewer-note">
            Viewers can open breakouts but cannot create them.
          </p>
        )}
      </div>
    </details>
  );
}

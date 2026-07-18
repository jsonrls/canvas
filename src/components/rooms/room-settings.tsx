"use client";

import {
  ArrowLeft,
  Crown,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Save,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  addRoomMemberAction,
  changeRoomMemberRoleAction,
  deleteRoomAction,
  removeRoomMemberAction,
  updateRoomAction,
} from "@/app/rooms/actions";
import { INITIAL_ROOM_ACTION_STATE } from "@/app/rooms/action-state";
import type { RoomMember, RoomSettings } from "@/lib/rooms/repository";

function SettingsSubmitButton({
  children,
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  className: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="spin" aria-hidden="true" size={16} />
      ) : null}
      {pending ? pendingLabel : children}
    </button>
  );
}

function ActionMessage({
  message,
  status,
}: {
  message: string;
  status: "idle" | "error" | "success";
}) {
  if (!message) return null;

  return (
    <p
      className={`room-inline-message room-inline-message--${status}`}
      role={status === "error" ? "alert" : "status"}
    >
      {message}
    </p>
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
  const [removeState, removeAction] = useActionState(
    removeRoomMemberAction.bind(null, roomSlug, member.userId),
    INITIAL_ROOM_ACTION_STATE,
  );
  const isOwner = member.role === "owner";

  return (
    <li className="room-member-row">
      <div className="room-member-identity">
        <span className="room-member-avatar" aria-hidden="true">
          {member.displayName.charAt(0).toUpperCase()}
        </span>
        <div>
          <strong>{member.displayName}</strong>
          <small>
            {isOwner
              ? "Room owner"
              : `Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
          </small>
        </div>
      </div>

      {isOwner ? (
        <span className="owner-role-label">
          <Crown aria-hidden="true" size={15} />
          Owner
        </span>
      ) : (
        <div className="room-member-controls">
          <form action={roleAction} className="member-role-form">
            <label className="sr-only" htmlFor={`role-${member.userId}`}>
              Role for {member.displayName}
            </label>
            <select
              id={`role-${member.userId}`}
              name="role"
              defaultValue={member.role}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <SettingsSubmitButton
              className="member-save-button"
              pendingLabel="Saving…"
            >
              <Save aria-hidden="true" size={15} />
              Save role
            </SettingsSubmitButton>
          </form>
          <form
            action={removeAction}
            onSubmit={(event) => {
              if (
                !window.confirm(`Remove ${member.displayName} from this room?`)
              ) {
                event.preventDefault();
              }
            }}
          >
            <SettingsSubmitButton
              className="member-remove-button"
              pendingLabel="Removing…"
            >
              <UserMinus aria-hidden="true" size={15} />
              Remove
            </SettingsSubmitButton>
          </form>
          <ActionMessage {...roleState} />
          <ActionMessage {...removeState} />
        </div>
      )}
    </li>
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
  const [deleteState, deleteAction] = useActionState(
    deleteRoomAction.bind(null, room.slug),
    INITIAL_ROOM_ACTION_STATE,
  );

  return (
    <main className="room-settings-shell">
      <header className="room-settings-header">
        <Link className="room-settings-back" href={`/rooms/${room.slug}`}>
          <ArrowLeft aria-hidden="true" size={17} />
          Back to room
        </Link>
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
      </header>

      <div className="room-settings-content">
        <div className="room-settings-title">
          <p className="eyebrow">Owner controls</p>
          <h1>{room.name}</h1>
          <p>
            Manage who can find this room and what collaborators can change.
          </p>
        </div>

        <section className="settings-card" aria-labelledby="room-details-title">
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow">Room details</p>
              <h2 id="room-details-title">Name and visibility</h2>
            </div>
            {room.isPublic ? (
              <Globe2 aria-hidden="true" size={21} />
            ) : (
              <LockKeyhole aria-hidden="true" size={21} />
            )}
          </div>
          <form action={settingsAction} className="settings-form">
            <label htmlFor="settings-room-name">Room name</label>
            <input
              id="settings-room-name"
              name="name"
              type="text"
              defaultValue={room.name}
              maxLength={120}
              required
            />
            <fieldset>
              <legend>Visibility</legend>
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  defaultChecked={!room.isPublic}
                />
                Private — only added members
              </label>
              <label>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  defaultChecked={room.isPublic}
                />
                Public — discoverable to signed-in users
              </label>
            </fieldset>
            <ActionMessage {...settingsState} />
            <SettingsSubmitButton
              className="settings-primary-button"
              pendingLabel="Saving settings…"
            >
              <Save aria-hidden="true" size={16} />
              Save settings
            </SettingsSubmitButton>
          </form>
        </section>

        <section
          className="settings-card"
          aria-labelledby="collaborators-title"
        >
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow">Membership</p>
              <h2 id="collaborators-title">Collaborators</h2>
            </div>
            <span className="settings-count">{room.members.length}</span>
          </div>

          <form action={memberAction} className="add-member-form">
            <div>
              <label htmlFor="member-email">BoardPrep account email</label>
              <input
                id="member-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="study.partner@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="member-role">Starting role</label>
              <select id="member-role" name="role" defaultValue="editor">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <SettingsSubmitButton
              className="settings-secondary-button"
              pendingLabel="Adding…"
            >
              <UserPlus aria-hidden="true" size={16} />
              Add collaborator
            </SettingsSubmitButton>
            <ActionMessage {...memberState} />
          </form>

          <ul className="room-member-list">
            {room.members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                roomSlug={room.slug}
              />
            ))}
          </ul>
        </section>

        <section
          className="settings-card settings-card--danger"
          aria-labelledby="delete-room-title"
        >
          <div className="settings-card-heading">
            <div>
              <p className="eyebrow">Danger zone</p>
              <h2 id="delete-room-title">Delete this room</h2>
            </div>
            <Trash2 aria-hidden="true" size={21} />
          </div>
          <p>
            This permanently removes the room, notes, versions, and memberships.
            Type <strong>{room.name}</strong> to confirm.
          </p>
          <form action={deleteAction} className="delete-room-form">
            <label htmlFor="delete-confirmation">Room name confirmation</label>
            <input
              id="delete-confirmation"
              name="confirmation"
              type="text"
              autoComplete="off"
              required
            />
            <ActionMessage {...deleteState} />
            <SettingsSubmitButton
              className="settings-danger-button"
              pendingLabel="Deleting room…"
            >
              <Trash2 aria-hidden="true" size={16} />
              Delete room permanently
            </SettingsSubmitButton>
          </form>
        </section>
      </div>
    </main>
  );
}

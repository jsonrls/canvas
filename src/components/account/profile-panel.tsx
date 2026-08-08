"use client";

import {
  BadgeCheck,
  Eye,
  LoaderCircle,
  Mail,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useActionState, useState } from "react";

import { INITIAL_PROFILE_ACTION_STATE } from "@/app/profile/action-state";
import { updateProfileAction } from "@/app/profile/actions";
import {
  normalizeProfileDisplayName,
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  ProfileDomainError,
} from "@/lib/profiles/model";

interface ProfilePanelProps {
  displayName: string;
  email: string | null;
}

export function ProfilePanel({
  displayName,
  email,
}: ProfilePanelProps): React.ReactElement {
  const [state, action, pending] = useActionState(
    updateProfileAction,
    INITIAL_PROFILE_ACTION_STATE,
  );
  const [draftName, setDraftName] = useState(displayName);
  const [fieldError, setFieldError] = useState("");
  const previewName = draftName.trim() || displayName;
  const initial = previewName.charAt(0).toUpperCase() || "Q";

  const validateDisplayName = (): boolean => {
    try {
      normalizeProfileDisplayName(draftName);
      setFieldError("");
      return true;
    } catch (error) {
      setFieldError(
        error instanceof ProfileDomainError
          ? error.message
          : "Enter a valid display name.",
      );
      return false;
    }
  };

  return (
    <>
      <section
        className="account-card account-profile-summary"
        aria-labelledby="profile-summary-title"
      >
        <div className="account-profile-summary__avatar" aria-hidden="true">
          {initial}
          <span>
            <BadgeCheck size={17} />
          </span>
        </div>
        <div className="account-profile-summary__copy">
          <p className="account-card__eyebrow">Profile preview</p>
          <h2 id="profile-summary-title">{previewName}</h2>
          <p>
            <Mail aria-hidden="true" size={14} />
            {email ?? "Email unavailable"}
          </p>
        </div>
        <span className="account-profile-summary__badge">
          <UsersRound aria-hidden="true" size={14} />
          Visible in shared rooms
        </span>
      </section>

      <section className="account-card" aria-labelledby="display-name-title">
        <div className="account-card__heading">
          <div>
            <p className="account-card__eyebrow">Public identity</p>
            <h2 id="display-name-title">Display name</h2>
          </div>
          <span className="account-card__icon account-card__icon--yellow">
            <UserRound aria-hidden="true" size={19} />
          </span>
        </div>

        <form
          action={action}
          className="account-form"
          onSubmit={(event) => {
            if (!validateDisplayName()) {
              event.preventDefault();
            }
          }}
        >
          <label htmlFor="profile-display-name">Name</label>
          <div className="account-input-wrap">
            <input
              aria-describedby={`profile-display-name-help${fieldError ? " profile-display-name-error" : ""}`}
              aria-invalid={fieldError ? true : undefined}
              autoComplete="name"
              id="profile-display-name"
              maxLength={PROFILE_DISPLAY_NAME_MAX_LENGTH}
              name="displayName"
              onBlur={validateDisplayName}
              onChange={(event) => {
                setDraftName(event.target.value);
                if (fieldError) setFieldError("");
              }}
              required
              type="text"
              value={draftName}
            />
            <span aria-hidden="true">
              {draftName.trim().length}/{PROFILE_DISPLAY_NAME_MAX_LENGTH}
            </span>
          </div>
          <p className="account-field-help" id="profile-display-name-help">
            This name appears beside your notes, cursors, questions, and room
            membership.
          </p>
          {fieldError ? (
            <p
              className="account-field-error"
              id="profile-display-name-error"
              role="alert"
            >
              {fieldError}
            </p>
          ) : null}

          {state.message ? (
            <p
              className={`account-message account-message--${state.status}`}
              role={state.status === "error" ? "alert" : "status"}
            >
              {state.status === "success" ? (
                <BadgeCheck aria-hidden="true" size={16} />
              ) : null}
              {state.message}
            </p>
          ) : null}

          <button
            className="account-primary-button"
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <LoaderCircle className="spin" aria-hidden="true" size={17} />
            ) : (
              <Save aria-hidden="true" size={17} />
            )}
            {pending ? "Saving profile…" : "Save profile"}
          </button>
        </form>
      </section>

      <aside className="account-note" aria-label="Profile privacy note">
        <span>
          <Eye aria-hidden="true" size={18} />
        </span>
        <div>
          <strong>What collaborators can see</strong>
          <p>
            People who share a room with you can see your display name. Your
            sign-in email stays private.
          </p>
        </div>
      </aside>
    </>
  );
}

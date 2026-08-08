import {
  ArrowRight,
  DoorOpen,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

interface SettingsPanelProps {
  displayName: string;
  email: string | null;
  userId: string;
}

export function SettingsPanel({
  displayName,
  email,
  userId,
}: SettingsPanelProps): React.ReactElement {
  const initial = displayName.trim().charAt(0).toUpperCase() || "Q";

  return (
    <>
      <section className="account-card" aria-labelledby="account-details-title">
        <div className="account-card__heading">
          <div>
            <p className="account-card__eyebrow">Account details</p>
            <h2 id="account-details-title">Identity</h2>
          </div>
          <span className="account-card__icon account-card__icon--yellow">
            <UserRound aria-hidden="true" size={19} />
          </span>
        </div>

        <div className="account-identity-row">
          <span className="account-identity-row__avatar" aria-hidden="true">
            {initial}
          </span>
          <div>
            <strong>{displayName}</strong>
            <span>
              <Mail aria-hidden="true" size={14} />
              {email ?? "Email unavailable"}
            </span>
          </div>
          <Link className="account-text-link" href="/profile">
            Edit profile
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>
        <p className="account-card__footnote">
          Your email is used to sign in and recover access. Email changes are
          not available yet.
        </p>
      </section>

      <div className="account-settings-grid">
        <section
          className="account-card account-action-card"
          aria-labelledby="security-title"
        >
          <span className="account-action-card__icon account-action-card__icon--purple">
            <ShieldCheck aria-hidden="true" size={21} />
          </span>
          <div>
            <p className="account-card__eyebrow">Security</p>
            <h2 id="security-title">Password access</h2>
            <p>
              Send a secure, time-limited link to your sign-in email to choose a
              fresh password.
            </p>
          </div>
          <Link className="account-secondary-button" href="/reset-password">
            <KeyRound aria-hidden="true" size={16} />
            Reset password
          </Link>
        </section>

        <section
          className="account-card account-action-card"
          aria-labelledby="workspace-title"
        >
          <span className="account-action-card__icon account-action-card__icon--coral">
            <DoorOpen aria-hidden="true" size={21} />
          </span>
          <div>
            <p className="account-card__eyebrow">Workspace</p>
            <h2 id="workspace-title">Your study rooms</h2>
            <p>
              Return to your directory to create, join, or reopen a shared study
              room.
            </p>
          </div>
          <Link className="account-secondary-button" href="/rooms">
            View rooms
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </section>
      </div>

      <section
        className="account-card account-session-card"
        aria-labelledby="session-title"
      >
        <div>
          <span className="account-session-card__icon">
            <LockKeyhole aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="account-card__eyebrow">Current session</p>
            <h2 id="session-title">Sign out on this device</h2>
            <p>
              Qollab clears locally stored offline notes before ending your
              session.
            </p>
          </div>
        </div>
        <SignOutButton label="Logout" userId={userId} variant="danger" />
      </section>
    </>
  );
}

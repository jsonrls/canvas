import { ArrowLeft, LockKeyhole, Settings, UserRound } from "lucide-react";
import Link from "next/link";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";

interface AccountShellProps {
  activePage: "profile" | "settings";
  children: React.ReactNode;
  displayName: string;
  email: string | null;
  intro: string;
  title: string;
}

export function AccountShell({
  activePage,
  children,
  displayName,
  email,
  intro,
  title,
}: AccountShellProps): React.ReactElement {
  const initial = displayName.trim().charAt(0).toUpperCase() || "Q";

  return (
    <main className="account-page">
      <a className="account-skip-link" href="#account-content">
        Skip to account content
      </a>

      <header className="account-header">
        <div className="account-header__inner">
          <Link
            className="account-brand"
            href="/rooms"
            aria-label="Qollab rooms"
          >
            <QollabBrandLogo />
            <span>Account</span>
          </Link>
          <Link className="account-back-link" href="/rooms">
            <ArrowLeft aria-hidden="true" size={16} />
            Back to rooms
          </Link>
        </div>
      </header>

      <div className="account-content">
        <header className="account-intro">
          <p className="account-eyebrow">Your Qollab</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>

        <div className="account-layout">
          <aside className="account-sidebar" aria-label="Account navigation">
            <div className="account-sidebar__identity">
              <span className="account-sidebar__avatar" aria-hidden="true">
                {initial}
              </span>
              <span className="account-sidebar__copy">
                <strong title={displayName}>{displayName}</strong>
                <small title={email ?? undefined}>
                  {email ?? "Signed-in account"}
                </small>
              </span>
            </div>

            <nav className="account-nav">
              <Link
                aria-current={activePage === "profile" ? "page" : undefined}
                className="account-nav__link"
                href="/profile"
              >
                <UserRound aria-hidden="true" size={18} />
                <span>
                  <strong>Profile</strong>
                  <small>Your public study name</small>
                </span>
              </Link>
              <Link
                aria-current={activePage === "settings" ? "page" : undefined}
                className="account-nav__link"
                href="/settings"
              >
                <Settings aria-hidden="true" size={18} />
                <span>
                  <strong>Settings</strong>
                  <small>Sign-in and security</small>
                </span>
              </Link>
            </nav>

            <div className="account-sidebar__privacy">
              <LockKeyhole aria-hidden="true" size={16} />
              <span>
                <strong>Private by default</strong>
                <small>Your email is only shown to you.</small>
              </span>
            </div>
          </aside>

          <div className="account-main" id="account-content" tabIndex={-1}>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

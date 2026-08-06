import {
  ArrowLeft,
  FileText,
  LockKeyhole,
  MessageCircleQuestion,
  Radio,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
}

export function AuthShell({
  children,
  eyebrow,
  intro,
  title,
}: AuthShellProps): React.ReactElement {
  return (
    <main className="auth-page">
      <section className="auth-frame">
        <div className="auth-panel">
          <header className="auth-panel__header">
            <Link className="auth-brand-link" href="/" aria-label="Qollab home">
              <QollabBrandLogo />
            </Link>
            <Link className="auth-home-link" href="/">
              <ArrowLeft aria-hidden="true" size={15} />
              Back home
            </Link>
          </header>

          <div className="auth-panel__content">
            <div className="auth-heading">
              <p className="auth-eyebrow">{eyebrow}</p>
              <h1>{title}</h1>
              <p>{intro}</p>
            </div>
            {children}
          </div>

          <p className="auth-security-note">
            <LockKeyhole aria-hidden="true" size={15} />
            Your room access and account details stay protected.
          </p>
        </div>

        <aside className="auth-showcase" aria-label="Qollab study room preview">
          <div className="auth-showcase__orb auth-showcase__orb--one" />
          <div className="auth-showcase__orb auth-showcase__orb--two" />
          <div className="auth-showcase__copy">
            <p className="auth-showcase__eyebrow">
              <Radio aria-hidden="true" size={14} />
              One room, one shared rhythm
            </p>
            <h2>Study alone less often.</h2>
            <p>
              Keep notes, questions, and visual thinking together while your
              group prepares for what comes next.
            </p>
          </div>

          <div className="auth-room-preview" aria-hidden="true">
            <div className="auth-room-preview__topbar">
              <div>
                <span className="auth-room-preview__label">Study room</span>
                <strong>Algorithms sprint</strong>
              </div>
              <span className="auth-live-badge">
                <span />4 live
              </span>
            </div>

            <div className="auth-room-preview__tools">
              <span className="is-active">
                <FileText size={13} />
                Shared notes
              </span>
              <span>
                <MessageCircleQuestion size={13} />
                Q&amp;A
              </span>
            </div>

            <div className="auth-room-preview__body">
              <div className="auth-preview-note">
                <span className="auth-preview-note__kicker">
                  Today&apos;s focus
                </span>
                <strong>Graph traversal</strong>
                <span className="auth-preview-line auth-preview-line--long" />
                <span className="auth-preview-line" />
                <div className="auth-preview-highlight">
                  Compare BFS and DFS complexity
                </div>
              </div>
              <div className="auth-preview-people">
                <div className="auth-preview-avatars">
                  <span>JM</span>
                  <span>AR</span>
                  <span>KC</span>
                  <span>+1</span>
                </div>
                <p>
                  <UsersRound size={13} />
                  Everyone sees the latest edit
                </p>
              </div>
            </div>
          </div>

          <p className="auth-showcase__footnote">
            Built for focused groups, not noisy feeds.
          </p>
        </aside>
      </section>
    </main>
  );
}

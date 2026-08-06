import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpenText,
  FileText,
  History,
  MessageCircleQuestion,
  MousePointer2,
  PenTool,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Wifi,
} from "lucide-react";
import Link from "next/link";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";

export const metadata: Metadata = {
  title: "Study together, without losing the thread",
  description:
    "Qollab brings shared notes, PDF annotation, whiteboards, and live Q&A into one focused study room.",
};

const WHY_ITEMS = [
  {
    description:
      "Notes, questions, and visual explanations stay attached to the room where they belong.",
    icon: BookOpenText,
    title: "One dependable workspace",
  },
  {
    description:
      "Every edit merges automatically, with presence and history that keep the group oriented.",
    icon: History,
    title: "A thread nobody loses",
  },
  {
    description:
      "Private rooms, explicit membership, and clear roles keep collaboration focused.",
    icon: ShieldCheck,
    title: "Built for trusted groups",
  },
] as const;

const HOW_STEPS = [
  {
    description:
      "Start a private room for your class, review team, or next exam block.",
    number: "01",
    title: "Create your room",
  },
  {
    description:
      "Bring in the people preparing beside you and set the right access.",
    number: "02",
    title: "Gather the group",
  },
  {
    description:
      "Write, annotate, sketch, and ask questions while every change stays in sync.",
    number: "03",
    title: "Work from one thread",
  },
] as const;

export default function HomePage(): React.ReactElement {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link
          className="landing-header__brand"
          href="/"
          aria-label="Qollab home"
        >
          <QollabBrandLogo />
        </Link>
        <nav className="landing-nav" aria-label="Primary navigation">
          <a href="#why">Why Qollab</a>
          <a href="#workspace">Workspace</a>
          <a href="#how">How it works</a>
        </nav>
        <div className="landing-header__actions">
          <Link className="landing-link-button" href="/login">
            Sign in
          </Link>
          <Link className="landing-primary-button" href="/rooms">
            Open Qollab
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">
              <Wifi aria-hidden="true" size={14} />
              Study rooms, in sync
            </p>
            <h1 id="landing-title">
              Keep the whole study group on the{" "}
              <span className="landing-hero__accent">same page.</span>
            </h1>
            <p className="landing-hero__intro">
              Qollab gives every study group one calm place to write, mark up,
              explain, and ask—without scattering the work across five apps.
            </p>
            <div className="landing-hero__actions">
              <Link className="landing-primary-button" href="/login">
                Start a study room
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <a className="landing-text-link" href="#workspace">
                Explore the workspace
              </a>
            </div>
            <ul className="landing-hero__capabilities" aria-label="Key tools">
              <li>Shared notes</li>
              <li>PDF annotation</li>
              <li>Whiteboard</li>
              <li>Live Q&amp;A</li>
            </ul>
          </div>

          <div
            className="landing-hero__visual"
            role="img"
            aria-label="Qollab study room with shared notes and live questions"
          >
            <div className="landing-workspace-card" aria-hidden="true">
              <div className="landing-workspace-card__topbar">
                <span className="landing-workspace-card__dots">
                  <i />
                  <i />
                  <i />
                </span>
                <strong>Neuroanatomy · Group 4</strong>
                <span className="landing-live-pill">
                  <i />
                  Live
                </span>
              </div>
              <div className="landing-workspace-card__body">
                <div className="landing-workspace-card__rail">
                  <span className="is-active">
                    <BookOpenText size={16} />
                    Notes
                  </span>
                  <span>
                    <FileText size={16} />
                    PDF
                  </span>
                  <span>
                    <PenTool size={16} />
                    Board
                  </span>
                </div>
                <div className="landing-workspace-card__paper">
                  <span className="landing-paper-kicker">Cranial nerves</span>
                  <strong>Brainstem review</strong>
                  <div className="landing-paper-line landing-paper-line--long" />
                  <div className="landing-paper-line" />
                  <div className="landing-paper-highlight">
                    Sensory pathways cross at different levels.
                  </div>
                  <div className="landing-paper-line landing-paper-line--short" />
                  <span className="landing-collaborator-cursor">
                    <MousePointer2 size={15} />
                    <b>Mika</b>
                  </span>
                </div>
                <div className="landing-workspace-card__qa">
                  <span className="landing-paper-kicker">Live Q&amp;A</span>
                  <strong>2 questions</strong>
                  <div className="landing-question">
                    <span>AR</span>
                    <p>Where does CN VII exit?</p>
                  </div>
                  <div className="landing-question landing-question--answered">
                    <span>JL</span>
                    <p>Added it to the notes.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-orbit-note landing-orbit-note--top">
              <UsersRound aria-hidden="true" size={17} />
              <span>
                <strong>4 studying</strong>
                changes merge live
              </span>
            </div>
            <div className="landing-orbit-note landing-orbit-note--bottom">
              <Sparkles aria-hidden="true" size={17} />
              <span>
                <strong>One shared thread</strong>
                from question to answer
              </span>
            </div>
          </div>
        </section>

        <section
          className="landing-section landing-why"
          id="why"
          aria-labelledby="why-title"
        >
          <div className="landing-section__heading">
            <p className="landing-eyebrow">Why Qollab</p>
            <h2 id="why-title">Studying together should create clarity.</h2>
            <p>
              The room holds the context, so your group can spend less time
              reconstructing the conversation and more time understanding it.
            </p>
          </div>
          <div className="landing-why__grid">
            {WHY_ITEMS.map(({ description, icon: Icon, title }, index) => (
              <article className="landing-value-card" key={title}>
                <div className="landing-value-card__number">0{index + 1}</div>
                <span className="landing-value-card__icon">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="landing-section landing-toolkit"
          id="workspace"
          aria-labelledby="workspace-title"
        >
          <div className="landing-section__heading landing-section__heading--split">
            <div>
              <p className="landing-eyebrow">The workspace toolkit</p>
              <h2 id="workspace-title">One room. Four ways to think.</h2>
            </div>
            <p>
              Move naturally between words, documents, diagrams, and questions
              without losing the people or the context.
            </p>
          </div>

          <div className="landing-toolkit__grid">
            <article className="landing-tool-card landing-tool-card--notes">
              <div className="landing-tool-card__heading">
                <span>
                  <BookOpenText aria-hidden="true" size={21} />
                </span>
                <p>Shared notes</p>
              </div>
              <h3>Write the explanation once. Improve it together.</h3>
              <div className="landing-notes-demo" aria-hidden="true">
                <span />
                <strong>Key mechanism</strong>
                <i />
                <i />
                <mark>High-yield distinction</mark>
                <i />
              </div>
            </article>

            <article className="landing-tool-card landing-tool-card--pdf">
              <div className="landing-tool-card__heading">
                <span>
                  <FileText aria-hidden="true" size={21} />
                </span>
                <p>PDF annotation</p>
              </div>
              <h3>Keep the source and the discussion side by side.</h3>
              <div className="landing-pdf-demo" aria-hidden="true">
                <div>
                  <i />
                  <mark />
                  <i />
                  <i />
                </div>
                <span>
                  <MessageCircleQuestion size={19} />
                  Why is this the exception?
                </span>
              </div>
            </article>

            <article className="landing-tool-card landing-tool-card--board">
              <div className="landing-tool-card__heading">
                <span>
                  <PenTool aria-hidden="true" size={21} />
                </span>
                <p>Whiteboard</p>
              </div>
              <h3>Sketch the relationships that words cannot hold.</h3>
              <div className="landing-board-demo" aria-hidden="true">
                <span>A</span>
                <i />
                <span>B</span>
                <i />
                <span>C</span>
              </div>
            </article>

            <article className="landing-tool-card landing-tool-card--qa">
              <div className="landing-tool-card__heading">
                <span>
                  <MessageCircleQuestion aria-hidden="true" size={21} />
                </span>
                <p>Live Q&amp;A</p>
              </div>
              <h3>Give every question a visible place to land.</h3>
              <blockquote>
                “Can someone connect this to the diagram?”
                <span>Asked just now · 3 people viewing</span>
              </blockquote>
            </article>
          </div>
        </section>

        <section
          className="landing-section landing-how"
          id="how"
          aria-labelledby="how-title"
        >
          <div className="landing-section__heading">
            <p className="landing-eyebrow">How it works</p>
            <h2 id="how-title">From empty room to shared understanding.</h2>
          </div>
          <ol className="landing-how__steps">
            {HOW_STEPS.map(({ description, number, title }) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="landing-how__cta">
            <div>
              <p className="landing-eyebrow">Your next session</p>
              <h3>Start with the room. Keep everything that follows.</h3>
            </div>
            <Link className="landing-primary-button" href="/login">
              Create your first room
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <Link href="/" aria-label="Qollab home">
            <QollabBrandLogo priority={false} />
          </Link>
          <p>One shared place for the work of learning together.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="#why">Why</a>
          <a href="#workspace">Workspace</a>
          <a href="#how">How it works</a>
          <Link href="/login">Sign in</Link>
        </nav>
        <p className="landing-footer__legal">
          © {new Date().getFullYear()} Qollab. Learn in the same room.
        </p>
      </footer>
    </div>
  );
}

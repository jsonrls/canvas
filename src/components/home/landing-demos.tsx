"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { HStack } from "@astryxdesign/core/HStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Switch } from "@astryxdesign/core/Switch";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Image from "next/image";
import { useEffect, useState } from "react";

import {
  NotesFragment,
  PdfFragment,
  QuizFragment,
  WhiteboardFragment,
} from "./landing-fragments";
import { attachRefraction, supportsRefraction } from "./liquid-glass";
import { Button, ButtonControl } from "@/components/ui/button";
import { CheckCircle2, Clock3, RefreshCw } from "@/components/ui/icons";

function trackSheen(element: HTMLElement): () => void {
  const move = (event: PointerEvent): void => {
    const box = element.getBoundingClientRect();
    element.style.setProperty(
      "--landing-glass-x",
      `${event.clientX - box.left}px`,
    );
    element.style.setProperty(
      "--landing-glass-y",
      `${event.clientY - box.top}px`,
    );
  };
  element.addEventListener("pointermove", move, { passive: true });
  return () => element.removeEventListener("pointermove", move);
}

/** Wires every `.landing-glass` panel to its refraction filter and sheen. */
function useLiquidGlass(): void {
  useEffect(() => {
    const panels = Array.from(
      document.querySelectorAll<HTMLElement>(".landing-glass"),
    );
    const cleanups = panels.map(trackSheen);

    if (supportsRefraction()) {
      const host = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      host.setAttribute("aria-hidden", "true");
      host.setAttribute("width", "0");
      host.setAttribute("height", "0");
      host.classList.add("absolute");
      document.body.append(host);
      panels.forEach((panel, index) => {
        cleanups.push(attachRefraction(panel, host, `landing-glass-${index}`));
      });
      cleanups.push(() => host.remove());
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
}

/** Section entrances and the drifting cursors. Reduced motion leaves all at rest. */
export function LandingMotion(): null {
  useLiquidGlass();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "shown";
        observer.unobserve(entry.target);
      }
    });

    // Only content still below the fold starts hidden, so nothing visible flashes.
    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.dataset.reveal = "hidden";
        observer.observe(element);
      });

    const drifts = Array.from(document.querySelectorAll("[data-drift]")).map(
      (element, index) =>
        element.animate(
          [
            { transform: "translate(0, 0)" },
            {
              transform: `translate(${index % 2 ? 28 : -36}px, ${index % 2 ? -14 : 18}px)`,
            },
          ],
          {
            duration: 2800 + index * 600,
            direction: "alternate",
            iterations: Infinity,
            easing: "ease-in-out",
          },
        ),
    );

    return () => {
      observer.disconnect();
      drifts.forEach((drift) => drift.cancel());
    };
  }, []);

  return null;
}

const OFFLINE_LINES = [
  "Furosemide: check potassium first.",
  "Hold digoxin if the pulse is under 60.",
  "Ask the group about ACE inhibitor cough.",
];

function offlineStatus(
  isOnline: boolean,
  pendingEdits: number,
  mergedEdits: number | null,
): string {
  if (!isOnline) {
    return pendingEdits === 0
      ? "Offline. Keep writing."
      : `Offline. ${pendingEdits} saved on this device.`;
  }
  if (mergedEdits === null) return "Connected and up to date.";
  if (mergedEdits === 0) return "Back online. Nothing to merge.";
  return `Back online. ${mergedEdits} merged into the note.`;
}

/** A small simulation of offline recovery; it does not touch real room data. */
export function OfflineDemo(): React.ReactElement {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingEdits, setPendingEdits] = useState(0);
  const [mergedEdits, setMergedEdits] = useState<number | null>(null);

  function changeConnection(next: boolean): void {
    setIsOnline(next);
    setMergedEdits(next ? pendingEdits : null);
    if (next) setPendingEdits(0);
  }

  const StatusIcon = isOnline ? CheckCircle2 : Clock3;

  return (
    <VStack data-ui="" gap={3} className="w-full rounded-2xl bg-surface p-5">
      <HStack gap={2} vAlign="center" aria-live="polite">
        <StatusIcon size={20} />
        <Text weight="semibold" className="text-base!">
          {offlineStatus(isOnline, pendingEdits, mergedEdits)}
        </Text>
      </HStack>
      <Switch
        label="Connection"
        value={isOnline}
        onChange={(next) => changeConnection(next)}
        labelSpacing="spread"
        labelPosition="start"
      />
      <VStack gap={1} className="min-h-24 rounded-xl bg-muted p-3">
        {OFFLINE_LINES.slice(0, pendingEdits).map((line) => (
          <Text key={line} as="p">
            {line}
          </Text>
        ))}
        {pendingEdits === 0 ? (
          <Text as="p" color="secondary">
            {isOnline
              ? "Turn the connection off, then write a line."
              : "Nothing written yet."}
          </Text>
        ) : null}
      </VStack>
      <Button
        label="Write a line"
        variant="secondary"
        isDisabled={isOnline || pendingEdits === OFFLINE_LINES.length}
        onClick={() => setPendingEdits((count) => count + 1)}
      />
    </VStack>
  );
}

const FLASHCARDS = [
  {
    prompt: "What two values multiply to give cardiac output?",
    answer: "Heart rate and stroke volume.",
  },
  {
    prompt: "What should you check before giving digoxin?",
    answer: "The apical pulse, counted for a full minute.",
  },
  {
    prompt: "Which electrolyte do loop diuretics tend to lower?",
    answer: "Potassium.",
  },
];

export function FlashcardDemo(): React.ReactElement {
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const card = FLASHCARDS[cardIndex];

  return (
    <VStack data-ui="" gap={3} className="w-full">
      <ButtonControl
        variant="custom"
        aria-pressed={isRevealed}
        onClick={() => setIsRevealed((revealed) => !revealed)}
        className="flex min-h-56 w-full cursor-pointer flex-col justify-between gap-6 rounded-2xl bg-surface p-6 text-left transition-colors hover:bg-muted"
      >
        <Text color="secondary">
          {isRevealed ? "Answer" : "Question"}, sample card {cardIndex + 1} of{" "}
          {FLASHCARDS.length}
        </Text>
        <Text weight="medium" className="landing-h3">
          {isRevealed ? card.answer : card.prompt}
        </Text>
        <Text color="secondary">
          {isRevealed
            ? "Select to see the question"
            : "Select to see the answer"}
        </Text>
      </ButtonControl>
      <Button
        label="Next card"
        variant="secondary"
        icon={<RefreshCw size={16} />}
        onClick={() => {
          setCardIndex((index) => (index + 1) % FLASHCARDS.length);
          setIsRevealed(false);
        }}
      />
    </VStack>
  );
}

const ROOM_TOOLS = [
  { value: "notes", label: "Notes", View: NotesFragment },
  { value: "pdf", label: "PDF", View: PdfFragment },
  { value: "whiteboard", label: "Whiteboard", View: WhiteboardFragment },
  { value: "pack", label: "Study pack", View: QuizFragment },
];

/** A sample room window; the glass dock really switches its tools. */
export function LiveRoom(): React.ReactElement {
  const [activeTool, setActiveTool] = useState(ROOM_TOOLS[0].value);
  const tool =
    ROOM_TOOLS.find(({ value }) => value === activeTool) ?? ROOM_TOOLS[0];

  return (
    <VStack
      gap={0}
      className="landing-float relative h-120 w-full max-w-md overflow-hidden rounded-3xl bg-surface md:h-110"
    >
      <HStack
        hAlign="between"
        vAlign="center"
        gap={3}
        className="border-b border-border px-5 py-3"
      >
        <Text weight="semibold" className="truncate">
          Pharmacology review
        </Text>
        <HStack gap={2} vAlign="center">
          <StatusDot variant="success" label="Live" isPulsing />
          <Text weight="medium">Live</Text>
          <HStack gap={0} className="hidden! -space-x-2 sm:flex!">
            <Avatar name="Ana Reyes" size="sm" tooltip={false} />
            <Avatar name="Marco Diaz" size="sm" tooltip={false} />
            <Avatar name="Lea Tan" size="sm" tooltip={false} />
          </HStack>
        </HStack>
      </HStack>
      <VStack className="min-w-0">
        <tool.View />
      </VStack>
      <HStack
        gap={1}
        className="landing-glass absolute bottom-4 left-1/2 -translate-x-1/2 p-1"
      >
        {ROOM_TOOLS.map(({ value, label }) => (
          <ButtonControl
            key={value}
            variant="custom"
            aria-pressed={value === activeTool}
            onClick={() => setActiveTool(value)}
            className={`min-h-11 cursor-pointer rounded-full px-2 whitespace-nowrap transition-colors sm:px-3 ${
              value === activeTool
                ? "bg-surface font-semibold text-primary!"
                : "text-surface! hover:bg-accent-bg"
            }`}
          >
            {label}
          </ButtonControl>
        ))}
      </HStack>
    </VStack>
  );
}

const SESSION_STEPS = [
  {
    title: "Create the room",
    detail: "Name it after the subject. Keep it private, or open it up.",
    figure: "1 room",
    caption: "Notes, a PDF and a whiteboard, side by side.",
  },
  {
    title: "Bring in your group",
    detail: "Add classmates by email and give each person a role.",
    figure: "3 roles",
    caption: "Owner, editor and viewer.",
  },
  {
    title: "Work it through",
    detail: "Notes, PDF and whiteboard, all changing as you watch.",
    figure: "4 tools",
    caption: "Notes, PDF, whiteboard and study packs.",
  },
  {
    title: "Review before the exam",
    detail: "Turn your notes into a study pack and save it for later.",
    figure: "5 parts",
    caption:
      "Summary, quiz, flashcards, recommendations and a misconception review.",
  },
];

/** The numbered steps; choosing one changes the figure on the glass panel. */
export function SessionSteps(): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = SESSION_STEPS[activeIndex];

  return (
    <HStack gap={4} className="flex-col items-stretch! lg:flex-row">
      <VStack
        role="group"
        aria-label="Session steps"
        gap={2}
        className="min-w-0 justify-center lg:w-1/2"
      >
        {SESSION_STEPS.map(({ title, detail }, index) => {
          const isActive = index === activeIndex;
          const ink = isActive ? "text-surface!" : "";

          return (
            <ButtonControl
              key={title}
              variant="custom"
              aria-pressed={isActive}
              onClick={() => setActiveIndex(index)}
              className={`flex w-full cursor-pointer items-center gap-4 rounded-3xl p-4 text-left transition-colors ${
                isActive ? "bg-inverted" : "hover:bg-muted"
              }`}
            >
              <Text
                weight="semibold"
                className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                  isActive ? "bg-surface" : "bg-accent-muted"
                }`}
              >
                0{index + 1}
              </Text>
              <VStack gap={0} className="min-w-0">
                <Text weight="semibold" className={`text-lg! ${ink}`}>
                  {title}
                </Text>
                <Text color="secondary" className={ink}>
                  {detail}
                </Text>
              </VStack>
            </ButtonControl>
          );
        })}
      </VStack>
      <VStack className="landing-photo relative min-h-96 min-w-0 overflow-hidden rounded-3xl lg:w-1/2">
        <Image
          src="/images/home-study-collaboration.png"
          alt="Two students smiling, holding notebooks and a laptop."
          fill
          sizes="(max-width: 1024px) 100vw, 560px"
          className="landing-crop-c object-cover brightness-105 contrast-105 mix-blend-multiply"
        />
        <VStack
          gap={1}
          aria-live="polite"
          className="landing-glass absolute right-4 bottom-4 left-4 rounded-3xl p-5 sm:right-auto sm:w-72"
        >
          <Text className="landing-title text-surface!">{active.figure}</Text>
          <Text className="text-surface!">{active.caption}</Text>
        </VStack>
      </VStack>
    </HStack>
  );
}

interface FaqListProps {
  questions: { question: string; answer: string }[];
}

/** Numbered questions; one answer is open at a time. */
export function FaqList({ questions }: FaqListProps): React.ReactElement {
  return (
    <CollapsibleGroup type="single" defaultValue="01">
      <VStack gap={2}>
        {questions.map(({ question, answer }, index) => {
          const number = `0${index + 1}`;

          return (
            <VStack key={question} className="rounded-2xl bg-muted px-5 py-3">
              <Collapsible
                value={number}
                trigger={
                  <HStack gap={4} vAlign="center">
                    <Text color="secondary">{number}</Text>
                    <Text weight="semibold" className="text-base!">
                      {question}
                    </Text>
                  </HStack>
                }
              >
                <Text as="p" color="secondary" className="landing-body pt-2">
                  {answer}
                </Text>
              </Collapsible>
            </VStack>
          );
        })}
      </VStack>
    </CollapsibleGroup>
  );
}

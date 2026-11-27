"use client";

import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useEffect, useRef, useState } from "react";

import {
  type SceneArtName,
  SceneArt,
  type TourChapter,
  TourArt,
} from "./landing-art";
import { attachRefraction, supportsRefraction } from "./liquid-glass";
import { ButtonControl } from "@/components/ui/button";

const ENTER =
  "transition duration-500 ease-out starting:translate-y-4 starting:opacity-0";

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

    const reveal: IntersectionObserverCallback = (entries, source) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).dataset.reveal = "shown";
        source.unobserve(entry.target);
      }
    };
    const observer = new IntersectionObserver(reveal);
    // Drawings that animate inside wait until most of them is on screen.
    const artObserver = new IntersectionObserver(reveal, { threshold: 0.6 });

    // Only content still below the fold starts hidden, so nothing visible flashes.
    document
      .querySelectorAll<HTMLElement>("[data-reveal]")
      .forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight) return;
        element.dataset.reveal = "hidden";
        ("art" in element.dataset ? artObserver : observer).observe(element);
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
      artObserver.disconnect();
      drifts.forEach((drift) => drift.cancel());
    };
  }, []);

  return null;
}

/** One grid box, in rem. Keep in step with --landing-grid-size in landing.css. */
const GRID_CELL_REM = 3.5;
/** How long the highlight stays after the pointer stops. */
const GRID_IDLE_MS = 1200;

/**
 * A box grid behind the whole hero, fading out towards the bottom. With a mouse, the lines near the pointer
 * light up and the box under it fills in and follows; both fade once the
 * pointer rests or leaves. Touch screens and reduced motion get the still grid.
 */
export function HeroGrid(): React.ReactElement {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    const hero = field?.parentElement;
    if (!field || !hero) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cell =
      parseFloat(getComputedStyle(document.documentElement).fontSize) *
      GRID_CELL_REM;
    let idleTimer = 0;

    const rest = (): void => field.removeAttribute("data-active");
    const follow = (event: PointerEvent): void => {
      const box = field.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      field.style.setProperty("--landing-grid-x", `${x}px`);
      field.style.setProperty("--landing-grid-y", `${y}px`);
      field.style.setProperty(
        "--landing-grid-cell-x",
        `${Math.floor(x / cell) * cell}px`,
      );
      field.style.setProperty(
        "--landing-grid-cell-y",
        `${Math.floor(y / cell) * cell}px`,
      );
      field.setAttribute("data-active", "");
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(rest, GRID_IDLE_MS);
    };

    hero.addEventListener("pointermove", follow, { passive: true });
    hero.addEventListener("pointerleave", rest);
    return () => {
      window.clearTimeout(idleTimer);
      hero.removeEventListener("pointermove", follow);
      hero.removeEventListener("pointerleave", rest);
    };
  }, []);

  // The negative top equals the floating header's height (see app/page.tsx),
  // so the grid also runs behind the nav bar.
  return (
    <VStack
      ref={fieldRef}
      aria-hidden="true"
      className="landing-grid pointer-events-none absolute inset-x-0 -top-16 bottom-0 overflow-hidden md:-top-17"
    >
      <VStack className="landing-grid-cell absolute top-0 left-0" />
      <VStack className="landing-grid-lines absolute inset-0" />
      <VStack className="landing-grid-glow absolute inset-0" />
    </VStack>
  );
}

const TOUR_CHAPTERS: { label: string; chapter: TourChapter }[] = [
  { label: "Notes", chapter: "notes" },
  { label: "PDF", chapter: "pdf" },
  { label: "Board", chapter: "board" },
  { label: "Live", chapter: "live" },
  { label: "Pack", chapter: "pack" },
];
const TOUR_STEP_MS = 5000;

/**
 * An illustrated tour of one room. It moves to the next chapter every few
 * seconds until the visitor picks one from the glass dock; reduced motion
 * leaves it on the chosen chapter.
 */
export function RoomTour(): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHeld, setIsHeld] = useState(false);

  useEffect(() => {
    if (isHeld) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(
      () => setActiveIndex((index) => (index + 1) % TOUR_CHAPTERS.length),
      TOUR_STEP_MS,
    );
    return () => window.clearInterval(timer);
  }, [isHeld]);

  const active = TOUR_CHAPTERS[activeIndex];

  return (
    <VStack gap={4} hAlign="center" className="w-full">
      <VStack className="landing-float w-full overflow-hidden rounded-2xl bg-surface md:rounded-3xl">
        <VStack key={active.chapter} className={ENTER}>
          <TourArt chapter={active.chapter} />
        </VStack>
      </VStack>
      <HStack
        role="group"
        aria-label="Tour chapters"
        gap={1}
        className="landing-glass max-w-full p-1"
      >
        {TOUR_CHAPTERS.map(({ label }, index) => (
          <ButtonControl
            key={label}
            variant="custom"
            aria-pressed={index === activeIndex}
            onClick={() => {
              setIsHeld(true);
              setActiveIndex(index);
            }}
            className={`min-h-11 cursor-pointer rounded-full px-2 whitespace-nowrap transition-colors sm:px-3 ${
              index === activeIndex
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
    art: "create" as SceneArtName,
    figure: "1 room",
    caption: "Notes, a PDF, a whiteboard and live activities.",
  },
  {
    title: "Bring in your group",
    detail: "Add people by email and give each person a role.",
    art: "group" as SceneArtName,
    figure: "3 roles",
    caption: "Owner, editor and viewer.",
  },
  {
    title: "Work it through",
    detail: "Write, read, draw and vote, all changing as you watch.",
    art: "work" as SceneArtName,
    figure: "5 tools",
    caption: "Notes, PDF, whiteboard, live activities and study packs.",
  },
  {
    title: "Review what you learned",
    detail: "Turn your notes into a study pack and save it for later.",
    art: "review" as SceneArtName,
    figure: "5 parts",
    caption:
      "Summary, quiz, flashcards, recommendations and a misconception review.",
  },
];

/** The numbered steps; choosing one changes the drawing and figure beside them. */
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
      <VStack
        gap={4}
        className="min-w-0 justify-center rounded-3xl bg-muted p-4 lg:w-1/2"
      >
        <VStack
          key={active.title}
          className={`overflow-hidden rounded-2xl ${ENTER}`}
        >
          <SceneArt name={active.art} />
        </VStack>
        <VStack gap={1} aria-live="polite" className="px-2 pb-2">
          <Text className="landing-title">{active.figure}</Text>
          <Text color="secondary">{active.caption}</Text>
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

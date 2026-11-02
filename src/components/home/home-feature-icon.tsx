"use client";

import { HStack } from "@astryxdesign/core/HStack";
import {
  BookOpen,
  BookOpenText,
  Bot,
  BotMessageSquare,
  FilePenLine,
  FileText,
  PencilLine,
  PenTool,
} from "lucide";
import { useEffect, useRef, useState } from "react";

import { AppIcon } from "@/components/ui/icons";

const ICON_PAIRS = {
  notes: [BookOpenText, BookOpen],
  pdf: [FileText, FilePenLine],
  whiteboard: [PenTool, PencilLine],
  assistant: [Bot, BotMessageSquare],
} as const;

export type HomeFeatureIconKind = keyof typeof ICON_PAIRS;

const RETURN_DELAY_MS = 400;
const CYCLE_DURATION_MS = 800;
const REPLAY_COOLDOWN_MS = 1000;

export function HomeFeatureIcon({
  kind,
}: {
  kind: HomeFeatureIconKind;
}): React.ReactElement {
  const containerRef = useRef<HTMLElement>(null);
  const [isAlternate, setIsAlternate] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [baseIcon, alternateIcon] = ICON_PAIRS[kind];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const region = container.closest<HTMLElement>("[data-home-icon-region]");
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new Set<number>();
    let isPlaying = false;
    let nextPlayAt = 0;

    const clearTimers = (): void => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };

    const schedule = (callback: () => void, delay: number): void => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };

    const play = (): void => {
      if (preference.matches || isPlaying || performance.now() < nextPlayAt) {
        return;
      }

      isPlaying = true;
      setIsAlternate(true);
      schedule(() => setIsAlternate(false), RETURN_DELAY_MS);
      schedule(() => {
        isPlaying = false;
        nextPlayAt = performance.now() + REPLAY_COOLDOWN_MS;
      }, CYCLE_DURATION_MS);
    };

    const handlePreferenceChange = (): void => {
      setReducedMotion(preference.matches);
      if (!preference.matches) return;

      clearTimers();
      isPlaying = false;
      setIsAlternate(false);
    };

    const handlePointerEnter = (event: PointerEvent): void => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        play();
      }
    };

    handlePreferenceChange();
    preference.addEventListener("change", handlePreferenceChange);
    region?.addEventListener("pointerenter", handlePointerEnter);

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          !entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35,
          )
        ) {
          return;
        }
        observer.disconnect();
        play();
      },
      { threshold: 0.35 },
    );
    observer.observe(container);

    return () => {
      clearTimers();
      observer.disconnect();
      preference.removeEventListener("change", handlePreferenceChange);
      region?.removeEventListener("pointerenter", handlePointerEnter);
    };
  }, [kind]);

  return (
    <HStack ref={containerRef} aria-hidden="true" className="size-6 shrink-0">
      <AppIcon
        iconData={isAlternate && !reducedMotion ? alternateIcon : baseIcon}
        className="text-accent"
        size={24}
        strokeWidth={2}
        reducedMotion={reducedMotion ? "always" : "user"}
      />
    </HStack>
  );
}

"use client";

import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useEffect } from "react";

import {
  Countdown,
  LiveKindToken,
  Swatch,
} from "@/components/collaboration/live/live-charts";
import { QaSpotlight } from "@/components/collaboration/live/live-qa";
import {
  LiveLeaderboard,
  LiveResults,
} from "@/components/collaboration/live/live-results";
import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { IconButton } from "@/components/ui/button";
import { X } from "@/components/ui/icons";
import { projectorView, type LiveSnapshot } from "@/lib/live/activities";

function exitFullscreen(): void {
  if (document.fullscreenElement) {
    void document.exitFullscreen().catch(() => undefined);
  }
}

/** Fills the display where the browser allows it; the dialog works without. */
export function enterFullscreen(): void {
  void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function Waiting({ snapshot }: { snapshot: LiveSnapshot }): React.ReactElement {
  const { current, responseCount, session } = snapshot;
  return (
    <VStack gap={6} hAlign="center" className="w-full">
      {current?.kind === "poll" || current?.kind === "quiz" ? (
        <VStack as="ol" gap={4} aria-label="Options" className="max-w-3xl">
          {current.options.map((option, index) => (
            <HStack as="li" gap={4} vAlign="center" key={`${index}-${option}`}>
              <Swatch index={index} />
              <Text size="2xl" className="min-w-0 break-words">
                {option}
              </Text>
            </HStack>
          ))}
        </VStack>
      ) : null}
      <Text size="4xl" weight="bold" aria-live="polite">
        {responseCount}
      </Text>
      <Text size="lg" color="secondary">
        {responseCount === 1 ? "response" : "responses"}
        {session.isAccepting ? " so far" : ""}
      </Text>
    </VStack>
  );
}

export function LiveProjector({
  act,
  controls,
  imageUrl,
  isHidden,
  isOpen,
  onClose,
  secondsLeft,
  snapshot,
  status,
}: {
  act: LiveActivitiesState["act"];
  controls: React.ReactNode;
  imageUrl: string;
  /** The host hid live results from the screen. */
  isHidden: boolean;
  isOpen: boolean;
  onClose(): void;
  secondsLeft: number | null;
  snapshot: LiveSnapshot;
  status: React.ReactNode;
}): React.ReactElement {
  const view = projectorView(snapshot, isHidden);
  const { current } = view;

  // Escape leaves browser full screen without reaching the dialog.
  useEffect(() => {
    if (!isOpen) return;
    let wasFullscreen = Boolean(document.fullscreenElement);
    const onChange = (): void => {
      if (wasFullscreen && !document.fullscreenElement) onClose();
      wasFullscreen = Boolean(document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [isOpen, onClose]);

  const close = (): void => {
    onClose();
    exitFullscreen();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      aria-label="Full-screen question"
      variant="fullscreen"
    >
      {current ? (
        <VStack className="h-full min-h-0" gap={0}>
          <HStack
            gap={4}
            hAlign="between"
            vAlign="start"
            className="p-4 md:px-10 md:pt-8"
          >
            <VStack gap={3} className="min-w-0">
              <HStack>
                <LiveKindToken kind={current.kind} />
              </HStack>
              <Heading
                // On a button, the tooltip would swallow the first Escape.
                data-autofocus
                tabIndex={-1}
                level={1}
                className="text-3xl! break-words outline-none md:text-5xl!"
              >
                {current.prompt}
              </Heading>
            </VStack>
            <HStack gap={4} vAlign="center" className="shrink-0">
              {secondsLeft !== null && current.timeLimitSeconds ? (
                <Countdown
                  seconds={secondsLeft}
                  total={current.timeLimitSeconds}
                />
              ) : null}
              <IconButton
                label="Exit full screen"
                tooltip="Exit full screen"
                icon={<X aria-hidden="true" size={20} />}
                onClick={close}
              />
            </HStack>
          </HStack>
          <VStack
            gap={8}
            className="min-h-0 flex-1 justify-center-safe! overflow-y-auto p-4 md:px-10"
          >
            {current.kind === "qa" ? (
              <QaSpotlight act={act} items={view.qa ?? []} />
            ) : view.results &&
              (view.results.total > 0 || view.results.type === "pin") ? (
              <LiveResults
                imageUrl={imageUrl}
                question={current}
                results={view.results}
              />
            ) : (
              <Waiting snapshot={view} />
            )}
            {view.leaderboard ? (
              <LiveLeaderboard leaderboard={view.leaderboard} />
            ) : null}
          </VStack>
          <HStack
            gap={4}
            hAlign="between"
            vAlign="center"
            wrap="wrap"
            className="border-t border-border p-4 md:px-10"
          >
            {status}
            {controls}
          </HStack>
        </VStack>
      ) : null}
    </Dialog>
  );
}

"use client";

import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { useState } from "react";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { StudentStage } from "@/components/collaboration/live/live-activities-tool";
import { useLiveActivities } from "@/components/collaboration/live/use-live-activities";
import { Button } from "@/components/ui/button";
import { ChartColumnBig } from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";

const NAME_MAX = 40;

function guestEndpoint(code: string): string {
  return `/live/${encodeURIComponent(code)}/api`;
}

function JoinForm({
  code,
  onJoined,
}: {
  code: string;
  onJoined(name: string): void;
}): React.ReactElement {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const join = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsJoining(true);
    try {
      const response = await fetch(guestEndpoint(code), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", name }),
      });
      if (response.ok) {
        onJoined(name.trim());
        return;
      }
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(body.error ?? "You could not join. Try again.");
    } catch {
      setError("You could not join. Check your connection.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <VStack as="form" gap={4} aria-label="Join as a guest" onSubmit={join}>
      <TextInput
        label="Your name"
        description="Shown on the quiz leaderboard. No account needed."
        value={name}
        onChange={(value) => setName(value.slice(0, NAME_MAX))}
        htmlName="nickname"
        isRequired
      />
      {error ? (
        <Text role="alert" className="text-error">
          {error}
        </Text>
      ) : null}
      <Button
        type="submit"
        label="Join"
        variant="primary"
        width="100%"
        isLoading={isJoining}
        isDisabled={!name.trim()}
      />
    </VStack>
  );
}

function GuestStage({ code }: { code: string }): React.ReactElement {
  const endpoint = guestEndpoint(code);
  const { act, error, isMutating, snapshot } = useLiveActivities({
    endpoint,
    isActive: true,
  });

  if (!snapshot) {
    return error ? (
      <EmptyState
        title="Live activity unavailable"
        description={error}
        icon={<ChartColumnBig />}
      />
    ) : (
      <LoadingIndicator label="Joining…" size="panel" />
    );
  }
  return (
    <VStack gap={4}>
      {error ? (
        <Text role="alert" weight="medium" className="text-error">
          {error}
        </Text>
      ) : null}
      <StudentStage
        imageUrl={`${endpoint}/image?questionId=${snapshot.current?.id ?? ""}`}
        isBusy={isMutating}
        onAct={act}
        snapshot={snapshot}
      />
    </VStack>
  );
}

/** The public page behind a host's guest link or QR code. */
export function LiveGuest({
  link,
}: {
  link: { code: string; roomName: string; guestName: string | null } | null;
}): React.ReactElement {
  const [guestName, setGuestName] = useState(link?.guestName ?? null);

  return (
    <VStack minHeight="100dvh" className="bg-surface px-4">
      <HStack
        as="header"
        hAlign="between"
        vAlign="center"
        gap={3}
        paddingBlock={3}
        className="mx-auto w-full max-w-2xl"
      >
        <QollabBrandLogo />
        {guestName ? (
          <Text type="supporting" className="truncate">
            Answering as {guestName}
          </Text>
        ) : null}
      </HStack>
      <VStack as="main" gap={6} className="mx-auto w-full max-w-2xl py-6">
        {!link ? (
          <EmptyState
            title="This live link is no longer active"
            description="Ask the host for a new link or QR code."
            icon={<ChartColumnBig />}
          />
        ) : (
          <>
            <VStack gap={1}>
              <Text type="supporting">Live activity</Text>
              <Heading level={1} className="break-words">
                {link.roomName}
              </Heading>
            </VStack>
            {guestName ? (
              <GuestStage code={link.code} />
            ) : (
              <JoinForm code={link.code} onJoined={setGuestName} />
            )}
          </>
        )}
      </VStack>
    </VStack>
  );
}

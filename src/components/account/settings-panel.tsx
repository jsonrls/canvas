"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@/components/ui/button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Link from "next/link";
import { useState } from "react";

import { PasswordResetDialog } from "@/components/account/password-reset-dialog";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ArrowRight } from "@/components/ui/icons";
import {
  PANEL_ACCENT,
  PANEL_HEADING,
  PANEL_MUTED,
  PANEL_ROW,
} from "@/components/ui/panel";

interface SettingsPanelProps {
  displayName: string;
  email: string | null;
  userId: string;
}

const RESET_HREF = "/reset-password";

const accountActions = [
  {
    title: "Public profile",
    description: "Your display name appears in shared study rooms.",
    label: "Edit public profile",
    href: "/profile",
  },
  {
    title: "Password & recovery",
    description: "Get an email link to choose a new password.",
    label: "Reset password",
    // The page asks for an email; with one at hand, a dialog does instead.
    href: RESET_HREF,
  },
  {
    title: "Study rooms",
    description:
      "Create a room, join your study partners, or reopen recent work.",
    label: "View rooms",
    href: "/rooms",
  },
];

export function SettingsPanel({
  displayName,
  email,
  userId,
}: SettingsPanelProps): React.ReactElement {
  const [isResetting, setIsResetting] = useState(false);

  return (
    <>
      <VStack
        as="section"
        gap={4}
        className={PANEL_MUTED}
        aria-labelledby="settings-identity-title"
      >
        <Heading
          level={2}
          id="settings-identity-title"
          className={PANEL_HEADING}
        >
          Signed in as
        </Heading>
        <HStack gap={4} vAlign="center" className={PANEL_ROW}>
          <Avatar
            name={displayName.trim() || "Q"}
            size="lg"
            tooltip={false}
            aria-hidden="true"
          />
          <VStack gap={1} className="min-w-0 flex-1">
            <Text weight="semibold" className="wrap-anywhere text-lg!">
              {displayName}
            </Text>
            <Text color="secondary" className="wrap-anywhere">
              {email ?? "Email unavailable"}
            </Text>
          </VStack>
        </HStack>
      </VStack>

      <VStack
        as="section"
        gap={4}
        className={PANEL_MUTED}
        aria-labelledby="settings-account-title"
      >
        <Heading
          level={2}
          id="settings-account-title"
          className={PANEL_HEADING}
        >
          Account
        </Heading>
        <VStack as="ul" gap={2} aria-labelledby="settings-account-title">
          {accountActions.map((action) => (
            <HStack
              as="li"
              key={action.href}
              gap={4}
              vAlign="start"
              className={`${PANEL_ROW} flex-col sm:flex-row sm:items-center`}
            >
              <VStack gap={1} className="min-w-0 flex-1">
                <Text weight="semibold">{action.title}</Text>
                <Text color="secondary">{action.description}</Text>
              </VStack>
              {action.href === RESET_HREF && email ? (
                <Button
                  label={action.label}
                  variant="secondary"
                  aria-haspopup="dialog"
                  className="shrink-0 px-4"
                  onClick={() => setIsResetting(true)}
                />
              ) : (
                <Button
                  as={Link}
                  href={action.href}
                  label={action.label}
                  variant="secondary"
                  endContent={<ArrowRight aria-hidden="true" size={16} />}
                  className="shrink-0 px-4"
                />
              )}
            </HStack>
          ))}
        </VStack>
      </VStack>

      <VStack
        as="section"
        gap={2}
        className={PANEL_ACCENT}
        aria-labelledby="settings-privacy-title"
      >
        <Heading
          level={2}
          id="settings-privacy-title"
          className={PANEL_HEADING}
        >
          Privacy
        </Heading>
        <Text color="secondary">
          Your account email never appears to collaborators in shared study
          rooms.
        </Text>
      </VStack>

      <VStack
        as="section"
        gap={4}
        hAlign="start"
        className={PANEL_MUTED}
        aria-labelledby="settings-session-title"
      >
        <VStack gap={2}>
          <Heading
            level={2}
            id="settings-session-title"
            className={PANEL_HEADING}
          >
            Sign out
          </Heading>
          <Text color="secondary">
            Qollab clears locally stored offline notes before ending your
            session.
          </Text>
        </VStack>
        <SignOutButton label="Sign out" userId={userId} variant="danger" />
      </VStack>

      {email ? (
        <PasswordResetDialog
          email={email}
          isOpen={isResetting}
          onClose={() => setIsResetting(false)}
        />
      ) : null}
    </>
  );
}

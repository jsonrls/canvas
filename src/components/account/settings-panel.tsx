"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Button } from "@/components/ui/button";
import { Divider } from "@astryxdesign/core/Divider";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { List, ListItem } from "@astryxdesign/core/List";
import { Section } from "@astryxdesign/core/Section";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";

interface SettingsPanelProps {
  displayName: string;
  email: string | null;
  userId: string;
}

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
    href: "/reset-password",
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
  return (
    <VStack gap={0}>
      <Section
        padding={0}
        paddingBlockEnd={6}
        aria-labelledby="settings-identity-title"
      >
        <VStack gap={4}>
          <Heading level={2} id="settings-identity-title">
            Signed in as
          </Heading>
          <HStack
            gap={6}
            vAlign="center"
            wrap="wrap"
            className="flex-col sm:flex-row items-start! sm:items-center!"
          >
            <Avatar
              name={displayName.trim() || "Q"}
              size="xl"
              tooltip={false}
              aria-hidden="true"
            />
            <VStack gap={1} className="min-w-0 flex-1">
              <Text weight="semibold" className="wrap-anywhere text-2xl!">
                {displayName}
              </Text>
              <Text color="secondary" className="wrap-anywhere">
                {email ?? "Email unavailable"}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Section>
      <Divider />
      <Section
        padding={6}
        paddingInline={0}
        aria-labelledby="settings-account-title"
      >
        <List
          density="spacious"
          hasDividers
          header={
            <Heading level={2} id="settings-account-title">
              Account
            </Heading>
          }
        >
          {accountActions.map((action) => (
            <ListItem
              key={action.href}
              label={<Text weight="semibold">{action.title}</Text>}
              description={
                <HStack gap={3} vAlign="start" className="flex-col md:flex-row">
                  <Text color="secondary" className="min-w-0 flex-1">
                    {action.description}
                  </Text>
                  <Button
                    as={Link}
                    href={action.href}
                    label={action.label}
                    variant="link"
                    className="min-h-11 shrink-0 self-start text-accent hover:bg-none!"
                  />
                </HStack>
              }
            />
          ))}
        </List>
      </Section>
      <Divider />
      <Section
        padding={6}
        paddingInline={0}
        aria-labelledby="settings-privacy-title"
      >
        <VStack gap={4}>
          <Heading level={2} id="settings-privacy-title">
            Privacy
          </Heading>
          <Text color="secondary">
            Your account email never appears to collaborators in shared study
            rooms.
          </Text>
        </VStack>
      </Section>
      <Divider />
      <Section
        padding={6}
        paddingInline={0}
        paddingBlockEnd={0}
        aria-labelledby="settings-session-title"
      >
        <VStack gap={4} hAlign="start">
          <Heading level={2} id="settings-session-title">
            Sign out
          </Heading>
          <Text color="secondary">
            Qollab clears locally stored offline notes before ending your
            session.
          </Text>
          <SignOutButton label="Sign out" userId={userId} variant="danger" />
        </VStack>
      </Section>
    </VStack>
  );
}

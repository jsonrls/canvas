"use client";

import { AppShell } from "@astryxdesign/core/AppShell";
import { Button } from "@/components/ui/button";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Link from "next/link";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { ArrowLeft } from "@/components/ui/icons";

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
  intro,
  title,
}: AccountShellProps): React.ReactElement {
  return (
    <AppShell
      className="bg-surface"
      variant="section"
      height="auto"
      contentPadding={0}
      mobileNav={false}
      topNav={
        <VStack className="bg-surface" gap={0}>
          <HStack
            className="border-b border-border"
            hAlign="center"
            paddingInline={4}
          >
            <HStack
              width="100%"
              maxWidth={1120}
              className="min-h-14"
              hAlign="between"
              vAlign="center"
              wrap="wrap"
              gap={2}
              paddingBlock={1}
            >
              <Link
                href="/rooms"
                aria-label="Qollab rooms"
                className="inline-flex min-h-11 min-w-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <QollabBrandLogo />
              </Link>
              <Button
                as={Link}
                href="/rooms"
                label="Back to rooms"
                variant="ghost"
                icon={<ArrowLeft aria-hidden="true" size={16} />}
              />
            </HStack>
          </HStack>
          <VStack paddingInline={4} className="pt-6 md:pt-8" hAlign="center">
            <HStack
              as="nav"
              aria-label="Account"
              width="100%"
              maxWidth={640}
              gap={2}
            >
              {(["profile", "settings"] as const).map((page) => (
                <Button
                  key={page}
                  as={Link}
                  href={`/${page}`}
                  label={page === "profile" ? "Profile" : "Settings"}
                  variant="ghost"
                  aria-current={activePage === page ? "page" : undefined}
                  className="min-h-11"
                />
              ))}
            </HStack>
          </VStack>
        </VStack>
      }
    >
      <VStack className="px-4">
        <Layout height="auto" contentWidth={640} padding={0}>
          <LayoutContent isScrollable={false} padding={0}>
            <VStack
              id="account-content"
              tabIndex={-1}
              className="min-w-0 pt-6 pb-8"
              gap={6}
            >
              <VStack gap={2}>
                <Heading level={1} type="display-2">
                  {title}
                </Heading>
                <Text color="secondary">{intro}</Text>
              </VStack>
              <VStack gap={6} className="min-w-0">
                {children}
              </VStack>
            </VStack>
          </LayoutContent>
        </Layout>
      </VStack>
    </AppShell>
  );
}

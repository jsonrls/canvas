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
import { ArrowLeft, Settings, UserRound } from "@/components/ui/icons";

interface AccountShellProps {
  activePage: "profile" | "settings";
  children: React.ReactNode;
  displayName: string;
  email: string | null;
  intro: string;
  title: string;
}

const accountPages = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

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
        <HStack
          className="border-b border-border bg-surface"
          hAlign="center"
          paddingInline={4}
        >
          <HStack
            width="100%"
            maxWidth={1120}
            className="min-h-14"
            vAlign="center"
            paddingBlock={1}
          >
            <Link
              href="/rooms"
              aria-label="Qollab rooms"
              className="inline-flex min-h-11 min-w-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <QollabBrandLogo />
            </Link>
          </HStack>
        </HStack>
      }
    >
      <HStack hAlign="center" paddingInline={4}>
        {/* Same 1120px frame as the header, so the sidebar starts under the logo. */}
        <HStack
          width="100%"
          maxWidth={1120}
          gap={8}
          vAlign="start"
          className="flex-col pt-6 pb-8 md:flex-row md:pt-10"
        >
          <VStack
            as="nav"
            aria-label="Account"
            gap={4}
            className="w-full shrink-0 md:w-56"
          >
            <Button
              as={Link}
              href="/rooms"
              label="Back to rooms"
              variant="ghost"
              icon={<ArrowLeft aria-hidden="true" size={16} />}
              className="self-start"
            />
            {/* A tab track on phones, a plain list beside the page from md. */}
            <HStack
              gap={1}
              className="self-start rounded-2xl bg-muted p-1 md:w-full md:flex-col md:items-stretch md:rounded-none md:bg-transparent md:p-0"
            >
              {accountPages.map((page) => (
                <Button
                  key={page.id}
                  as={Link}
                  href={`/${page.id}`}
                  label={page.label}
                  variant="ghost"
                  icon={<page.icon aria-hidden="true" size={16} />}
                  className="md:justify-start!"
                  aria-current={activePage === page.id ? "page" : undefined}
                />
              ))}
            </HStack>
          </VStack>
          <VStack className="w-full min-w-0 md:max-w-160">
            <Layout height="auto" contentWidth={640} padding={0}>
              <LayoutContent isScrollable={false} padding={0}>
                <VStack
                  id="account-content"
                  tabIndex={-1}
                  className="min-w-0"
                  gap={6}
                >
                  <VStack gap={2}>
                    <Heading level={1} className="text-2xl! md:text-3xl!">
                      {title}
                    </Heading>
                    <Text color="secondary">{intro}</Text>
                  </VStack>
                  <VStack gap={4} className="min-w-0">
                    {children}
                  </VStack>
                </VStack>
              </LayoutContent>
            </Layout>
          </VStack>
        </HStack>
      </HStack>
    </AppShell>
  );
}

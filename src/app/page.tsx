import type { Metadata } from "next";
import Link from "next/link";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import {
  LandingClosing,
  LandingFaq,
  LandingHero,
  LandingPacks,
  LandingRoles,
  LandingSession,
  LandingTools,
  LandingWhy,
} from "@/components/home/landing-content";
import { LandingMotion } from "@/components/home/landing-demos";
import { FRAME, PillLink } from "@/components/home/landing-section";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "A shared room for the work of learning",
  description:
    "Write shared notes, annotate PDFs, and sketch ideas with your study group. Keep the work together in Qollab.",
};

const NAVIGATION = [
  { href: "#workspace", label: "Study tools" },
  { href: "#how", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

export default async function HomePage(): Promise<React.ReactElement> {
  const isAuthenticated = (await getAuthenticatedContext()) !== null;
  const destination = isAuthenticated ? "/rooms" : "/login";
  const action = isAuthenticated
    ? "Return to your rooms"
    : "Start a study room";

  return (
    <VStack gap={0} className="landing-root relative min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-surface focus:p-4 focus:outline-accent"
      >
        Skip to content
      </a>
      <VStack
        as="header"
        hAlign="center"
        className="sticky top-0 z-40 bg-surface px-4 md:px-8"
      >
        <HStack
          width="100%"
          maxWidth={FRAME}
          hAlign="between"
          vAlign="center"
          gap={4}
          paddingBlock={3}
        >
          <Link
            href="/"
            aria-label="Qollab home"
            className="inline-flex min-h-11 items-center"
          >
            <QollabBrandLogo />
          </Link>
          <HStack
            as="nav"
            aria-label="Primary navigation"
            gap={8}
            className="hidden! lg:flex!"
          >
            {NAVIGATION.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center font-medium text-secondary hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </HStack>
          <HStack gap={2} vAlign="center">
            {isAuthenticated ? null : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center px-3 font-medium text-primary hover:text-accent"
              >
                Log in
              </Link>
            )}
            <PillLink
              href={isAuthenticated ? "/rooms" : "/signup"}
              label={isAuthenticated ? "Your rooms" : "Get started"}
            />
          </HStack>
        </HStack>
      </VStack>
      <VStack as="main" id="main-content" tabIndex={-1} gap={0}>
        <LandingHero destination={destination} action={action} />
        <LandingWhy />
        <LandingTools />
        <LandingSession />
        <LandingPacks />
        <LandingRoles />
        <LandingFaq destination={destination} action={action} />
        <LandingClosing destination={destination} action={action} />
      </VStack>
      <VStack as="footer" hAlign="center" className="px-4 py-6 md:px-8">
        <HStack
          width="100%"
          maxWidth={FRAME}
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          gap={4}
        >
          <QollabBrandLogo />
          <HStack as="nav" aria-label="Footer navigation" gap={6} wrap="wrap">
            {NAVIGATION.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center text-secondary hover:text-accent"
              >
                {label}
              </Link>
            ))}
            <Link
              href={isAuthenticated ? "/profile" : "/signup"}
              className="inline-flex min-h-11 items-center text-accent"
            >
              {isAuthenticated ? "Your profile" : "Create an account"}
            </Link>
          </HStack>
          <Text color="secondary">© {new Date().getFullYear()} Qollab</Text>
        </HStack>
      </VStack>
      <LandingMotion />
    </VStack>
  );
}

import Link from "next/link";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { AuthMood } from "@/components/auth/auth-mood";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { AuthArt, type AuthArtName } from "@/components/home/landing-art";
import { HeroGrid } from "@/components/home/landing-demos";
import { FRAME, PillLink } from "@/components/home/landing-section";

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
  /** The drawing beside the form, and the line under it. */
  art: AuthArtName;
  caption: string;
}

/**
 * Sign-in, sign-up and password pages: the landing page's grid ground and
 * floating bar, then one floating card holding the form beside a drawing.
 * The drawing is a sample scene, not live data, and hides below `lg`.
 */
export function AuthShell({
  children,
  eyebrow,
  intro,
  title,
  art,
  caption,
}: AuthShellProps): React.ReactElement {
  return (
    <VStack
      minHeight="100dvh"
      className="landing-root relative bg-surface px-3 md:px-8"
    >
      <HeroGrid />
      <VStack as="header" hAlign="center" className="relative pt-3 md:pt-4">
        <HStack
          width="100%"
          maxWidth={FRAME}
          hAlign="between"
          vAlign="center"
          gap={2}
          paddingBlock={1}
          className="landing-float rounded-full bg-surface/85 pr-2 pl-3 backdrop-blur-md md:pl-6"
        >
          <Link
            href="/"
            aria-label="Qollab home"
            className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <QollabBrandLogo size="sm" />
          </Link>
          <PillLink href="/" label="Back to home" tone="outline" />
        </HStack>
      </VStack>
      <VStack
        as="main"
        width="100%"
        maxWidth={FRAME}
        className="relative mx-auto flex-1 justify-center py-6 md:py-10"
      >
        {/* `data-mood` is kept up to date by AuthMood; the drawing reads it. */}
        <HStack
          data-mood="idle"
          gap={3}
          className="landing-float items-stretch! rounded-3xl bg-surface p-3"
        >
          <AuthMood />
          <VStack
            as="section"
            hAlign="center"
            className="min-w-0 flex-1 justify-center px-3 py-8 md:px-8 md:py-12"
          >
            <VStack width="100%" maxWidth={400} gap={8}>
              <VStack gap={4} hAlign="center" className="text-center">
                <Text
                  weight="medium"
                  className="rounded-full bg-accent-muted px-3 py-1 text-accent!"
                >
                  {eyebrow}
                </Text>
                <VStack gap={3} hAlign="center">
                  <Heading
                    level={1}
                    textWrap="balance"
                    className="landing-title font-bold"
                  >
                    {title}
                  </Heading>
                  <Text
                    as="p"
                    color="secondary"
                    className="landing-body max-w-xs"
                  >
                    {intro}
                  </Text>
                </VStack>
              </VStack>
              <VStack gap={4}>{children}</VStack>
            </VStack>
          </VStack>
          <VStack
            as="aside"
            aria-label="Learning together with Qollab"
            gap={4}
            hAlign="center"
            className="hidden! min-w-0 flex-1 justify-center overflow-hidden rounded-2xl bg-accent-muted p-8 lg:flex!"
          >
            <AuthArt name={art} />
            <Text as="p" className="landing-subtitle max-w-sm text-center">
              {caption}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
}

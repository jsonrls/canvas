import Image from "next/image";
import Link from "next/link";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { FRAME, PillLink } from "@/components/home/landing-section";
import { LockKeyhole } from "@/components/ui/icons";

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
}

/** Sign-in, sign-up and password pages share the landing page's look. */
export function AuthShell({
  children,
  eyebrow,
  intro,
  title,
}: AuthShellProps): React.ReactElement {
  return (
    <VStack minHeight="100dvh" className="landing-root bg-surface px-4 md:px-8">
      <HStack
        as="header"
        width="100%"
        maxWidth={FRAME}
        hAlign="between"
        vAlign="center"
        gap={4}
        paddingBlock={3}
        className="mx-auto"
      >
        <Link
          href="/"
          aria-label="Qollab home"
          className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <QollabBrandLogo />
        </Link>
        <PillLink href="/" label="Back home" tone="outline" />
      </HStack>
      <HStack
        as="main"
        width="100%"
        maxWidth={FRAME}
        hAlign="center"
        gap={10}
        paddingBlock={10}
        className="mx-auto items-stretch! lg:justify-between lg:py-14"
      >
        <VStack
          as="section"
          width="100%"
          maxWidth={460}
          gap={6}
          className="min-w-0 shrink-0 lg:justify-center"
        >
          <VStack gap={4} hAlign="start">
            <HStack
              gap={2}
              vAlign="center"
              className="rounded-full border border-border bg-surface px-3 py-1"
            >
              <LockKeyhole size={14} aria-hidden="true" />
              <Text weight="medium">{eyebrow}</Text>
            </HStack>
            <Heading level={1} textWrap="balance" className="landing-title">
              {title}
            </Heading>
            <Text as="p" color="secondary" className="landing-body">
              {intro}
            </Text>
          </VStack>
          <VStack gap={4} className="rounded-3xl bg-muted p-5 md:p-8">
            {children}
          </VStack>
        </VStack>
        <VStack
          as="aside"
          maxWidth={520}
          width="100%"
          className="landing-photo hidden! min-w-0 overflow-hidden rounded-3xl lg:flex!"
          aria-label="Learning together with Qollab"
        >
          <VStack gap={3} className="p-8">
            <Heading level={2} className="landing-subtitle">
              One room for the work you share.
            </Heading>
            <Text as="p" color="secondary" className="landing-body">
              Keep your group’s notes and PDFs in the same room. Pick up where
              you left off when you return.
            </Text>
          </VStack>
          <VStack className="relative mt-auto h-80">
            <Image
              src="/images/home-study-collaboration.png"
              loading="eager"
              alt=""
              fill
              sizes="520px"
              className="landing-crop-b object-cover brightness-105 contrast-105 mix-blend-multiply"
            />
          </VStack>
        </VStack>
      </HStack>
    </VStack>
  );
}

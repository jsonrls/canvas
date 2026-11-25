import Image from "next/image";
import Link from "next/link";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { FRAME } from "@/components/home/landing-section";

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
}

const FLOATING_AVATAR =
  "landing-float absolute size-16 justify-center rounded-full bg-surface";

/**
 * Sign-in, sign-up and password pages: a centred form beside a tall tinted
 * panel. The panel's room card and names are a sample, not live data.
 */
export function AuthShell({
  children,
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
      </HStack>
      <HStack
        as="main"
        width="100%"
        maxWidth={FRAME}
        gap={10}
        className="mx-auto flex-1 items-stretch! py-6 lg:pb-8"
      >
        <VStack
          as="section"
          hAlign="center"
          className="min-w-0 flex-1 justify-center py-6"
        >
          <VStack width="100%" maxWidth={400} gap={8}>
            <VStack gap={3} hAlign="center" className="text-center">
              <Heading
                level={1}
                textWrap="balance"
                className="landing-title font-bold"
              >
                {title}
              </Heading>
              <Text as="p" color="secondary" className="landing-body max-w-xs">
                {intro}
              </Text>
            </VStack>
            <VStack gap={4}>{children}</VStack>
          </VStack>
        </VStack>
        <VStack
          as="aside"
          aria-label="Learning together with Qollab"
          gap={6}
          hAlign="center"
          className="hidden! min-w-0 flex-1 overflow-hidden rounded-3xl bg-accent-muted p-8 lg:flex!"
        >
          <VStack
            aria-hidden="true"
            className="relative -mx-8 min-h-96 flex-1 self-stretch"
          >
            <VStack className="absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 bg-accent-muted">
              <Image
                src="/images/home-study-collaboration.png"
                loading="eager"
                alt=""
                fill
                sizes="560px"
                className="landing-crop-b object-cover brightness-105 contrast-105 mix-blend-multiply"
              />
            </VStack>
            <VStack
              hAlign="center"
              className={`${FLOATING_AVATAR} top-6 left-12`}
            >
              <Avatar name="Ana Reyes" size="lg" tooltip={false} />
            </VStack>
            <VStack
              hAlign="center"
              className={`${FLOATING_AVATAR} top-1/4 right-10`}
            >
              <Avatar name="Marco Diaz" size="lg" tooltip={false} />
            </VStack>
            <VStack
              gap={3}
              className="landing-float absolute bottom-4 left-10 w-56 rounded-3xl bg-surface p-4"
            >
              <VStack gap={0}>
                <Text weight="semibold" className="text-lg!">
                  History study group
                </Text>
                <Text color="secondary">Sample room, 3 members</Text>
              </VStack>
              <HStack gap={2} hAlign="between" vAlign="center">
                <Text
                  weight="medium"
                  className="rounded-full border border-border px-3 py-1"
                >
                  Notes
                </Text>
                <HStack gap={2} vAlign="center">
                  <StatusDot variant="success" label="Live" isPulsing />
                  <Text weight="medium">Live</Text>
                </HStack>
              </HStack>
            </VStack>
          </VStack>
          <Text as="p" className="landing-subtitle max-w-sm text-center">
            Make your study sessions easier and organized with{" "}
            <Text className="landing-subtitle font-bold">Qollab</Text>
          </Text>
        </VStack>
      </HStack>
    </VStack>
  );
}

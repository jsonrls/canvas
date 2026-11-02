import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "@/components/ui/icons";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";

interface AuthShellProps {
  children: React.ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
}

export function AuthShell({
  children,
  intro,
  title,
}: AuthShellProps): React.ReactElement {
  return (
    <VStack minHeight="100dvh" className="bg-surface" paddingInline={4}>
      <HStack
        as="header"
        width="100%"
        maxWidth={1120}
        hAlign="between"
        vAlign="center"
        wrap="wrap"
        gap={4}
        paddingBlock={6}
        className="mx-auto border-b border-border"
      >
        <Link
          href="/"
          aria-label="Qollab home"
          className="inline-flex min-h-11 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <QollabBrandLogo />
        </Link>
        <Link
          href="/"
          className="min-h-11 inline-flex items-center gap-2 text-secondary hover:text-accent focus-visible:outline-accent!"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back home
        </Link>
      </HStack>
      <HStack
        as="main"
        width="100%"
        maxWidth={1120}
        hAlign="center"
        vAlign="start"
        gap={10}
        paddingBlock={10}
        className="mx-auto lg:justify-between lg:py-12"
      >
        <VStack
          as="section"
          width="100%"
          maxWidth={440}
          gap={6}
          className="min-w-0 shrink-0"
        >
          <VStack gap={4}>
            <Heading
              level={1}
              type="display-2"
              className="text-3xl! md:text-4xl! tracking-tight"
              textWrap="balance"
            >
              {title}
            </Heading>
            <Text as="p" color="secondary">
              {intro}
            </Text>
          </VStack>
          {children}
        </VStack>
        <VStack
          as="aside"
          maxWidth={520}
          width="100%"
          gap={8}
          padding={8}
          className="hidden! lg:flex! bg-accent-muted rounded-lg min-w-0"
          aria-label="Learning together with Qollab"
        >
          <Heading level={2} type="display-2" className="tracking-tight">
            One room for the work you share.
          </Heading>
          <Text as="p" color="secondary">
            Keep your group’s notes and PDFs in the same room. Pick up where you
            left off when you return.
          </Text>
          <Image
            src="/images/home-study-collaboration.png"
            loading="eager"
            alt=""
            width={1942}
            height={809}
            sizes="520px"
            className="h-auto w-full"
          />
        </VStack>
      </HStack>
    </VStack>
  );
}

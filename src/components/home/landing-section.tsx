import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Link from "next/link";

import { ArrowRight, type IconComponent } from "@/components/ui/icons";

/** Elements carrying `data-reveal` rise in once; `LandingMotion` sets the state. */
export const REVEAL =
  "transition duration-500 ease-out data-[reveal=hidden]:translate-y-6 data-[reveal=hidden]:opacity-0";

/** Shared width of every section's content. */
export const FRAME = 1120;

const PILL_TONES = {
  primary: "landing-cta text-surface!",
  outline: "border border-border bg-surface text-primary hover:bg-muted",
};

interface PillLinkProps {
  href: string;
  label: string;
  tone?: keyof typeof PILL_TONES;
}

/** The pill action; the primary tone is the blue gradient with an arrow. */
export function PillLink({
  href,
  label,
  tone = "primary",
}: PillLinkProps): React.ReactElement {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-medium whitespace-nowrap transition-colors ${PILL_TONES[tone]}`}
    >
      {label}
      {tone === "primary" ? <ArrowRight size={17} aria-hidden="true" /> : null}
    </Link>
  );
}

interface LandingSectionProps {
  id?: string;
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}

export function LandingSection({
  id,
  labelledBy,
  className = "",
  children,
}: LandingSectionProps): React.ReactElement {
  return (
    <VStack
      as="section"
      id={id}
      aria-labelledby={labelledBy}
      hAlign="center"
      className={`scroll-mt-20 px-4 py-14 md:px-8 lg:py-20 ${className}`}
    >
      <VStack width="100%" maxWidth={FRAME} gap={10}>
        {children}
      </VStack>
    </VStack>
  );
}

type HeadLayout = "split" | "center" | "stack";

const HEAD_ROWS: Record<HeadLayout, string> = {
  split:
    "w-full flex-col items-stretch! lg:flex-row lg:items-end! lg:justify-between",
  center: "flex-col items-center! text-center",
  stack: "flex-col items-stretch!",
};

interface SectionHeadProps {
  id: string;
  Icon: IconComponent;
  label: string;
  title: string;
  detail: string;
  layout?: HeadLayout;
}

/** A small label chip, the section heading, and one supporting sentence. */
export function SectionHead({
  id,
  Icon,
  label,
  title,
  detail,
  layout = "split",
}: SectionHeadProps): React.ReactElement {
  return (
    <VStack
      data-reveal=""
      gap={4}
      hAlign={layout === "center" ? "center" : "start"}
      className={REVEAL}
    >
      <HStack
        gap={2}
        vAlign="center"
        className="rounded-full border border-border bg-surface px-3 py-1"
      >
        <Icon size={14} aria-hidden="true" />
        <Text weight="medium">{label}</Text>
      </HStack>
      <HStack gap={4} className={HEAD_ROWS[layout]}>
        <Heading
          level={2}
          id={id}
          textWrap="balance"
          className="landing-title max-w-xl"
        >
          {title}
        </Heading>
        <Text as="p" color="secondary" className="landing-body max-w-sm">
          {detail}
        </Text>
      </HStack>
    </VStack>
  );
}

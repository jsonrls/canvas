import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { HomeFeatureIcon } from "@/components/home/home-feature-icon";
import { Button } from "@/components/ui/button";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "A shared room for the work of learning",
  description:
    "Write shared notes, annotate PDFs, and sketch ideas with your study group. Keep the work together in Qollab.",
};

const TOOLS = [
  {
    title: "Shared notes",
    icon: "notes",
    description: "Write and revise one document together.",
    detail:
      "Put the explanation in your own words. Build on each other’s notes, with version history when you need to look back.",
  },
  {
    title: "PDF annotation",
    icon: "pdf",
    description: "Highlight and annotate your reading.",
    detail:
      "Keep the source beside your thinking. Add highlights and comments to the material your group is working through.",
  },
  {
    title: "Whiteboard",
    icon: "whiteboard",
    description: "Sketch the connections between ideas.",
    detail:
      "Draw a diagram, connect the pieces, and work through a question on a shared canvas.",
  },
] as const;

const NAVIGATION = [
  { href: "#why", label: "Why Qollab" },
  { href: "#workspace", label: "Study tools" },
  { href: "#how", label: "Your next session" },
];

export default async function HomePage(): Promise<React.ReactElement> {
  const isAuthenticated = (await getAuthenticatedContext()) !== null;
  const destination = isAuthenticated ? "/rooms" : "/login";
  const action = isAuthenticated
    ? "Return to your rooms"
    : "Start a study room";

  return (
    <VStack gap={0} className="bg-body min-h-dvh">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-surface focus:p-4 focus:outline-accent"
      >
        Skip to content
      </a>
      <VStack
        as="header"
        hAlign="center"
        className="border-b border-border"
        paddingInline={4}
      >
        <HStack
          width="100%"
          maxWidth={1120}
          hAlign="between"
          vAlign="center"
          gap={4}
          paddingBlock={4}
          wrap="wrap"
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
            gap={6}
            className="hidden! md:flex!"
          >
            {NAVIGATION.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex min-h-11 items-center text-secondary hover:text-accent"
              >
                {label}
              </Link>
            ))}
          </HStack>
          <Button
            href={isAuthenticated ? "/rooms" : "/login"}
            label={isAuthenticated ? "Your rooms" : "Sign in"}
            variant="secondary"
          />
        </HStack>
      </VStack>
      <VStack as="main" id="main-content" tabIndex={-1} gap={0}>
        <VStack
          as="section"
          aria-labelledby="home-title"
          paddingInline={4}
          hAlign="center"
          className="py-10 md:py-16 lg:py-20"
        >
          <HStack
            width="100%"
            maxWidth={1120}
            gap={10}
            vAlign="end"
            className="flex-col lg:flex-row"
          >
            <VStack gap={6} className="min-w-0 w-full lg:w-3/5">
              <Heading
                level={1}
                type="display-1"
                id="home-title"
                className="text-4xl! md:text-6xl! font-medium! tracking-tight"
                textWrap="balance"
              >
                Bring your notes.
                <br />
                Work through them together.
              </Heading>
              <Text
                as="p"
                type="large"
                weight="normal"
                color="secondary"
                className="max-w-lg leading-relaxed"
              >
                Write shared notes, annotate PDFs, and sketch ideas with your
                study group.
              </Text>
              <HStack gap={3} wrap="wrap" vAlign="center">
                <Button
                  href={destination}
                  label={action}
                  variant="primary"
                  size="lg"
                />
                <Button
                  href="#workspace"
                  label="See the study tools"
                  variant="ghost"
                  size="lg"
                />
              </HStack>
            </VStack>
            <VStack gap={4} className="w-full lg:w-2/5 min-w-0">
              <Image
                src="/images/home-study-collaboration.png"
                alt=""
                width={1942}
                height={809}
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 440px"
                className="h-auto w-full"
              />
              <Text
                as="p"
                color="secondary"
                className="border-t border-border pt-4"
              >
                A shared place for the questions you’re still working out.
              </Text>
            </VStack>
          </HStack>
        </VStack>
        <VStack
          as="section"
          id="why"
          aria-labelledby="why-title"
          paddingInline={4}
          hAlign="center"
          className="bg-surface border-y border-border py-8 md:py-12"
        >
          <HStack
            width="100%"
            maxWidth={1120}
            gap={8}
            vAlign="center"
            className="flex-col md:flex-row"
          >
            <Heading
              level={2}
              type="display-3"
              id="why-title"
              className="w-full md:w-2/5 tracking-tight font-medium!"
            >
              Keep the group’s work together.
            </Heading>
            <Text
              as="p"
              color="secondary"
              className="w-full md:w-3/5 text-lg! leading-relaxed"
            >
              Your notes, annotated PDFs, and diagrams belong in the same study
              room. Return to the room when you’re ready to continue.
            </Text>
          </HStack>
        </VStack>
        <VStack
          as="section"
          id="workspace"
          aria-labelledby="workspace-title"
          paddingInline={4}
          hAlign="center"
          className="py-10 md:py-20"
        >
          <HStack
            width="100%"
            maxWidth={1120}
            gap={10}
            vAlign="start"
            className="flex-col lg:flex-row"
          >
            <VStack gap={4} className="w-full lg:w-1/3">
              <Heading
                level={2}
                type="display-2"
                id="workspace-title"
                className="tracking-tight font-medium!"
              >
                Inside a<br className="hidden lg:block" /> study room
              </Heading>
              <Text as="p" color="secondary" className="max-w-sm">
                Choose the tool that fits the question. Your group stays in the
                same room.
              </Text>
              <Text type="code" color="secondary">
                Notes / PDF / Whiteboard
              </Text>
            </VStack>
            <VStack gap={0} className="w-full lg:w-2/3 min-w-0">
              {TOOLS.map(({ title, icon, description, detail }, index) => (
                <VStack
                  as="article"
                  key={title}
                  gap={3}
                  className={
                    index === 0
                      ? "border-t border-border pb-8 pt-6"
                      : "border-t border-border py-6"
                  }
                  data-home-icon-region=""
                >
                  <HStack gap={4} vAlign="center">
                    <HomeFeatureIcon kind={icon} />
                    <Heading
                      level={3}
                      type={index === 0 ? "display-3" : undefined}
                      className="tracking-tight"
                    >
                      {title}
                    </Heading>
                  </HStack>
                  <Text as="p" weight="medium">
                    {description}
                  </Text>
                  <Text
                    as="p"
                    color="secondary"
                    className="max-w-xl leading-relaxed"
                  >
                    {detail}
                  </Text>
                </VStack>
              ))}
              <VStack
                as="article"
                gap={4}
                padding={6}
                className="bg-accent-muted rounded-lg"
              >
                <Heading level={3}>Build a study pack</Heading>
                <Text as="p" color="secondary">
                  Use the study assistant to turn the room’s notes into
                  summaries, quizzes, and flashcards for your next review.
                </Text>
                <Text type="supporting">
                  Generated material is a starting point. Check it against your
                  sources.
                </Text>
              </VStack>
            </VStack>
          </HStack>
        </VStack>
        <VStack
          as="section"
          id="how"
          aria-labelledby="how-title"
          className="bg-surface border-y border-border py-10 md:py-12"
          paddingInline={4}
          hAlign="center"
        >
          <VStack width="100%" maxWidth={1120} gap={8}>
            <Heading level={2} id="how-title" className="text-secondary!">
              Your next session
            </Heading>
            <Grid columns={{ minWidth: 280, max: 2 }} gap={10}>
              <VStack gap={4}>
                <Heading level={3} type="display-3" className="tracking-tight">
                  Starting a group?
                </Heading>
                <Text as="p" color="secondary" className="max-w-md">
                  Create a room around the subject you’re studying. Keep it
                  private for your group, or make it public so others can join.
                </Text>
              </VStack>
              <VStack gap={4}>
                <Heading level={3}>Returning to a room?</Heading>
                <Text as="p" color="secondary" className="max-w-md">
                  Sign in and open a room you’ve joined. Pick up the notes and
                  shared materials your group has been working on.
                </Text>
              </VStack>
            </Grid>
          </VStack>
        </VStack>
        <VStack
          as="section"
          aria-labelledby="start-title"
          paddingInline={4}
          hAlign="center"
          className="py-10 md:py-16"
        >
          <HStack
            width="100%"
            maxWidth={1120}
            gap={6}
            hAlign="between"
            vAlign="center"
            wrap="wrap"
          >
            <Heading
              level={2}
              type="display-2"
              id="start-title"
              className="tracking-tight font-medium! max-w-xl"
            >
              Make room for your next study session.
            </Heading>
            <Button
              href={destination}
              label={action}
              variant="primary"
              size="lg"
            />
          </HStack>
        </VStack>
      </VStack>
      <VStack
        as="footer"
        paddingInline={4}
        hAlign="center"
        className="border-t border-border py-6"
      >
        <HStack
          width="100%"
          maxWidth={1120}
          hAlign="between"
          vAlign="center"
          wrap="wrap"
          gap={4}
        >
          <Text color="secondary">
            © {new Date().getFullYear()} Qollab · Study commons
          </Text>
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
        </HStack>
      </VStack>
    </VStack>
  );
}

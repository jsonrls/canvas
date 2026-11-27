import type { Metadata } from "next";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { NotFoundArt } from "@/components/home/landing-art";
import { Button } from "@/components/ui/button";
import { PANEL_MUTED } from "@/components/ui/panel";

export const metadata: Metadata = { title: "Page not found" };

/** Unmatched URLs and every `notFound()` call, such as a deleted room. */
export default function NotFound(): React.ReactElement {
  return (
    <VStack
      as="main"
      minHeight="100dvh"
      hAlign="center"
      vAlign="center"
      padding={4}
      className="bg-surface"
    >
      <VStack
        as="section"
        maxWidth={640}
        width="100%"
        gap={6}
        aria-labelledby="not-found-title"
      >
        <QollabBrandLogo />
        <VStack gap={5} className={PANEL_MUTED}>
          <VStack className="overflow-hidden rounded-2xl">
            <NotFoundArt />
          </VStack>
          <VStack gap={2}>
            <Heading
              level={1}
              id="not-found-title"
              textWrap="balance"
              className="text-2xl! md:text-3xl!"
            >
              This page got torn out
            </Heading>
            <Text as="p" color="secondary">
              The link may be old, or the room was moved or deleted. Check the
              address, or head back to your rooms.
            </Text>
          </VStack>
          <HStack gap={3} wrap="wrap">
            <Button href="/rooms" label="Back to rooms" variant="primary" />
            <Button href="/" label="Go to home" variant="secondary" />
          </HStack>
        </VStack>
      </VStack>
    </VStack>
  );
}

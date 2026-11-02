"use client";

import { useEffect } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error("[qollab:error-boundary]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <VStack
      as="main"
      minHeight="100dvh"
      hAlign="center"
      vAlign="center"
      padding={6}
      className="bg-body"
    >
      <VStack
        as="section"
        maxWidth={560}
        width="100%"
        gap={6}
        aria-labelledby="error-page-title"
      >
        <QollabBrandLogo />
        <Heading
          level={1}
          type="display-2"
          id="error-page-title"
          textWrap="balance"
        >
          We couldn’t open this page.
        </Heading>
        <Text as="p" color="secondary">
          Try loading it again. If the problem continues, return to your rooms
          and reopen the workspace.
        </Text>
        <HStack gap={3} wrap="wrap">
          <Button label="Try again" variant="primary" onClick={reset} />
          <Button href="/rooms" label="Back to rooms" variant="secondary" />
        </HStack>
      </VStack>
    </VStack>
  );
}

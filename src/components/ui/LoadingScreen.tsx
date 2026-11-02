import { HStack } from "@astryxdesign/core/HStack";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { QollabBrandLogo } from "@/components/brand/qollab-brand-logo";

type LoadingIndicatorSize = "compact" | "icon" | "panel";

interface LoadingScreenProps {
  message?: string;
}

interface LoadingIndicatorProps {
  className?: string;
  description?: string;
  label?: string;
  size?: LoadingIndicatorSize;
}

export function LoadingIndicator({
  className,
  description,
  label,
  size = "compact",
}: LoadingIndicatorProps): React.ReactElement {
  const accessibleLabel = [label, description].filter(Boolean).join(" ");

  return (
    <HStack
      as="span"
      gap={size === "panel" ? 4 : 2}
      hAlign="center"
      vAlign="center"
      className={`${size === "panel" ? "w-full min-h-32 flex-col px-5 py-7 text-center" : "inline-flex! shrink-0"} ${className ?? ""}`}
      role={label ? "status" : undefined}
      aria-live={label ? "polite" : undefined}
      aria-atomic={label ? "true" : undefined}
      aria-busy={label ? "true" : undefined}
      aria-label={accessibleLabel || undefined}
      aria-hidden={label ? undefined : "true"}
    >
      <Spinner
        size={size === "compact" ? "md" : "lg"}
        shade="inherit"
        aria-hidden="true"
      />
      {label && size !== "icon" ? (
        <VStack as="span" gap={1} aria-hidden="true">
          <Text as="span" weight="medium">
            {label}
          </Text>
          {description ? (
            <Text as="span" color="secondary">
              {description}
            </Text>
          ) : null}
        </VStack>
      ) : null}
    </HStack>
  );
}

export function LoadingScreen({
  message = "Loading your workspace…",
}: LoadingScreenProps): React.ReactElement {
  return (
    <VStack
      as="main"
      minHeight="100dvh"
      hAlign="center"
      vAlign="center"
      gap={8}
      padding={6}
      className="bg-surface"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy="true"
      aria-label={`Qollab is loading. ${message}`}
    >
      <QollabBrandLogo />
      <HStack gap={3} vAlign="center" aria-hidden="true">
        <Spinner size="lg" />
        <Text color="secondary">{message}</Text>
      </HStack>
    </VStack>
  );
}

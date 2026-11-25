import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";

import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { Button } from "@/components/ui/button";
import { ChartColumnBig } from "@/components/ui/icons";

/** Tells a student in another tool that a question is waiting for an answer. */
export function LivePrompt({
  live,
  onAnswer,
}: {
  live: LiveActivitiesState;
  onAnswer(): void;
}): React.ReactElement | null {
  const { snapshot } = live;
  if (
    !snapshot ||
    snapshot.canHost ||
    !snapshot.session.isAccepting ||
    snapshot.myResponse
  ) {
    return null;
  }
  return (
    <HStack
      gap={3}
      padding={3}
      wrap="wrap"
      vAlign="center"
      className="border-b border-border bg-surface"
      role="status"
    >
      <Text className="flex-1">A live question is open.</Text>
      <Button
        label="Answer now"
        icon={<ChartColumnBig aria-hidden="true" size={16} />}
        onClick={onAnswer}
      />
    </HStack>
  );
}

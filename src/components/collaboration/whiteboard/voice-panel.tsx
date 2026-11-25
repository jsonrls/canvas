import { Card } from "@astryxdesign/core/Card";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";

import type { VoiceStatus } from "@/components/collaboration/whiteboard/use-voice-input";
import { Button } from "@/components/ui/button";
import { Check, X } from "@/components/ui/icons";
import { MAX_VOICE_SECONDS } from "@/lib/whiteboard/voice-question";

const STATUS_LABELS: Record<VoiceStatus, string> = {
  finishing: "Turning your words into text…",
  idle: "Microphone off",
  listening: "Listening…",
  starting: "Waiting for the microphone…",
};

function formatSeconds(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Shown for as long as the microphone may be on. References: Google Docs voice
 * typing (one click on, one click off) and ChatGPT dictation (a recording bar
 * with the time, Cancel and Done).
 */
export function VoicePanel({
  download,
  onCancel,
  onDone,
  seconds,
  status,
}: {
  /** Percent of the speech model fetched so far; null once it is ready. */
  download: number | null;
  onCancel: () => void;
  onDone: () => void;
  seconds: number;
  status: VoiceStatus;
}): React.ReactElement {
  return (
    <VStack className="whiteboard-voice-panel">
      <Card elevation="med" padding={3}>
        <VStack gap={2}>
          <HStack gap={2} vAlign="center">
            <StatusDot
              variant={status === "listening" ? "error" : "neutral"}
              label="Microphone"
              isPulsing={status === "listening"}
            />
            <Text type="label" role="status">
              {STATUS_LABELS[status]}
            </Text>
            {status === "listening" ? (
              <Text type="supporting" hasTabularNumbers>
                {formatSeconds(seconds)} of {formatSeconds(MAX_VOICE_SECONDS)}
              </Text>
            ) : null}
          </HStack>
          <Text as="p" type="supporting">
            Your voice stays on this device. Only the words go on the board.
          </Text>
          {download === null ? null : (
            <Text as="p" type="supporting" hasTabularNumbers>
              Getting the speech model, about 80 MB the first time:{" "}
              {Math.floor(download)}%
            </Text>
          )}
          <HStack gap={2} hAlign="end">
            <Button
              label="Cancel"
              variant="ghost"
              size="sm"
              icon={<X aria-hidden="true" size={16} />}
              onClick={onCancel}
            />
            <Button
              label="Done"
              variant="primary"
              size="sm"
              icon={<Check aria-hidden="true" size={16} />}
              isDisabled={status !== "listening"}
              onClick={onDone}
            />
          </HStack>
        </VStack>
      </Card>
    </VStack>
  );
}

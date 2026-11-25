import { Dialog } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Slider } from "@astryxdesign/core/Slider";
import { Text } from "@astryxdesign/core/Text";

import {
  MAX_FLASHCARD_COUNT,
  MAX_QUIZ_COUNT,
  MIN_FLASHCARD_COUNT,
  MIN_QUIZ_COUNT,
} from "@/lib/ai/study-pack";
import { Button } from "@/components/ui/button";
import { Sparkles } from "@/components/ui/icons";

export interface StudyPackConfigDialogProps {
  flashcardCount: number;
  isGenerating: boolean;
  isOpen: boolean;
  onClose(): void;
  onConfirm(quizCount: number, flashcardCount: number): void;
  quizCount: number;
  setFlashcardCount(n: number): void;
  setQuizCount(n: number): void;
}

export function StudyPackConfigDialog({
  flashcardCount,
  isGenerating,
  isOpen,
  onClose,
  onConfirm,
  quizCount,
  setFlashcardCount,
  setQuizCount,
}: StudyPackConfigDialogProps): React.ReactElement {
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isGenerating) onClose();
      }}
      aria-labelledby="study-pack-config-title"
      purpose="form"
      width={480}
    >
      <VStack gap={6} padding={6}>
        <VStack gap={1}>
          <Heading level={2} id="study-pack-config-title">
            Choose how much to generate
          </Heading>
          <Text as="p" color="secondary">
            The summary, next steps and review are always included.
          </Text>
        </VStack>
        <Slider
          label="Quiz questions"
          min={MIN_QUIZ_COUNT}
          max={MAX_QUIZ_COUNT}
          value={quizCount}
          valueDisplay="text"
          onChange={setQuizCount}
          width="100%"
        />
        <Slider
          label="Flashcards"
          min={MIN_FLASHCARD_COUNT}
          max={MAX_FLASHCARD_COUNT}
          value={flashcardCount}
          valueDisplay="text"
          onChange={setFlashcardCount}
          width="100%"
        />
        <HStack gap={2} hAlign="end" wrap="wrap">
          <Button
            label="Cancel"
            variant="ghost"
            isDisabled={isGenerating}
            onClick={onClose}
          />
          <Button
            label="Generate study pack"
            variant="primary"
            icon={<Sparkles aria-hidden="true" size={16} />}
            isLoading={isGenerating}
            onClick={() => onConfirm(quizCount, flashcardCount)}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}

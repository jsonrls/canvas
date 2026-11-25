"use client";

import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";
import { useState } from "react";

import { Button, ButtonControl, IconButton } from "@/components/ui/button";
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
} from "@/components/ui/icons";
import {
  PANEL_ACCENT,
  PANEL_HEADING,
  PANEL_MUTED,
  PANEL_ROW,
} from "@/components/ui/panel";
import type { StudyPack } from "@/lib/ai/study-pack";
import { quizScore } from "@/lib/ai/study-view-state";

const ANSWER_OPTION =
  "flex min-h-12 w-full items-center gap-3 rounded-2xl p-4 text-start text-base text-primary transition-colors";

// Tints, so the dark text stays readable wherever a shape passes behind it.
const CARD_COLORS = [
  {
    prompt: "bg-answer-1/15",
    answer: "bg-answer-1/25",
    shape: "bg-answer-1/30",
    ring: "border-answer-1/30",
  },
  {
    prompt: "bg-answer-2/15",
    answer: "bg-answer-2/25",
    shape: "bg-answer-2/30",
    ring: "border-answer-2/30",
  },
  {
    prompt: "bg-answer-3/15",
    answer: "bg-answer-3/25",
    shape: "bg-answer-3/30",
    ring: "border-answer-3/30",
  },
  {
    prompt: "bg-answer-4/15",
    answer: "bg-answer-4/25",
    shape: "bg-answer-4/30",
    ring: "border-answer-4/30",
  },
  {
    prompt: "bg-answer-5/15",
    answer: "bg-answer-5/25",
    shape: "bg-answer-5/30",
    ring: "border-answer-5/30",
  },
  {
    prompt: "bg-answer-6/15",
    answer: "bg-answer-6/25",
    shape: "bg-answer-6/30",
    ring: "border-answer-6/30",
  },
] as const;
// Plays each time the side changes; reduced motion turns it off app-wide.
const CARD_SIDE =
  "transition duration-300 ease-out starting:translate-y-2 starting:scale-95 starting:opacity-0";
const CARD_SHAPE =
  "pointer-events-none absolute transition-transform duration-500 ease-out";

/** Corner shapes of one flashcard; they turn when the card is flipped. */
function CardShapes({
  colors,
  index,
  isRevealed,
}: {
  colors: (typeof CARD_COLORS)[number];
  index: number;
  isRevealed: boolean;
}): React.ReactElement {
  const solid = index % 2 === 0 ? "rounded-full" : "rounded-3xl";
  return (
    <>
      <VStack
        as="span"
        aria-hidden="true"
        className={`${CARD_SHAPE} -top-16 -left-16 size-44 md:size-56 ${solid} ${colors.shape} ${isRevealed ? "scale-90 rotate-45" : "rotate-12"}`}
      />
      <VStack
        as="span"
        aria-hidden="true"
        className={`${CARD_SHAPE} -right-12 -bottom-16 size-40 rounded-full border-24 md:size-52 ${colors.ring} ${isRevealed ? "scale-75" : ""}`}
      />
      <VStack
        as="span"
        aria-hidden="true"
        className={`${CARD_SHAPE} top-6 right-8 size-8 md:right-16 md:size-12 ${index % 2 === 0 ? "rounded-lg" : "rounded-full"} ${colors.shape} ${isRevealed ? "translate-y-6 rotate-90" : "rotate-12"}`}
      />
    </>
  );
}

const KIND_LABELS = {
  clarify: "Clarify",
  connect: "Connect",
  practice: "Practice",
  review: "Review",
} as const;

function ViewHeading({
  children,
  title,
}: {
  children?: React.ReactNode;
  title: string;
}): React.ReactElement {
  return (
    <VStack gap={1}>
      <Heading level={3} className="text-xl!">
        {title}
      </Heading>
      {children}
    </VStack>
  );
}

export function SummaryView({ pack }: { pack: StudyPack }): React.ReactElement {
  return (
    <VStack gap={6}>
      <ViewHeading title={pack.summary.title}>
        <Text as="p">{pack.summary.overview}</Text>
      </ViewHeading>

      <VStack as="section" gap={4} className={PANEL_MUTED}>
        <Heading level={4} className={PANEL_HEADING}>
          Key points
        </Heading>
        <VStack as="ol" gap={2}>
          {pack.summary.keyPoints.map((point, index) => (
            <HStack
              as="li"
              gap={3}
              vAlign="start"
              className={PANEL_ROW}
              key={`${index}-${point}`}
            >
              <Text weight="semibold" color="secondary" aria-hidden="true">
                {index + 1}
              </Text>
              <Text>{point}</Text>
            </HStack>
          ))}
        </VStack>
      </VStack>

      <VStack as="section" gap={4} className={PANEL_ACCENT}>
        <Heading level={4} className={PANEL_HEADING}>
          Open questions
        </Heading>
        {pack.summary.openQuestions.length > 0 ? (
          <VStack as="ul" gap={2}>
            {pack.summary.openQuestions.map((question, index) => (
              <VStack
                as="li"
                className={PANEL_ROW}
                key={`${index}-${question}`}
              >
                <Text>{question}</Text>
              </VStack>
            ))}
          </VStack>
        ) : (
          <Text as="p">
            The notes did not leave a clear unresolved question.
          </Text>
        )}
      </VStack>
    </VStack>
  );
}

export function QuizView({
  answers,
  onAnswer,
  onReset,
  pack,
}: {
  answers: Record<number, number>;
  onAnswer(questionIndex: number, optionIndex: number): void;
  onReset(): void;
  pack: StudyPack;
}): React.ReactElement {
  const { answeredCount, correctCount } = quizScore(pack.quiz, answers);

  return (
    <VStack gap={6}>
      <HStack gap={4} hAlign="between" vAlign="end" wrap="wrap">
        <ViewHeading title="Practice quiz">
          <Text as="p" color="secondary" aria-live="polite">
            {answeredCount === 0
              ? `${pack.quiz.length} questions. Choose an answer to see the explanation.`
              : `${correctCount} of ${answeredCount} correct, ${pack.quiz.length - answeredCount} left.`}
          </Text>
        </ViewHeading>
        {answeredCount > 0 ? (
          <Button
            label="Reset quiz"
            variant="secondary"
            icon={<RotateCcw aria-hidden="true" size={16} />}
            onClick={onReset}
          />
        ) : null}
      </HStack>

      <VStack as="ol" gap={4}>
        {pack.quiz.map((item, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const isAnswered = selectedAnswer !== undefined;
          const isCorrect = selectedAnswer === item.answerIndex;

          return (
            <VStack
              as="li"
              gap={4}
              className={PANEL_MUTED}
              key={`${questionIndex}-${item.question}`}
            >
              <VStack gap={1}>
                <Text type="supporting">
                  Question {questionIndex + 1} of {pack.quiz.length}
                </Text>
                <Heading level={4} className="text-lg!">
                  {item.question}
                </Heading>
              </VStack>
              <VStack
                gap={2}
                role="group"
                aria-label={`Answers for question ${questionIndex + 1}`}
              >
                {item.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const showCorrect =
                    isAnswered && optionIndex === item.answerIndex;
                  const showIncorrect = isSelected && !isCorrect;
                  const stateClass = showCorrect
                    ? "bg-success-muted"
                    : showIncorrect
                      ? "bg-error-muted"
                      : isAnswered
                        ? "bg-surface"
                        : "cursor-pointer bg-surface hover:bg-accent-muted";

                  return (
                    <ButtonControl
                      variant="custom"
                      aria-pressed={isSelected}
                      className={`${ANSWER_OPTION} ${stateClass}`}
                      disabled={isAnswered}
                      key={`${optionIndex}-${option}`}
                      onClick={() => onAnswer(questionIndex, optionIndex)}
                    >
                      <Text weight="semibold" color="secondary">
                        {String.fromCharCode(65 + optionIndex)}
                      </Text>
                      <Text className="min-w-0 flex-1 break-words">
                        {option}
                      </Text>
                      {showCorrect ? (
                        <>
                          <Check aria-hidden="true" size={18} />
                          <Text weight="semibold" size="sm">
                            Answer
                          </Text>
                        </>
                      ) : showIncorrect ? (
                        <>
                          <X aria-hidden="true" size={18} />
                          <Text weight="semibold" size="sm">
                            Your choice
                          </Text>
                        </>
                      ) : null}
                    </ButtonControl>
                  );
                })}
              </VStack>
              {isAnswered ? (
                <VStack gap={1} role="status">
                  <Text weight="semibold">
                    {isCorrect ? "Correct." : "Review this one."}
                  </Text>
                  <Text as="p">{item.explanation}</Text>
                </VStack>
              ) : null}
            </VStack>
          );
        })}
      </VStack>
    </VStack>
  );
}

export function FlashcardsView({
  onToggle,
  pack,
  revealedCards,
}: {
  onToggle(index: number): void;
  pack: StudyPack;
  revealedCards: Set<number>;
}): React.ReactElement {
  const [index, setIndex] = useState(0);
  const total = pack.flashcards.length;
  const card = pack.flashcards[index];
  const isRevealed = revealedCards.has(index);
  const colors = CARD_COLORS[index % CARD_COLORS.length];

  const move = (step: number): void => {
    setIndex((current) => Math.min(total - 1, Math.max(0, current + step)));
  };

  if (!card) {
    return (
      <EmptyState
        isCompact
        title="No flashcards in this pack"
        description="Regenerate the pack to create a new set."
      />
    );
  }

  return (
    <VStack gap={6}>
      <ViewHeading title="Flashcards">
        <Text as="p" color="secondary">
          Choose the card to flip it, then move with the arrows.
        </Text>
      </ViewHeading>
      <VStack
        gap={4}
        className={PANEL_MUTED}
        role="group"
        aria-label="Flashcard deck"
        onKeyDown={(event: React.KeyboardEvent) => {
          if (event.key === "ArrowRight") move(1);
          else if (event.key === "ArrowLeft") move(-1);
          else return;
          event.preventDefault();
        }}
      >
        <ButtonControl
          variant="custom"
          aria-label={`${isRevealed ? "Hide" : "Reveal"} answer for flashcard ${index + 1}`}
          aria-describedby="ai-flashcard-text"
          aria-pressed={isRevealed}
          className={`relative flex min-h-72 w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl p-6 text-center transition-colors duration-500 text-primary md:min-h-80 md:p-10 ${isRevealed ? colors.answer : colors.prompt}`}
          onClick={() => onToggle(index)}
        >
          <CardShapes
            key={index}
            colors={colors}
            index={index}
            isRevealed={isRevealed}
          />
          <Text
            key={isRevealed ? "answer" : "prompt"}
            size="sm"
            weight="semibold"
            className={`relative rounded-full bg-surface px-4 py-1 ${CARD_SIDE}`}
          >
            {isRevealed ? "Answer" : "Prompt"}
          </Text>
          <Text
            id="ai-flashcard-text"
            size="2xl"
            weight="medium"
            className="relative max-w-prose break-words"
            aria-live="polite"
          >
            {/* Keyed inside the live region, so screen readers still hear it. */}
            <VStack
              as="span"
              key={isRevealed ? "answer" : "prompt"}
              className={CARD_SIDE}
            >
              {isRevealed ? card.back : card.front}
            </VStack>
          </Text>
        </ButtonControl>
        <HStack gap={4} hAlign="center" vAlign="center">
          <IconButton
            label="Previous card"
            tooltip="Previous card"
            icon={<ChevronLeft aria-hidden="true" size={18} />}
            isDisabled={index === 0}
            onClick={() => move(-1)}
          />
          <Text weight="medium" aria-live="polite">
            {index + 1} of {total}
          </Text>
          <IconButton
            label="Next card"
            tooltip="Next card"
            icon={<ChevronRight aria-hidden="true" size={18} />}
            isDisabled={index === total - 1}
            onClick={() => move(1)}
          />
        </HStack>
      </VStack>
    </VStack>
  );
}

export function RecommendationsView({
  pack,
}: {
  pack: StudyPack;
}): React.ReactElement {
  return (
    <VStack gap={6}>
      <ViewHeading title="What to work on next">
        <Text as="p" color="secondary">
          Based on gaps and connections in these notes.
        </Text>
      </ViewHeading>
      <VStack as="ol" gap={2} className={PANEL_MUTED}>
        {pack.recommendations.map((recommendation, index) => (
          <VStack
            as="li"
            gap={2}
            className={PANEL_ROW}
            key={`${index}-${recommendation.title}`}
          >
            <HStack gap={3} hAlign="between" vAlign="start">
              <Heading level={4} className={PANEL_HEADING}>
                {recommendation.title}
              </Heading>
              <Token
                label={KIND_LABELS[recommendation.kind]}
                size="sm"
                className="shrink-0"
              />
            </HStack>
            <Text as="p" color="secondary">
              {recommendation.rationale}
            </Text>
            <Text as="p" weight="medium">
              {recommendation.nextStep}
            </Text>
          </VStack>
        ))}
      </VStack>
    </VStack>
  );
}

export function MisconceptionsView({
  pack,
}: {
  pack: StudyPack;
}): React.ReactElement {
  return (
    <VStack gap={6}>
      <ViewHeading title="Claims to check">
        <Text as="p" color="secondary">
          These are prompts to review, not definitive corrections.
        </Text>
      </ViewHeading>

      {pack.misconceptions.length > 0 ? (
        <VStack as="ol" gap={2} className={PANEL_MUTED}>
          {pack.misconceptions.map((item, index) => (
            <VStack
              as="li"
              gap={4}
              className={PANEL_ROW}
              key={`${index}-${item.suspectedClaim}`}
            >
              <HStack gap={3} hAlign="between" vAlign="start">
                <Heading level={4} className={PANEL_HEADING}>
                  {item.suspectedClaim}
                </Heading>
                <Token
                  label={`${item.confidence} confidence`}
                  size="sm"
                  className="shrink-0"
                />
              </HStack>
              <HStack gap={4} vAlign="start" className="flex-col md:flex-row">
                <VStack gap={1} className="w-full flex-1">
                  <Text weight="semibold" size="sm">
                    Possible correction
                  </Text>
                  <Text as="p">{item.correction}</Text>
                </VStack>
                <VStack gap={1} className="w-full flex-1">
                  <Text weight="semibold" size="sm">
                    Why it matters
                  </Text>
                  <Text as="p">{item.whyItMatters}</Text>
                </VStack>
              </HStack>
            </VStack>
          ))}
        </VStack>
      ) : (
        <VStack className={PANEL_MUTED}>
          <EmptyState
            isCompact
            title="No supported misconception signal"
            description="The assistant did not find a claim it could responsibly flag. Keep checking the notes against course sources."
            icon={<CheckCircle2 />}
          />
        </VStack>
      )}
    </VStack>
  );
}

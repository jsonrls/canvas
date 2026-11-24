"use client";

import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Text } from "@astryxdesign/core/Text";
import { Token } from "@astryxdesign/core/Token";

import { ChartColumnBig, Trophy } from "@/components/ui/icons";
import type {
  Leaderboard,
  LiveQuestion,
  LiveResults as LiveResultsData,
} from "@/lib/live/activities";

type TextSize = "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
const CLOUD_SIZES: TextSize[] = ["sm", "base", "lg", "xl", "2xl", "3xl"];

function responseLabel(total: number): string {
  return total === 1 ? "1 response" : `${total} responses`;
}

function ChoiceResults({
  counts,
  question,
  total,
}: {
  counts: number[];
  question: LiveQuestion;
  total: number;
}): React.ReactElement {
  return (
    <VStack gap={4} as="ol" aria-label="Votes per option">
      {question.options.map((option, index) => {
        const isCorrect = question.correctOption === index;
        const count = counts[index] ?? 0;
        return (
          <VStack as="li" gap={1} key={`${index}-${option}`}>
            <HStack gap={2} hAlign="between" vAlign="center">
              <HStack gap={2} vAlign="center" className="min-w-0">
                <Text weight="medium" className="break-words">
                  {option}
                </Text>
                {isCorrect ? (
                  <Token label="Correct" color="green" size="sm" />
                ) : null}
              </HStack>
              <Text type="supporting">{count}</Text>
            </HStack>
            <ProgressBar
              label={`${option}: ${count} of ${total}`}
              isLabelHidden
              value={count}
              max={Math.max(total, 1)}
              variant={isCorrect ? "success" : "accent"}
            />
          </VStack>
        );
      })}
    </VStack>
  );
}

function WordCloud({
  words,
}: {
  words: Array<{ text: string; count: number }>;
}): React.ReactElement {
  const highest = Math.max(...words.map((word) => word.count), 1);
  return (
    <HStack
      gap={4}
      wrap="wrap"
      hAlign="center"
      vAlign="center"
      padding={4}
      role="list"
      aria-label="Word cloud"
    >
      {words.map((word) => {
        const step = Math.round(
          (word.count / highest) * (CLOUD_SIZES.length - 1),
        );
        return (
          <Text
            key={word.text}
            role="listitem"
            aria-label={`${word.text}, ${word.count}`}
            size={CLOUD_SIZES[step]}
            weight={step >= 4 ? "bold" : step >= 2 ? "semibold" : "normal"}
            color={step >= 3 ? "accent" : undefined}
            className="break-words"
          >
            {word.text}
          </Text>
        );
      })}
    </HStack>
  );
}

function ScaleResults({
  average,
  counts,
  total,
}: {
  average: number | null;
  counts: number[];
  total: number;
}): React.ReactElement {
  return (
    <VStack gap={4}>
      <HStack gap={2} vAlign="end">
        <Heading level={3}>{average ?? "–"}</Heading>
        <Text type="supporting">average out of {counts.length}</Text>
      </HStack>
      <VStack gap={2} as="ol" aria-label="Ratings">
        {counts.map((count, index) => (
          <HStack as="li" gap={3} vAlign="center" key={index}>
            <Text weight="medium">{index + 1}</Text>
            <VStack className="flex-1">
              <ProgressBar
                label={`Rating ${index + 1}: ${count} of ${total}`}
                isLabelHidden
                value={count}
                max={Math.max(total, 1)}
              />
            </VStack>
            <Text type="supporting">{count}</Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}

export function LiveResults({
  question,
  results,
}: {
  question: LiveQuestion;
  results: LiveResultsData;
}): React.ReactElement {
  if (results.total === 0) {
    return (
      <EmptyState
        isCompact
        title="No responses yet"
        description="Results appear here as answers come in."
        icon={<ChartColumnBig />}
      />
    );
  }

  return (
    <VStack gap={3}>
      <Text type="supporting" aria-live="polite">
        {responseLabel(results.total)}
      </Text>
      {results.type === "choice" ? (
        <ChoiceResults
          counts={results.counts}
          question={question}
          total={results.total}
        />
      ) : results.type === "words" ? (
        <WordCloud words={results.words} />
      ) : results.type === "texts" ? (
        <List aria-label="Answers">
          {results.texts.map((text, index) => (
            <ListItem key={`${index}-${text}`} label={text} />
          ))}
        </List>
      ) : (
        <ScaleResults
          average={results.average}
          counts={results.counts}
          total={results.total}
        />
      )}
    </VStack>
  );
}

export function LiveLeaderboard({
  leaderboard,
}: {
  leaderboard: Leaderboard;
}): React.ReactElement {
  const showMeSeparately =
    leaderboard.me !== null && !leaderboard.top.some((entry) => entry.isMe);
  const entries = showMeSeparately
    ? [...leaderboard.top, leaderboard.me!]
    : leaderboard.top;

  return (
    <VStack gap={3}>
      <HStack gap={2} vAlign="center">
        <Trophy aria-hidden="true" size={18} />
        <Heading level={3}>Leaderboard</Heading>
      </HStack>
      {entries.length === 0 ? (
        <Text type="supporting">No quiz answers yet.</Text>
      ) : (
        <List aria-label="Quiz leaderboard">
          {entries.map((entry) => (
            <ListItem
              key={`${entry.rank}-${entry.name}-${entry.isMe}`}
              isSelected={entry.isMe}
              startContent={<Text weight="semibold">#{entry.rank}</Text>}
              label={entry.isMe ? `${entry.name} (you)` : entry.name}
              endContent={<Text weight="semibold">{entry.points}</Text>}
            />
          ))}
        </List>
      )}
    </VStack>
  );
}

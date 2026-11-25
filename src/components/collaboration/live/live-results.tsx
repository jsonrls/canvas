"use client";

import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";

import {
  ChoiceChart,
  FlowingGrid,
  RankedBars,
  SpeechBubbles,
  Swatch,
  WordCloud,
} from "@/components/collaboration/live/live-charts";
import {
  GridPlot,
  NumberLine,
  PinnedImage,
  ScaleHill,
} from "@/components/collaboration/live/live-plots";
import { ChartColumnBig, Trophy } from "@/components/ui/icons";
import { PANEL_ROW } from "@/components/ui/panel";
import {
  layoutOf,
  type Leaderboard,
  type LivePoint,
  type LiveQuestion,
  type LiveResults as LiveResultsData,
} from "@/lib/live/activities";
import { ordinal } from "@/lib/live/shapes";

function responseLabel(total: number): string {
  return total === 1 ? "1 response" : `${total} responses`;
}

function ScaleResults({
  rows,
}: {
  rows: Extract<LiveResultsData, { type: "scale" }>["rows"];
}): React.ReactElement {
  return (
    <VStack gap={5} as="ol" aria-label="Ratings">
      {rows.map((row, index) => (
        <VStack as="li" gap={1} key={`${index}-${row.label}`}>
          {row.label ? (
            <Text size="lg" className="break-words">
              {row.label}
            </Text>
          ) : null}
          <ScaleHill average={row.average} color={index} counts={row.counts} />
        </VStack>
      ))}
    </VStack>
  );
}

function NumberResults({
  question,
  results,
}: {
  question: LiveQuestion;
  results: Extract<LiveResultsData, { type: "number" }>;
}): React.ReactElement {
  const { answer, max = 0, min = 0 } = question.settings;
  return (
    <VStack gap={4}>
      <NumberLine
        answer={answer}
        buckets={results.buckets}
        max={max}
        min={min}
      />
      <Text as="p">
        Average guess {results.average ?? "–"}.
        {answer === undefined
          ? ""
          : ` ${results.exact} exact ${results.exact === 1 ? "guess" : "guesses"}.`}
      </Text>
    </VStack>
  );
}

function GridResults({
  question,
  averages,
}: {
  question: LiveQuestion;
  averages: LivePoint[];
}): React.ReactElement {
  const xLabel = question.settings.xLabel ?? "";
  const yLabel = question.settings.yLabel ?? "";
  return (
    <HStack
      gap={6}
      hAlign="center"
      className="flex-col items-center! lg:flex-row lg:items-start!"
    >
      <GridPlot
        labels={question.options}
        points={averages}
        xLabel={xLabel}
        yLabel={yLabel}
      />
      <List
        aria-label="Average position per item"
        className="w-full max-w-lg lg:w-auto lg:max-w-xs"
      >
        {question.options.map((option, index) => (
          <ListItem
            key={`${index}-${option}`}
            startContent={<Swatch index={index} />}
            label={
              // A plain string would be cut to one line.
              <Text as="span" className="break-words">
                {option}
              </Text>
            }
            description={`${xLabel} ${averages[index].x}, ${yLabel} ${averages[index].y}`}
          />
        ))}
      </List>
    </HStack>
  );
}

function FormResults({
  fields,
  rows,
}: {
  fields: string[];
  rows: string[][];
}): React.ReactElement {
  return (
    <VStack as="ol" gap={2} aria-label="Form answers">
      {rows.map((row, index) => (
        <VStack
          as="li"
          gap={1}
          className={`${PANEL_ROW} bg-muted!`}
          key={index}
        >
          {fields.map((field, column) => (
            <Text key={field} className="break-words">
              <Text as="span" weight="semibold">
                {field}:{" "}
              </Text>
              {row[column] || "–"}
            </Text>
          ))}
        </VStack>
      ))}
    </VStack>
  );
}

function ResultsBody({
  imageUrl,
  question,
  results,
}: {
  imageUrl: string;
  question: LiveQuestion;
  results: LiveResultsData;
}): React.ReactElement {
  const { options } = question;
  switch (results.type) {
    case "choice":
      return (
        <ChoiceChart
          correctOption={question.correctOption}
          counts={results.counts}
          layout={layoutOf(question)}
          options={options}
        />
      );
    case "words":
      return <WordCloud words={results.words} />;
    case "texts":
      return layoutOf(question) === "grid" ? (
        <FlowingGrid texts={results.texts} total={results.total} />
      ) : (
        <SpeechBubbles texts={results.texts} total={results.total} />
      );
    case "scale":
      return <ScaleResults rows={results.rows} />;
    case "ranking":
      return (
        <RankedBars
          label="Items, best average first"
          // First place fills the bar.
          max={options.length}
          rows={results.rows.map(({ average, option }) => ({
            color: option,
            name: options[option],
            // Equal averages share a place, as equal quiz points do.
            place: ordinal(
              results.rows.findIndex((row) => row.average === average) + 1,
            ),
            value: options.length + 1 - average,
            valueLabel: `average position ${average}`,
          }))}
        />
      );
    case "points":
      return (
        <RankedBars
          label="Average points, most first"
          max={Math.max(...results.averages, 1)}
          rows={results.averages
            .map((average, option) => ({
              color: option,
              name: options[option],
              value: average,
              valueLabel: `${average} points`,
            }))
            .sort((a, b) => b.value - a.value || a.color - b.color)}
        />
      );
    case "grid":
      return <GridResults question={question} averages={results.averages} />;
    case "number":
      return <NumberResults question={question} results={results} />;
    case "form":
      return <FormResults fields={options} rows={results.rows} />;
    case "pin":
      return (
        <VStack gap={3} hAlign="center">
          <PinnedImage
            alt={`Image for: ${question.prompt}, with everyone’s pins`}
            src={imageUrl}
            pins={results.pins}
            area={question.settings.area}
          />
          {results.inArea === null ? null : (
            <Text as="p">
              {results.inArea} of {results.total}{" "}
              {results.total === 1 ? "pin is" : "pins are"} in the correct area.
            </Text>
          )}
        </VStack>
      );
  }
}

export function LiveResults({
  imageUrl,
  question,
  results,
}: {
  imageUrl: string;
  question: LiveQuestion;
  results: LiveResultsData;
}): React.ReactElement {
  if (results.total === 0 && results.type !== "pin") {
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
      <ResultsBody imageUrl={imageUrl} question={question} results={results} />
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

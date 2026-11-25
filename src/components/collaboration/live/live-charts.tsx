"use client";

import { useMediaQuery } from "@astryxdesign/core/hooks";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { Token, type TokenProps } from "@astryxdesign/core/Token";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { Check } from "@/components/ui/icons";
import {
  LIVE_KIND_LABELS,
  type LiveLayout,
  type LiveQuestionKind,
} from "@/lib/live/activities";
import { answerColor, packWords } from "@/lib/live/word-cloud";

// Written out in full so Tailwind can find every class.
export const FILLS = [
  "fill-answer-1",
  "fill-answer-2",
  "fill-answer-3",
  "fill-answer-4",
  "fill-answer-5",
  "fill-answer-6",
];
export const STROKES = [
  "stroke-answer-1",
  "stroke-answer-2",
  "stroke-answer-3",
  "stroke-answer-4",
  "stroke-answer-5",
  "stroke-answer-6",
];
const TINTS = [
  "bg-answer-1/15",
  "bg-answer-2/15",
  "bg-answer-3/15",
  "bg-answer-4/15",
  "bg-answer-5/15",
  "bg-answer-6/15",
];
/** A large coloured choice; the tint marks the chosen one. */
export const CHOICE_CLASSES = [
  "border-answer-1 has-checked:bg-answer-1/15",
  "border-answer-2 has-checked:bg-answer-2/15",
  "border-answer-3 has-checked:bg-answer-3/15",
  "border-answer-4 has-checked:bg-answer-4/15",
  "border-answer-5 has-checked:bg-answer-5/15",
  "border-answer-6 has-checked:bg-answer-6/15",
];
export const MOVE = "transition-all duration-500 motion-reduce:transition-none";
const DOT_LIMIT = 60;

interface ChoiceData {
  correctOption: number | null;
  counts: number[];
  options: string[];
}

/** A ring that drains with the time left; it turns red for the last five. */
export function Countdown({
  seconds,
  total,
}: {
  seconds: number;
  total: number;
}): React.ReactElement {
  const share = Math.min(100, (seconds / Math.max(total, 1)) * 100);
  return (
    <svg
      viewBox="0 0 100 100"
      role="timer"
      aria-label={`${seconds} seconds left`}
      className="size-24 shrink-0"
    >
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        strokeWidth="8"
        className="stroke-border"
      />
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        pathLength="100"
        strokeDasharray={`${share} 100`}
        strokeLinecap="round"
        strokeWidth="8"
        transform="rotate(-90 50 50)"
        className={`${seconds <= 5 ? "stroke-error" : "stroke-answer-1"} ${MOVE}`}
      />
      <text
        x="50"
        y="50"
        fontSize="36"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-primary font-bold"
      >
        {seconds}
      </text>
    </svg>
  );
}

// Ten colours for twelve types, so related types share one: green has one
// correct answer, cyan places a mark. No red: here it means delete or error.
const KIND_COLORS: Record<LiveQuestionKind, TokenProps["color"]> = {
  poll: "blue",
  word_cloud: "teal",
  open_ended: "purple",
  scale: "orange",
  quiz: "green",
  number: "green",
  ranking: "pink",
  points: "yellow",
  grid: "cyan",
  pin: "cyan",
  form: "gray",
  qa: "default",
};

/** A question's type as a coloured badge; the label carries the meaning. */
export function LiveKindToken({
  kind,
}: {
  kind: LiveQuestionKind;
}): React.ReactElement {
  return (
    <Token label={LIVE_KIND_LABELS[kind]} color={KIND_COLORS[kind]} size="sm" />
  );
}

export function Swatch({ index }: { index: number }): React.ReactElement {
  return (
    <svg aria-hidden="true" className="size-4 shrink-0">
      <circle cx="50%" cy="50%" r="50%" className={FILLS[index]} />
    </svg>
  );
}

function CorrectMark(): React.ReactElement {
  return (
    <HStack gap={1} vAlign="center">
      <Check aria-hidden="true" size={16} />
      <Text size="sm" weight="semibold">
        Correct
      </Text>
    </HStack>
  );
}

function Columns({
  correctOption,
  counts,
  options,
}: ChoiceData): React.ReactElement {
  const highest = Math.max(...counts, 1);
  return (
    <HStack as="ol" gap={4} vAlign="start" hAlign="center" aria-label="Votes">
      {options.map((option, index) => {
        // Leaves room above the tallest column for its count.
        const share = Math.max((counts[index] / highest) * 84, 1);
        return (
          <VStack
            as="li"
            gap={2}
            hAlign="center"
            className="min-w-0 max-w-40 flex-1"
            key={`${index}-${option}`}
          >
            <svg
              role="img"
              aria-label={`${counts[index]} votes`}
              className="h-64 w-full"
            >
              <rect
                width="100%"
                height={`${share}%`}
                y={`${100 - share}%`}
                rx="4"
                className={`${FILLS[index]} ${MOVE}`}
              />
              <text
                x="50%"
                y={`${100 - share}%`}
                dy="-10"
                textAnchor="middle"
                className="fill-primary text-2xl font-bold"
              >
                {counts[index]}
              </text>
            </svg>
            <Text className="w-full text-center break-words">{option}</Text>
            {correctOption === index ? <CorrectMark /> : null}
          </VStack>
        );
      })}
    </HStack>
  );
}

/** The same chart on its side, for narrow screens and long answers. */
function Bars({
  correctOption,
  counts,
  options,
}: ChoiceData): React.ReactElement {
  const highest = Math.max(...counts, 1);
  return (
    <VStack as="ol" gap={4} aria-label="Votes">
      {options.map((option, index) => (
        <VStack as="li" gap={1} key={`${index}-${option}`}>
          <HStack gap={3} hAlign="between" vAlign="end">
            <HStack gap={2} vAlign="center" wrap="wrap" className="min-w-0">
              <Text className="min-w-0 break-words">{option}</Text>
              {correctOption === index ? <CorrectMark /> : null}
            </HStack>
            <Text size="xl" weight="bold">
              {counts[index]}
            </Text>
          </HStack>
          <svg aria-hidden="true" className="h-9 w-full">
            <rect
              width={`${Math.max((counts[index] / highest) * 100, 1)}%`}
              height="100%"
              rx="4"
              className={`${FILLS[index]} ${MOVE}`}
            />
          </svg>
        </VStack>
      ))}
    </VStack>
  );
}

/** Slides rows to their new place when their order changes. */
function useSlide(order: string): React.RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement>(null);
  const places = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const row of list.children) {
      if (!(row instanceof HTMLElement) || !row.dataset.row) continue;
      const before = places.current.get(row.dataset.row);
      next.set(row.dataset.row, row.offsetTop);
      if (!reduced && before !== undefined && before !== row.offsetTop) {
        row.animate(
          [
            { transform: `translateY(${before - row.offsetTop}px)` },
            { transform: "none" },
          ],
          { duration: 500, easing: "ease" },
        );
      }
    }
    places.current = next;
  }, [order]);

  return ref;
}

/** Thick bars, best first. A row keeps its colour wherever it lands. */
export function RankedBars({
  label,
  max,
  rows,
}: {
  label: string;
  max: number;
  rows: {
    color: number;
    name: string;
    place?: string;
    value: number;
    valueLabel: string;
  }[];
}): React.ReactElement {
  const ref = useSlide(rows.map((row) => row.color).join());
  return (
    <VStack as="ol" ref={ref} gap={4} aria-label={label}>
      {rows.map((row) => (
        <VStack as="li" gap={1} key={row.color} data-row={String(row.color)}>
          <HStack gap={3} hAlign="between" vAlign="end">
            <HStack gap={2} vAlign="end" className="min-w-0">
              {row.place ? (
                <Text size="lg" weight="bold">
                  {row.place}
                </Text>
              ) : null}
              <Text size="lg" className="min-w-0 break-words">
                {row.name}
              </Text>
            </HStack>
            <Text type="supporting" className="shrink-0">
              {row.valueLabel}
            </Text>
          </HStack>
          <svg aria-hidden="true" className="h-9 w-full">
            <rect
              width={`${Math.max((row.value / max) * 100, 1)}%`}
              height="100%"
              rx="4"
              className={`${FILLS[row.color]} ${MOVE}`}
            />
          </svg>
        </VStack>
      ))}
    </VStack>
  );
}

function Legend({
  correctOption,
  counts,
  options,
}: ChoiceData): React.ReactElement {
  const total = counts.reduce((sum, count) => sum + count, 0);
  return (
    <VStack as="ol" gap={3} aria-label="Votes" className="min-w-0">
      {options.map((option, index) => (
        <HStack as="li" gap={3} vAlign="center" key={`${index}-${option}`}>
          <Swatch index={index} />
          <VStack gap={0} className="min-w-0">
            <Text className="break-words">{option}</Text>
            <HStack gap={2} vAlign="center">
              <Text type="supporting">
                {counts[index]} (
                {total === 0 ? 0 : Math.round((counts[index] / total) * 100)}%)
              </Text>
              {correctOption === index ? <CorrectMark /> : null}
            </HStack>
          </VStack>
        </HStack>
      ))}
    </VStack>
  );
}

function Round({
  hole,
  ...data
}: ChoiceData & { hole: boolean }): React.ReactElement {
  const total = data.counts.reduce((sum, count) => sum + count, 0);
  return (
    <HStack
      gap={6}
      vAlign="center"
      hAlign="center"
      className="flex-col sm:flex-row"
    >
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="w-full max-w-72 shrink-0"
      >
        <g transform="rotate(-90 100 100)" fill="none">
          {data.counts.map((count, index) => {
            const before = data.counts
              .slice(0, index)
              .reduce((sum, earlier) => sum + earlier, 0);
            const share = total === 0 ? 0 : (count / total) * 100;
            // A thin gap keeps neighbours apart without relying on colour.
            const visible = share === 100 ? 100 : Math.max(0, share - 0.8);
            return (
              <circle
                key={index}
                cx="100"
                cy="100"
                r={hole ? 80 : 50}
                pathLength="100"
                strokeWidth={hole ? 38 : 100}
                strokeDasharray={`${visible} 100`}
                strokeDashoffset={total === 0 ? 0 : -(before / total) * 100}
                className={`${STROKES[index]} ${MOVE}`}
              />
            );
          })}
        </g>
      </svg>
      <Legend {...data} />
    </HStack>
  );
}

function Dots({
  correctOption,
  counts,
  options,
}: ChoiceData): React.ReactElement {
  const perDot = Math.max(1, Math.ceil(Math.max(...counts) / DOT_LIMIT));
  return (
    <VStack gap={4}>
      <VStack as="ol" gap={4} aria-label="Votes">
        {options.map((option, index) => (
          <VStack as="li" gap={2} key={`${index}-${option}`}>
            <HStack gap={2} vAlign="center" wrap="wrap">
              <Text weight="bold">{counts[index]}</Text>
              <Text className="min-w-0 break-words">{option}</Text>
              {correctOption === index ? <CorrectMark /> : null}
            </HStack>
            <HStack gap={1} wrap="wrap" aria-hidden="true">
              {Array.from(
                { length: Math.ceil(counts[index] / perDot) },
                (_, dot) => (
                  <Swatch key={dot} index={index} />
                ),
              )}
            </HStack>
          </VStack>
        ))}
      </VStack>
      {perDot > 1 ? (
        <Text type="supporting">Each dot is up to {perDot} answers.</Text>
      ) : null}
    </VStack>
  );
}

export function ChoiceChart({
  layout,
  ...data
}: ChoiceData & { layout: LiveLayout | null }): React.ReactElement {
  const isPhone = useMediaQuery("(max-width: 639px)");
  switch (layout) {
    case "donut":
    case "pie":
      return <Round {...data} hole={layout === "donut"} />;
    case "dots":
      return <Dots {...data} />;
    default: {
      const longest = Math.max(...data.options.map((option) => option.length));
      return isPhone || longest > 32 ? (
        <Bars {...data} />
      ) : (
        <Columns {...data} />
      );
    }
  }
}

interface TextBox {
  family: string;
  width: number;
}

/** The container's width and font, once it is on screen. */
function useTextBox(): {
  box: TextBox | null;
  ref: React.RefObject<HTMLElement | null>;
} {
  const ref = useRef<HTMLElement>(null);
  const [box, setBox] = useState<TextBox | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let isStopped = false;
    const read = (): void => {
      if (isStopped) return;
      setBox({
        family: getComputedStyle(element).fontFamily,
        width: Math.floor(element.clientWidth),
      });
    };
    const observer = new ResizeObserver(read);
    observer.observe(element);
    // Word widths change once the web font replaces the fallback.
    void document.fonts.ready.then(read);
    return () => {
      isStopped = true;
      observer.disconnect();
    };
  }, []);

  return { box, ref };
}

export function WordCloud({
  words,
}: {
  words: { text: string; count: number }[];
}): React.ReactElement {
  const { box, ref } = useTextBox();
  const cloud = useMemo(() => {
    if (!box) return null;
    const context = document.createElement("canvas").getContext("2d");
    if (!context) return null;
    return packWords(words, box.width, (text, size) => {
      context.font = `700 ${size}px ${box.family}`;
      return context.measureText(text).width;
    });
  }, [box, words]);

  return (
    <VStack ref={ref} className="w-full min-w-0">
      {cloud && box ? (
        <svg
          width={box.width}
          height={cloud.height}
          role="list"
          aria-label="Word cloud"
        >
          {cloud.words.map((word) => (
            <text
              key={word.text}
              role="listitem"
              aria-label={`${word.text}, ${word.count}`}
              transform={`translate(${word.x} ${word.y})`}
              fontSize={word.size}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-bold ${FILLS[answerColor(word.text)]} ${MOVE}`}
            >
              <title>{`${word.text}: ${word.count}`}</title>
              {word.text}
            </text>
          ))}
        </svg>
      ) : null}
    </VStack>
  );
}

function Bubble({
  index,
  text,
}: {
  index: number;
  text: string;
}): React.ReactElement {
  return (
    <VStack
      as="li"
      className={`mb-4 break-inside-avoid rounded-2xl rounded-bl-none p-4 ${TINTS[index % TINTS.length]}`}
    >
      <Text size="lg" className="break-words">
        {text}
      </Text>
    </VStack>
  );
}

/** Newest first. Counting from the oldest keeps each answer's colour. */
export function SpeechBubbles({
  texts,
  total,
}: {
  texts: string[];
  total: number;
}): React.ReactElement {
  return (
    <VStack
      as="ul"
      gap={0}
      aria-label="Answers"
      className="block! columns-1 gap-4 sm:columns-2 xl:columns-3"
    >
      {texts.map((text, index) => (
        <Bubble key={total - index} index={total - index} text={text} />
      ))}
    </VStack>
  );
}

/** Oldest first, scrolling to each new answer unless someone is reading. */
export function FlowingGrid({
  texts,
  total,
}: {
  texts: string[];
  total: number;
}): React.ReactElement {
  const ref = useRef<HTMLElement>(null);
  const isReading = useRef(false);

  useEffect(() => {
    const list = ref.current;
    if (!list || isReading.current) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({
      top: list.scrollHeight,
      behavior: reduced ? "auto" : "smooth",
    });
  }, [total]);

  const first = total - texts.length + 1;
  return (
    <VStack
      ref={ref}
      as="ul"
      gap={0}
      aria-label="Answers"
      tabIndex={0}
      className="grid! max-h-96 grid-cols-1 items-start gap-x-4 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3"
      // Only a person's own scrolling counts; the smooth scroll fires onScroll too.
      onWheel={(event: React.WheelEvent<HTMLElement>) => {
        const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
        isReading.current =
          event.deltaY < 0 || scrollHeight - scrollTop - clientHeight > 120;
      }}
      onTouchMove={() => {
        isReading.current = true;
      }}
      onFocus={() => {
        isReading.current = true;
      }}
      onBlur={() => {
        isReading.current = false;
      }}
    >
      {[...texts].reverse().map((text, index) => (
        <Bubble key={first + index} index={first + index} text={text} />
      ))}
    </VStack>
  );
}

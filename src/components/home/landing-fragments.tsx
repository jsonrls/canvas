import { Avatar } from "@astryxdesign/core/Avatar";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { VStack } from "@astryxdesign/core/VStack";

import { RankedBars } from "@/components/collaboration/live/live-charts";
import { Check, MousePointer2, StickyNote } from "@/components/ui/icons";

/*
 * Illustrative pieces of a study room for the landing page. They mirror the
 * product's real tools and carry sample content; none of them is interactive.
 */

export function NamedCursor({
  name,
  className,
}: {
  name: string;
  className: string;
}): React.ReactElement {
  return (
    <HStack
      data-drift=""
      aria-hidden="true"
      gap={1}
      vAlign="center"
      className={`absolute ${className}`}
    >
      <MousePointer2 size={16} />
      <Text className="rounded-full bg-accent-bg px-2 py-0.5 text-on-accent!">
        {name}
      </Text>
    </HStack>
  );
}

/** `isBrief` keeps the first paragraph only, for small cards. */
export function NotesFragment({
  isBrief = false,
}: {
  isBrief?: boolean;
}): React.ReactElement {
  return (
    <VStack gap={3} className="relative p-5">
      <Heading level={3} className="landing-h3">
        The printing press
      </Heading>
      <Text as="p" className="leading-relaxed">
        Gutenberg printed in Mainz.{" "}
        <Text className="rounded-sm bg-yellow-subtle">
          Movable type made copying fast.
        </Text>
      </Text>
      {isBrief ? null : (
        <>
          <Text as="p" className="leading-relaxed">
            Cheaper books spread arguments, not only scripture.
          </Text>
          <Text as="p" className="leading-relaxed">
            Woodblocks and movable type came earlier in East Asia.
          </Text>
        </>
      )}
      <HStack gap={2} vAlign="start" className="rounded-xl bg-muted p-3">
        <Avatar name="Lea Tan" size="sm" tooltip={false} />
        <VStack gap={0}>
          <Text weight="semibold">Lea</Text>
          <Text>Did it cause the Reformation? Adding this for Thursday.</Text>
        </VStack>
      </HStack>
      <NamedCursor name="Ana" className="top-24 right-4" />
    </VStack>
  );
}

export function PdfFragment(): React.ReactElement {
  return (
    <VStack gap={3} className="relative p-5">
      <Text weight="semibold">Chapter 6: Print and protest</Text>
      <Text as="p" className="leading-relaxed">
        <Text className="rounded-sm bg-yellow-subtle">
          Luther’s theses were reprinted across German cities.
        </Text>{" "}
        Printers, as much as couriers, carried the argument.
      </Text>
      <HStack gap={2} vAlign="start" className="rounded-xl bg-muted p-3">
        <Avatar name="Lea Tan" size="sm" tooltip={false} />
        <VStack gap={0}>
          <Text weight="semibold">Lea, page 12</Text>
          <Text>Can someone find a second source for this?</Text>
        </VStack>
      </HStack>
      <HStack
        gap={2}
        vAlign="center"
        className="self-start rounded-lg bg-yellow-subtle px-3 py-1"
      >
        <StickyNote size={16} />
        <Text weight="medium">Use in the essay</Text>
      </HStack>
    </VStack>
  );
}

const SKETCH_NODES = [
  { label: "Movable type", x: 16, y: 24, width: 176 },
  { label: "Books", x: 268, y: 24, width: 96 },
  { label: "More readers", x: 232, y: 124, width: 150 },
  { label: "New ideas", x: 24, y: 124, width: 130 },
];

export function WhiteboardFragment(): React.ReactElement {
  return (
    <VStack gap={2} className="p-5">
      <HStack gap={2} vAlign="center">
        <Avatar name="Ana Reyes" size="sm" tooltip={false} />
        <Text weight="medium">Ana is presenting</Text>
      </HStack>
      <svg
        viewBox="0 0 400 200"
        role="img"
        aria-label="Sample whiteboard diagram: movable type leads to books, more readers and new ideas."
        className="h-auto w-full"
      >
        {SKETCH_NODES.map(({ label, x, y, width }) => (
          <g key={label}>
            <rect
              x={x}
              y={y}
              width={width}
              height={44}
              rx={22}
              className="fill-accent-muted stroke-accent-bg"
              strokeWidth={1.5}
            />
            <text
              x={x + width / 2}
              y={y + 27}
              textAnchor="middle"
              fontSize={15}
              className="fill-primary"
            >
              {label}
            </text>
          </g>
        ))}
        <g className="fill-none stroke-primary" strokeWidth={2}>
          <path d="M198 46 H262 M254 40 L262 46 L254 52" />
          <path d="M316 70 V118 M310 110 L316 118 L322 110" />
          <path d="M230 146 H160 M168 140 L160 146 L168 152" />
        </g>
        <circle data-drift="" cx={300} cy={174} r={6} className="fill-error" />
      </svg>
    </VStack>
  );
}

/** A spoken question written on the board, and the answer drawn beside it. */
export function BoardAnswerFragment(): React.ReactElement {
  return (
    <VStack gap={2} className="p-5">
      <svg
        viewBox="0 0 400 150"
        role="img"
        aria-label="Sample whiteboard: the question “When was the Gutenberg Bible printed?” leads to the answer “About 1455”."
        className="h-auto w-full"
      >
        <g className="fill-none stroke-primary" strokeWidth={2}>
          <ellipse cx={100} cy={75} rx={94} ry={58} />
          <path d="M202 75 H252 M244 69 L252 75 L244 81" />
        </g>
        <ellipse
          cx={328}
          cy={75}
          rx={68}
          ry={48}
          className="fill-accent-muted stroke-accent-bg"
          strokeWidth={2}
        />
        <g textAnchor="middle" fontSize={15} className="fill-primary">
          <text x={100} y={58}>
            When was the
          </text>
          <text x={100} y={80}>
            Gutenberg Bible
          </text>
          <text x={100} y={102}>
            printed?
          </text>
          <text x={328} y={80} fontWeight={600}>
            About 1455
          </text>
        </g>
      </svg>
      <HStack gap={2} vAlign="center" className="rounded-xl bg-muted p-3">
        <StatusDot variant="error" label="Microphone" isPulsing />
        <VStack gap={0} className="min-w-0">
          <Text weight="semibold">Listening… 0:04 of 1:00</Text>
          <Text>Your voice stays on this device.</Text>
        </VStack>
      </HStack>
    </VStack>
  );
}

const POLL_ROWS = [
  { color: 0, name: "Cheaper books", value: 6, valueLabel: "6 votes" },
  { color: 1, name: "More readers", value: 4, valueLabel: "4 votes" },
  { color: 2, name: "Faster news", value: 2, valueLabel: "2 votes" },
];

export function PollFragment(): React.ReactElement {
  return (
    <VStack gap={3} className="p-5">
      <Text weight="semibold">What did printing change most?</Text>
      <RankedBars label="Sample poll" max={6} rows={POLL_ROWS} />
    </VStack>
  );
}

const QUIZ_CHOICES = ["Venice", "Mainz", "Paris", "Basel"];

export function QuizFragment(): React.ReactElement {
  return (
    <VStack gap={2} className="p-5">
      <Text weight="semibold">Where was Gutenberg printing by about 1450?</Text>
      {QUIZ_CHOICES.map((choice, index) => (
        <HStack
          key={choice}
          gap={3}
          vAlign="center"
          className={`rounded-xl px-3 py-2 ${
            choice === "Mainz" ? "bg-accent-muted" : "bg-muted"
          }`}
        >
          <Text weight="semibold">{"ABCD"[index]}</Text>
          <Text>{choice}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

const SUMMARY_POINTS = [
  "Gutenberg was printing in Mainz by about 1450.",
  "Movable type made each page faster to copy.",
  "Cheaper books spread arguments, not only scripture.",
];

export function SummaryFragment(): React.ReactElement {
  return (
    <VStack gap={2} className="p-5">
      <Text weight="semibold">Summary: the printing press</Text>
      {SUMMARY_POINTS.map((point) => (
        <HStack key={point} gap={2} vAlign="start">
          <Check
            size={16}
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-accent"
          />
          <Text>{point}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

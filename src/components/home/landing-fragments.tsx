import { Avatar } from "@astryxdesign/core/Avatar";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

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
        Heart failure medications
      </Heading>
      <Text as="p" className="leading-relaxed">
        ACE inhibitors lower afterload.{" "}
        <Text className="rounded-sm bg-yellow-subtle">
          Watch for a dry cough and high potassium.
        </Text>
      </Text>
      {isBrief ? null : (
        <>
          <Text as="p" className="leading-relaxed">
            Loop diuretics move fluid fast, so monitor potassium and daily
            weight.
          </Text>
          <Text as="p" className="leading-relaxed">
            Digoxin: count the apical pulse for a full minute before each dose.
          </Text>
        </>
      )}
      <HStack gap={2} vAlign="start" className="rounded-xl bg-muted p-3">
        <Avatar name="Lea Tan" size="sm" tooltip={false} />
        <VStack gap={0}>
          <Text weight="semibold">Lea</Text>
          <Text>When do we hold a dose? Adding this for Thursday.</Text>
        </VStack>
      </HStack>
      <NamedCursor name="Ana" className="top-24 right-4" />
    </VStack>
  );
}

export function PdfFragment(): React.ReactElement {
  return (
    <VStack gap={3} className="relative p-5">
      <Text weight="semibold">Chapter 6: Cardiac output</Text>
      <Text as="p" className="leading-relaxed">
        <Text className="rounded-sm bg-yellow-subtle">
          Cardiac output is heart rate multiplied by stroke volume.
        </Text>{" "}
        When either falls, the body compensates through the other.
      </Text>
      <HStack gap={2} vAlign="start" className="rounded-xl bg-muted p-3">
        <Avatar name="Lea Tan" size="sm" tooltip={false} />
        <VStack gap={0}>
          <Text weight="semibold">Lea, page 12</Text>
          <Text>Can someone explain afterload in plain words?</Text>
        </VStack>
      </HStack>
      <HStack
        gap={2}
        vAlign="center"
        className="self-start rounded-lg bg-yellow-subtle px-3 py-1"
      >
        <StickyNote size={16} />
        <Text weight="medium">On the quiz</Text>
      </HStack>
    </VStack>
  );
}

const SKETCH_NODES = [
  { label: "Low blood pressure", x: 16, y: 24, width: 176 },
  { label: "Renin", x: 268, y: 24, width: 96 },
  { label: "Angiotensin II", x: 232, y: 124, width: 150 },
  { label: "Aldosterone", x: 24, y: 124, width: 130 },
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
        aria-label="Sample whiteboard diagram: low blood pressure leads to renin, angiotensin II and aldosterone."
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

const QUIZ_CHOICES = ["Sodium", "Potassium", "Calcium", "Glucose"];

export function QuizFragment(): React.ReactElement {
  return (
    <VStack gap={2} className="p-5">
      <Text weight="semibold">
        Which electrolyte do loop diuretics tend to lower?
      </Text>
      {QUIZ_CHOICES.map((choice, index) => (
        <HStack
          key={choice}
          gap={3}
          vAlign="center"
          className={`rounded-xl px-3 py-2 ${
            choice === "Potassium" ? "bg-accent-muted" : "bg-muted"
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
  "ACE inhibitors lower afterload. Watch potassium.",
  "Loop diuretics move fluid fast. Weigh daily.",
  "Count the apical pulse before each digoxin dose.",
];

export function SummaryFragment(): React.ReactElement {
  return (
    <VStack gap={2} className="p-5">
      <Text weight="semibold">Summary: heart failure medications</Text>
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

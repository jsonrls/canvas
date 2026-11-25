import {
  ArrowRight,
  Circle,
  type IconNode,
  MousePointer2,
  Pencil,
  Square,
  Type,
} from "lucide";
import { createElement } from "react";

import type { LiveQuestionKind } from "@/lib/live/activities";

/*
 * Flat vector illustrations for the landing page. The content is made up;
 * each one shows what the real tool does. Colours come from the theme.
 */

const ART = "block h-auto w-full";
const POINTER = "M0 0v22l6-6 4 10 4-2-4-9h8z";
const SPARKLE = "M0-10Q1.5-1.5 10 0 1.5 1.5 0 10-1.5 1.5-10 0-1.5-1.5 0-10z";

/** One of the app's own toolbar icons, drawn inside an illustration. */
function Glyph({
  node,
  x,
  y,
  className,
}: {
  node: IconNode;
  x: number;
  y: number;
  className: string;
}): React.ReactElement {
  return (
    <g
      transform={`translate(${x} ${y}) scale(0.75)`}
      className={`fill-none ${className}`}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {node.map(([tag, attrs], index) =>
        createElement(tag, { ...attrs, key: index }),
      )}
    </g>
  );
}

/** A named pointer, as other people appear in a room. */
function Pointer({
  name,
  x,
  y,
  width,
  className,
}: {
  name: string;
  x: number;
  y: number;
  width: number;
  className: string;
}): React.ReactElement {
  return (
    <g transform={`translate(${x} ${y})`} className={className}>
      <path d={POINTER} className="stroke-surface" strokeWidth={2} />
      <rect x={14} y={22} width={width} height={22} rx={11} />
      <text
        x={14 + width / 2}
        y={37}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        className="fill-surface"
      >
        {name}
      </text>
    </g>
  );
}

const PAGE_LINES = [
  { y: 108, width: 184 },
  { y: 128, width: 160 },
  { y: 148, width: 184 },
  { y: 168, width: 112 },
  { y: 222, width: 184 },
  { y: 242, width: 172 },
  { y: 262, width: 140 },
];

export function PdfArt(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="Illustration of a shared PDF page with two highlights, an underline, a sticky note, a bookmark and a comment from another person."
      className={ART}
    >
      <rect width={560} height={380} className="fill-accent-muted" />
      <circle cx={470} cy={70} r={90} className="fill-accent-bg/10" />
      <circle cx={70} cy={340} r={70} className="fill-accent-bg/10" />

      <rect
        x={164}
        y={36}
        width={232}
        height={364}
        rx={16}
        className="fill-surface"
      />
      <path d="M344 36h26v44l-13-10-13 10z" className="fill-accent-bg" />
      <rect
        x={188}
        y={66}
        width={124}
        height={16}
        rx={8}
        className="fill-primary"
      />
      <rect
        x={182}
        y={121}
        width={172}
        height={22}
        rx={6}
        className="fill-answer-3/40"
      />
      <rect
        x={182}
        y={235}
        width={184}
        height={22}
        rx={6}
        className="fill-answer-2/30"
      />
      {PAGE_LINES.map(({ y, width }) => (
        <rect
          key={y}
          x={188}
          y={y}
          width={width}
          height={8}
          rx={4}
          className="fill-primary/20"
        />
      ))}
      <rect
        x={188}
        y={198}
        width={92}
        height={10}
        rx={5}
        className="fill-primary/70"
      />
      <rect
        x={188}
        y={276}
        width={140}
        height={4}
        rx={2}
        className="fill-answer-4"
      />
      <rect
        x={188}
        y={300}
        width={184}
        height={100}
        rx={10}
        className="fill-accent-muted"
      />
      <path
        d="M204 360l36-22 30 12 40-34 46 18"
        className="fill-none stroke-accent-bg"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={310} cy={316} r={7} className="fill-answer-4" />

      <g transform="translate(354 134) rotate(218) translate(-10 0)">
        <path d="M0 0h20l-4 22h-12z" className="fill-answer-3" />
        <rect x={-2} y={22} width={24} height={12} className="fill-primary" />
        <rect
          x={-2}
          y={34}
          width={24}
          height={70}
          rx={8}
          className="fill-accent-bg"
        />
      </g>

      <g transform="translate(404 168) rotate(7)">
        <rect width={96} height={96} rx={8} className="fill-answer-3" />
        <path d="M96 66v22a8 8 0 0 1-8 8h-22z" className="fill-primary/20" />
        <rect
          x={16}
          y={22}
          width={64}
          height={7}
          rx={3.5}
          className="fill-surface"
        />
        <rect
          x={16}
          y={39}
          width={52}
          height={7}
          rx={3.5}
          className="fill-surface"
        />
        <rect
          x={16}
          y={56}
          width={34}
          height={7}
          rx={3.5}
          className="fill-surface"
        />
      </g>

      <path d="M150 268l34-16v32z" className="fill-primary" />
      <rect
        x={36}
        y={228}
        width={136}
        height={80}
        rx={18}
        className="fill-primary"
      />
      <circle cx={66} cy={258} r={15} className="fill-answer-4" />
      <text
        x={66}
        y={263}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        className="fill-surface"
      >
        L
      </text>
      <rect
        x={90}
        y={248}
        width={62}
        height={7}
        rx={3.5}
        className="fill-surface"
      />
      <rect
        x={90}
        y={263}
        width={44}
        height={7}
        rx={3.5}
        className="fill-surface/60"
      />
      <rect
        x={52}
        y={284}
        width={84}
        height={7}
        rx={3.5}
        className="fill-surface/60"
      />

      <Pointer
        name="Marco"
        x={366}
        y={250}
        width={54}
        className="fill-answer-2"
      />
    </svg>
  );
}

const BOARD_TOOLS = [MousePointer2, Pencil, Square, Circle, ArrowRight, Type];
const BOARD_DOTS = Array.from({ length: 60 }, (_, index) => ({
  x: 76 + (index % 12) * 37,
  y: 96 + Math.floor(index / 12) * 50,
}));

export function BoardArt(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="Illustration of a shared whiteboard: a diagram of the water cycle with arrows, a marker, a laser pointer and another person’s cursor."
      className={ART}
    >
      <rect width={560} height={380} className="fill-accent-muted" />
      <circle cx={84} cy={60} r={84} className="fill-accent-bg/10" />
      <rect
        x={40}
        y={52}
        width={480}
        height={348}
        rx={22}
        className="fill-surface"
      />
      {BOARD_DOTS.map(({ x, y }) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={1.6}
          className="fill-primary/15"
        />
      ))}

      <rect
        x={170}
        y={32}
        width={220}
        height={40}
        rx={20}
        className="fill-primary"
      />
      <rect
        x={178}
        y={38}
        width={30}
        height={28}
        rx={14}
        className="fill-accent-bg"
      />
      {BOARD_TOOLS.map((node, index) => (
        <Glyph
          key={index}
          node={node}
          x={184 + index * 34}
          y={43}
          className="stroke-surface"
        />
      ))}

      <g
        className="fill-none stroke-primary"
        strokeWidth={4}
        strokeLinecap="round"
      >
        <path d="M172 136h52" />
        <path d="M352 168l38 46" />
        <path d="M344 262h-58" />
        <path d="M150 232l-22-40" strokeDasharray="2 10" />
      </g>
      <g className="fill-primary">
        <path d="M236 136l-14-8v16z" />
        <path d="M398 224l-2-16-12 10z" />
        <path d="M274 262l14-8v16z" />
        <path d="M122 182l1 16 13-8z" />
      </g>

      <circle cx={122} cy={136} r={42} className="fill-answer-3" />
      <rect
        x={240}
        y={106}
        width={136}
        height={60}
        rx={14}
        className="fill-accent-bg"
      />
      <rect
        x={348}
        y={232}
        width={124}
        height={60}
        rx={30}
        className="fill-answer-5"
      />
      <ellipse cx={206} cy={262} rx={72} ry={34} className="fill-answer-2" />
      <g textAnchor="middle" fontSize={15} fontWeight={700}>
        <text x={122} y={141} className="fill-primary">
          Sun
        </text>
        <g className="fill-surface">
          <text x={308} y={141}>
            Evaporation
          </text>
          <text x={410} y={267}>
            Cloud
          </text>
          <text x={206} y={267}>
            Rain
          </text>
        </g>
      </g>

      <path
        d="M96 330q14-12 28 0t28 0 28 0 28 0"
        className="fill-none stroke-answer-4"
        strokeWidth={5}
        strokeLinecap="round"
      />
      <g transform="translate(214 322) rotate(-52)">
        <path d="M0 0l10-8 10 8v10h-20z" className="fill-answer-4" />
        <rect y={10} width={20} height={10} className="fill-surface/70" />
        <rect y={18} width={20} height={64} rx={7} className="fill-primary" />
      </g>

      <circle cx={420} cy={150} r={5} className="fill-error/25" />
      <circle cx={436} cy={162} r={7} className="fill-error/45" />
      <circle cx={456} cy={172} r={18} className="fill-error/20" />
      <circle cx={456} cy={172} r={9} className="fill-error" />

      <Pointer
        name="Ana"
        x={440}
        y={300}
        width={44}
        className="fill-accent-bg"
      />
    </svg>
  );
}

const ANSWER_POINTS = [
  { y: 268, width: 116 },
  { y: 290, width: 96 },
  { y: 312, width: 108 },
];

export function AskArt(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="Illustration of asking the whiteboard by voice: a microphone, the question “Why is the sky blue?”, and a circle where the AI writes a short answer."
      className={ART}
    >
      <rect width={560} height={380} className="fill-surface" />
      <circle cx={96} cy={236} r={112} className="fill-accent-muted" />

      <g
        className="fill-none stroke-accent-bg"
        strokeWidth={5}
        strokeLinecap="round"
      >
        <path d="M150 196a52 52 0 0 1 0 76" opacity={0.7} />
        <path d="M168 176a80 80 0 0 1 0 116" opacity={0.35} />
      </g>
      <rect
        x={66}
        y={164}
        width={60}
        height={104}
        rx={30}
        className="fill-accent-bg"
      />
      <g className="fill-surface/40">
        <rect x={82} y={190} width={28} height={5} rx={2.5} />
        <rect x={82} y={204} width={28} height={5} rx={2.5} />
        <rect x={82} y={218} width={28} height={5} rx={2.5} />
      </g>
      <path
        d="M48 232a48 48 0 0 0 96 0M96 280v30M70 312h52"
        className="fill-none stroke-primary"
        strokeWidth={7}
        strokeLinecap="round"
      />

      <path d="M150 112l-22 36 46-30z" className="fill-primary" />
      <rect
        x={112}
        y={44}
        width={216}
        height={76}
        rx={26}
        className="fill-primary"
      />
      <text
        x={220}
        y={88}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        className="fill-surface"
      >
        Why is the sky blue?
      </text>

      <path
        d="M336 98q46 6 66 38"
        className="fill-none stroke-primary"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="2 10"
      />
      <path d="M410 150l-16-4 10-12z" className="fill-primary" />
      <path
        d={SPARKLE}
        transform="translate(372 62) scale(1.5)"
        className="fill-answer-3"
      />
      <path
        d={SPARKLE}
        transform="translate(404 36) scale(0.8)"
        className="fill-answer-3"
      />
      <path
        d={SPARKLE}
        transform="translate(520 132) scale(1.1)"
        className="fill-answer-5"
      />

      <circle cx={410} cy={254} r={112} className="fill-accent-muted" />
      <circle
        cx={410}
        cy={254}
        r={112}
        className="fill-none stroke-accent-bg"
        strokeWidth={5}
      />
      <g fontSize={16} fontWeight={700} className="fill-answer-5">
        <text x={338} y={214}>
          Air scatters blue
        </text>
        <text x={338} y={236}>
          light the most.
        </text>
      </g>
      {ANSWER_POINTS.map(({ y, width }) => (
        <g key={y}>
          <circle cx={343} cy={y} r={4} className="fill-answer-5" />
          <rect
            x={356}
            y={y - 4}
            width={width}
            height={8}
            rx={4}
            className="fill-answer-5/35"
          />
        </g>
      ))}

      <rect
        x={36}
        y={326}
        width={150}
        height={36}
        rx={18}
        className="fill-primary"
      />
      <circle cx={58} cy={344} r={10} className="fill-error/35" />
      <circle cx={58} cy={344} r={5} className="fill-error" />
      <text
        x={76}
        y={349}
        fontSize={13}
        fontWeight={600}
        className="fill-surface"
      >
        Listening… 0:04
      </text>
    </svg>
  );
}

/*
 * Motion inside the small drawings. A parent `group` carrying `data-reveal`
 * holds each part at its start until the tile scrolls into view; without
 * JavaScript or with reduced motion the parts simply rest in place.
 */
const MOVE = "transform-fill transition duration-700 ease-out";
const GROW = `${MOVE} origin-bottom group-data-[reveal=hidden]:scale-y-0`;
const WIDEN = `${MOVE} origin-left group-data-[reveal=hidden]:scale-x-0`;
const POP = `${MOVE} origin-center group-data-[reveal=hidden]:scale-0`;
const RISE = `${MOVE} group-data-[reveal=hidden]:translate-y-3 group-data-[reveal=hidden]:opacity-0`;
const DROP = `${MOVE} group-data-[reveal=hidden]:-translate-y-6 group-data-[reveal=hidden]:opacity-0`;
const WAIT = [
  "delay-0",
  "delay-100",
  "delay-200",
  "delay-300",
  "delay-400",
  "delay-500",
  "delay-600",
];

const POLL_BARS = [
  { x: 24, height: 22, fill: "fill-answer-2" },
  { x: 43, height: 44, fill: "fill-answer-1" },
  { x: 62, height: 32, fill: "fill-answer-3" },
  { x: 81, height: 16, fill: "fill-answer-4" },
];
const CLOUD_WORDS = [
  { x: 47, y: 31, width: 56, height: 17, fill: "fill-primary" },
  { x: 26, y: 15, width: 40, height: 11, fill: "fill-answer-1" },
  { x: 14, y: 34, width: 28, height: 10, fill: "fill-answer-4" },
  { x: 24, y: 54, width: 38, height: 10, fill: "fill-answer-2" },
  { x: 72, y: 17, width: 26, height: 8, fill: "fill-answer-3" },
  { x: 68, y: 55, width: 26, height: 8, fill: "fill-answer-5" },
];
const QUIZ_ROWS = [
  { y: 12, line: 30, isRight: false },
  { y: 32.5, line: 34, isRight: true },
  { y: 53, line: 24, isRight: false },
];
const RANK_ROWS = [
  { y: 20, width: 64, dot: "fill-answer-3", bar: "fill-answer-1" },
  { y: 40, width: 46, dot: "fill-primary/45", bar: "fill-answer-1/65" },
  { y: 60, width: 30, dot: "fill-answer-4", bar: "fill-answer-1/40" },
];
const POINT_PARTS = [
  { x: 16, width: 42, fill: "fill-answer-1" },
  { x: 61, width: 25, fill: "fill-answer-2" },
  { x: 89, width: 15, fill: "fill-answer-3" },
];
const GRID_DOTS = [
  { x: 36, y: 25, r: 6, fill: "fill-answer-1" },
  { x: 84, y: 22, r: 8, fill: "fill-answer-4" },
  { x: 72, y: 31, r: 5, fill: "fill-answer-5" },
  { x: 80, y: 57, r: 5, fill: "fill-answer-2" },
  { x: 34, y: 56, r: 7, fill: "fill-answer-3" },
];
const HISTOGRAM = [10, 20, 34, 44, 30, 16, 8];
const FORM_FIELDS = [
  { y: 11, line: 34 },
  { y: 32, line: 22 },
];

/** One small picture per live question type; the type guarantees all are drawn. */
const KIND_ART: Record<LiveQuestionKind, React.ReactElement> = {
  poll: (
    <>
      <rect
        x={18}
        y={66}
        width={84}
        height={3}
        rx={1.5}
        className="fill-primary/20"
      />
      {POLL_BARS.map(({ x, height, fill }, index) => (
        <rect
          key={x}
          x={x}
          y={66 - height}
          width={15}
          height={height}
          rx={4}
          className={`${fill} ${GROW} ${WAIT[index]}`}
        />
      ))}
    </>
  ),
  word_cloud: (
    <>
      {CLOUD_WORDS.map(({ x, y, width, height, fill }, index) => (
        <rect
          key={fill}
          x={x}
          y={y}
          width={width}
          height={height}
          rx={height / 2}
          className={`${fill} ${POP} ${WAIT[index]}`}
        />
      ))}
    </>
  ),
  open_ended: (
    <>
      <g className={POP}>
        <path d="M26 36v10l10-10z" className="fill-surface" />
        <rect
          x={16}
          y={12}
          width={60}
          height={26}
          rx={10}
          className="fill-surface"
        />
        <rect
          x={26}
          y={20}
          width={40}
          height={4}
          rx={2}
          className="fill-primary/30"
        />
        <rect
          x={26}
          y={28}
          width={26}
          height={4}
          rx={2}
          className="fill-primary/30"
        />
      </g>
      <g className={`${POP} ${WAIT[3]}`}>
        <path d="M94 66v8l-10-8z" className="fill-answer-1" />
        <rect
          x={44}
          y={44}
          width={60}
          height={24}
          rx={10}
          className="fill-answer-1"
        />
        <rect
          x={54}
          y={51}
          width={40}
          height={4}
          rx={2}
          className="fill-surface"
        />
        <rect
          x={54}
          y={59}
          width={22}
          height={4}
          rx={2}
          className="fill-surface/70"
        />
      </g>
    </>
  ),
  scale: (
    <>
      <rect
        x={18}
        y={38}
        width={84}
        height={4}
        rx={2}
        className="fill-primary/20"
      />
      <circle cx={102} cy={40} r={5} className="fill-surface" />
      <rect
        x={18}
        y={38}
        width={63}
        height={4}
        rx={2}
        className={`fill-answer-1 ${WIDEN}`}
      />
      {[18, 39, 60].map((x, index) => (
        <circle
          key={x}
          cx={x}
          cy={40}
          r={5}
          className={`fill-answer-1 ${POP} ${WAIT[index + 1]}`}
        />
      ))}
      <g className={`${POP} ${WAIT[4]}`}>
        <circle cx={81} cy={40} r={11} className="fill-answer-1" />
        <circle cx={81} cy={40} r={4.5} className="fill-surface" />
      </g>
      <rect
        x={14}
        y={58}
        width={18}
        height={4}
        rx={2}
        className="fill-primary/25"
      />
      <rect
        x={88}
        y={58}
        width={18}
        height={4}
        rx={2}
        className="fill-primary/25"
      />
    </>
  ),
  quiz: (
    <>
      {QUIZ_ROWS.map(({ y, line, isRight }, index) => (
        <g key={y} className={`${RISE} ${WAIT[index]}`}>
          <rect
            x={16}
            y={y}
            width={62}
            height={15}
            rx={7.5}
            className={isRight ? "fill-answer-2" : "fill-surface"}
          />
          <rect
            x={24}
            y={y + 5.5}
            width={line}
            height={4}
            rx={2}
            className={isRight ? "fill-surface" : "fill-primary/30"}
          />
        </g>
      ))}
      <path
        d="M64 40l3 3 6-6"
        className={`fill-none stroke-surface ${POP} ${WAIT[5]}`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className={`${POP} ${WAIT[3]}`}>
        <circle cx={96} cy={26} r={12} className="fill-answer-3" />
        <path
          d="M96 19v7l5 3"
          className="fill-none stroke-surface"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  ),
  ranking: (
    <>
      {RANK_ROWS.map(({ y, width, dot, bar }, index) => (
        <g key={y}>
          <circle
            cx={26}
            cy={y}
            r={8}
            className={`${dot} ${POP} ${WAIT[index * 2]}`}
          />
          <rect
            x={40}
            y={y - 5}
            width={width}
            height={10}
            rx={5}
            className={`${bar} ${WIDEN} ${WAIT[index * 2 + 1]}`}
          />
        </g>
      ))}
    </>
  ),
  points: (
    <>
      <text
        x={60}
        y={38}
        textAnchor="middle"
        fontSize={26}
        fontWeight={700}
        className={`fill-primary ${POP}`}
      >
        100
      </text>
      {POINT_PARTS.map(({ x, width, fill }, index) => (
        <rect
          key={x}
          x={x}
          y={50}
          width={width}
          height={14}
          rx={5}
          className={`${fill} ${WIDEN} ${WAIT[index * 2 + 1]}`}
        />
      ))}
    </>
  ),
  grid: (
    <>
      <rect
        x={59}
        y={10}
        width={2}
        height={60}
        rx={1}
        className="fill-primary/30"
      />
      <rect
        x={18}
        y={39}
        width={84}
        height={2}
        rx={1}
        className="fill-primary/30"
      />
      {GRID_DOTS.map(({ x, y, r, fill }, index) => (
        <circle
          key={fill}
          cx={x}
          cy={y}
          r={r}
          className={`${fill} ${POP} ${WAIT[index]}`}
        />
      ))}
    </>
  ),
  number: (
    <>
      {HISTOGRAM.map((height, index) => (
        <rect
          key={index}
          x={20 + index * 12}
          y={70 - height}
          width={9}
          height={height}
          rx={3}
          className={`${index === 3 ? "fill-answer-1" : "fill-answer-1/40"} ${GROW} ${WAIT[Math.abs(index - 3)]}`}
        />
      ))}
      <g className={`${POP} ${WAIT[5]}`}>
        <rect
          x={46.5}
          y={6}
          width={28}
          height={15}
          rx={7.5}
          className="fill-primary"
        />
        <text
          x={60.5}
          y={17}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          className="fill-surface"
        >
          42
        </text>
      </g>
    </>
  ),
  form: (
    <>
      {FORM_FIELDS.map(({ y, line }, index) => (
        <g key={y} className={`${WIDEN} ${WAIT[index * 2]}`}>
          <rect
            x={20}
            y={y}
            width={80}
            height={16}
            rx={6}
            className="fill-surface"
          />
          <rect
            x={27}
            y={y + 6}
            width={line}
            height={4}
            rx={2}
            className="fill-primary/30"
          />
        </g>
      ))}
      <g className={`${POP} ${WAIT[4]}`}>
        <rect
          x={20}
          y={54}
          width={42}
          height={16}
          rx={8}
          className="fill-answer-1"
        />
        <rect
          x={30}
          y={60}
          width={22}
          height={4}
          rx={2}
          className="fill-surface"
        />
      </g>
    </>
  ),
  pin: (
    <>
      <rect
        x={16}
        y={10}
        width={88}
        height={60}
        rx={10}
        className="fill-surface"
      />
      <circle cx={86} cy={26} r={7} className={`fill-answer-3 ${POP}`} />
      <path d="M22 66l22-27 13 14 11-9 30 22z" className="fill-answer-2/50" />
      <g className={`${DROP} ${WAIT[2]}`}>
        <path
          d="M58 52c-7-9-10-13-10-18a10 10 0 0 1 20 0c0 5-3 9-10 18z"
          className="fill-answer-4"
        />
        <circle cx={58} cy={34} r={3.5} className="fill-surface" />
      </g>
      <g className={`${DROP} ${WAIT[4]}`}>
        <path
          d="M34 62c-5-6-7-9-7-12a7 7 0 0 1 14 0c0 3-2 6-7 12z"
          className="fill-answer-1"
        />
        <circle cx={34} cy={50} r={2.5} className="fill-surface" />
      </g>
    </>
  ),
  qa: (
    <>
      <g className={POP}>
        <path d="M30 46v12l12-12z" className="fill-primary" />
        <rect
          x={16}
          y={12}
          width={62}
          height={36}
          rx={13}
          className="fill-primary"
        />
        <text
          x={47}
          y={39}
          textAnchor="middle"
          fontSize={24}
          fontWeight={700}
          className="fill-surface"
        >
          ?
        </text>
      </g>
      <g className={`${RISE} ${WAIT[4]}`}>
        <rect
          x={72}
          y={40}
          width={32}
          height={28}
          rx={10}
          className="fill-answer-1"
        />
        <path d="M88 46l-8 9h5v7h6v-7h5z" className="fill-surface" />
      </g>
    </>
  ),
};

/** Sits inside a `group` with `data-reveal`; see the motion classes above. */
export function QuestionKindArt({
  kind,
}: {
  kind: LiveQuestionKind;
}): React.ReactElement {
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" className={ART}>
      <rect width={120} height={80} className="fill-accent-muted" />
      {KIND_ART[kind]}
    </svg>
  );
}

const FACT_ART = {
  screen: (
    <>
      <rect
        x={10}
        y={14}
        width={44}
        height={30}
        rx={6}
        className="fill-primary"
      />
      <rect
        x={18}
        y={31}
        width={7}
        height={8}
        rx={2}
        className={`fill-answer-2 ${GROW}`}
      />
      <rect
        x={28.5}
        y={21}
        width={7}
        height={18}
        rx={2}
        className={`fill-answer-1 ${GROW} ${WAIT[1]}`}
      />
      <rect
        x={39}
        y={26}
        width={7}
        height={13}
        rx={2}
        className={`fill-answer-3 ${GROW} ${WAIT[2]}`}
      />
      <rect x={29} y={44} width={6} height={7} className="fill-primary" />
      <rect
        x={20}
        y={50}
        width={24}
        height={4}
        rx={2}
        className="fill-primary"
      />
    </>
  ),
  layouts: (
    <>
      <rect
        x={8}
        y={36}
        width={7}
        height={16}
        rx={2}
        className={`fill-answer-2 ${GROW}`}
      />
      <rect
        x={18}
        y={20}
        width={7}
        height={32}
        rx={2}
        className={`fill-answer-1 ${GROW} ${WAIT[1]}`}
      />
      <rect
        x={28}
        y={29}
        width={7}
        height={23}
        rx={2}
        className={`fill-answer-3 ${GROW} ${WAIT[2]}`}
      />
      <g className={`${POP} ${WAIT[3]}`}>
        <circle
          cx={47}
          cy={22}
          r={8}
          className="fill-none stroke-answer-1"
          strokeWidth={6}
        />
        <circle
          cx={47}
          cy={22}
          r={8}
          className="fill-none stroke-answer-4"
          strokeWidth={6}
          strokeDasharray="16 100"
        />
      </g>
      <circle
        cx={42}
        cy={46}
        r={3}
        className={`fill-answer-5 ${POP} ${WAIT[4]}`}
      />
      <circle
        cx={50}
        cy={46}
        r={3}
        className={`fill-answer-5 ${POP} ${WAIT[5]}`}
      />
      <circle
        cx={46}
        cy={39}
        r={3}
        className={`fill-answer-5 ${POP} ${WAIT[6]}`}
      />
    </>
  ),
  sheet: (
    <>
      <rect
        x={12}
        y={10}
        width={36}
        height={44}
        rx={6}
        className="fill-surface"
      />
      <path
        d="M12 16a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v6H12z"
        className="fill-answer-2"
      />
      {[28, 37, 46].map((y, index) => (
        <g key={y} className={`${WIDEN} ${WAIT[index]}`}>
          <rect
            x={18}
            y={y}
            width={10}
            height={4}
            rx={2}
            className="fill-primary/30"
          />
          <rect
            x={32}
            y={y}
            width={10}
            height={4}
            rx={2}
            className="fill-primary/30"
          />
        </g>
      ))}
      <g className={`${DROP} ${WAIT[4]}`}>
        <circle cx={46} cy={46} r={12} className="fill-answer-1" />
        <path d="M46 53l-7-8h4.5v-6h5v6H53z" className="fill-surface" />
      </g>
    </>
  ),
};

export type FactArtName = keyof typeof FACT_ART;

export function FactArt({ name }: { name: FactArtName }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="size-14 shrink-0 rounded-2xl"
    >
      <rect width={64} height={64} className="fill-accent-muted" />
      {FACT_ART[name]}
    </svg>
  );
}

import type { LiveQuestionKind } from "@/lib/live/activities";

/*
 * Flat vector illustrations for the landing page. The content is made up;
 * each one shows what the real tool does. Colours come from the theme.
 */

const ART = "block h-auto w-full";
/** The arrow from the Qollab mark (`public/brand/qollab-mark.svg`), tip at 0,0. */
const POINTER = "M0 0 26 10 14 14 10 26Z";
const SPARKLE = "M0-10Q1.5-1.5 10 0 1.5 1.5 0 10-1.5 1.5-10 0-1.5-1.5 0-10z";

/** A whiteboard toolbar icon on a 24px grid, drawn inside an illustration. */
function Glyph({
  d,
  x,
  y,
  className,
}: {
  d: string;
  x: number;
  y: number;
  className: string;
}): React.ReactElement {
  return (
    <path
      d={d}
      transform={`translate(${x} ${y}) scale(0.75)`}
      className={`fill-none ${className}`}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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
      <path
        d={POINTER}
        className="stroke-surface"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <rect x={18} y={24} width={width} height={22} rx={11} />
      <text
        x={18 + width / 2}
        y={39}
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

/** Select (the Qollab mark's arrow), pen, rectangle, ellipse, arrow, text. */
const BOARD_TOOLS = [
  "M5 5 21 11.2 13.6 13.6 11.2 21Z",
  "M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z",
  "M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z",
  "M5 12h13M13 6l6 6-6 6",
  "M5 6h14M12 6v13M9 19h6",
];
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
      {BOARD_TOOLS.map((d, index) => (
        <Glyph
          key={index}
          d={d}
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

const SUMMARY_LINES = [
  { y: 27, width: 40 },
  { y: 34, width: 30 },
];
const KEY_POINTS = [
  { y: 48, width: 30 },
  { y: 56, width: 22 },
  { y: 64, width: 26 },
];
const PACK_QUIZ_ROWS = [
  { y: 24, line: 32, isRight: false },
  { y: 41, line: 40, isRight: true },
  { y: 58, line: 26, isRight: false },
];

/** A person as a head and shoulders, for the small drawings. */
function Person({
  x,
  y,
  fill,
  className = "",
}: {
  x: number;
  y: number;
  fill: string;
  className?: string;
}): React.ReactElement {
  return (
    <g className={`${fill} ${className}`}>
      <circle cx={x} cy={y} r={6} />
      <path d={`M${x - 10} ${y + 18}a10 10 0 0 1 20 0z`} />
    </g>
  );
}

const NOTE_LINES = [
  { y: 28, width: 44 },
  { y: 36, width: 38 },
  { y: 44, width: 48 },
  { y: 52, width: 24 },
];
const ROOM_PEOPLE = [
  { x: 32, y: 22, fill: "fill-answer-1" },
  { x: 58, y: 22, fill: "fill-answer-2" },
  { x: 32, y: 46, fill: "fill-answer-4" },
  { x: 58, y: 46, fill: "fill-answer-5" },
];
const OFFLINE_EDITS = [
  { y: 26, width: 18 },
  { y: 38, width: 14 },
  { y: 50, width: 20 },
];
const ROOM_TOOL_TILES = [
  { x: 32, y: 32, fill: "fill-answer-1" },
  { x: 56, y: 32, fill: "fill-answer-2" },
  { x: 32, y: 48, fill: "fill-answer-3" },
  { x: 56, y: 48, fill: "fill-answer-5" },
];
const GROUP_ROLES = [
  { x: 30, person: "fill-answer-1", role: "fill-answer-3" },
  { x: 60, person: "fill-answer-2", role: "fill-answer-1" },
  { x: 90, person: "fill-answer-4", role: "fill-answer-2" },
];
const WORK_BARS = [
  { x: 72, height: 10, fill: "fill-answer-2" },
  { x: 82, height: 18, fill: "fill-answer-1" },
  { x: 92, height: 13, fill: "fill-answer-3" },
];

/** Small pictures for the landing sections, drawn like the question kinds. */
const SCENE_ART = {
  summary: (
    <>
      <rect
        x={20}
        y={8}
        width={58}
        height={66}
        rx={8}
        className={`fill-surface ${RISE}`}
      />
      <rect
        x={28}
        y={16}
        width={32}
        height={5}
        rx={2.5}
        className={`fill-primary ${WIDEN} ${WAIT[1]}`}
      />
      {SUMMARY_LINES.map(({ y, width }, index) => (
        <rect
          key={y}
          x={28}
          y={y}
          width={width}
          height={4}
          rx={2}
          className={`fill-primary/20 ${WIDEN} ${WAIT[index + 2]}`}
        />
      ))}
      {KEY_POINTS.map(({ y, width }, index) => (
        <g key={y} className={`${RISE} ${WAIT[index + 3]}`}>
          <circle cx={31} cy={y} r={3} className="fill-answer-1" />
          <rect
            x={38}
            y={y - 2}
            width={width}
            height={4}
            rx={2}
            className="fill-primary/30"
          />
        </g>
      ))}
      <path
        d={SPARKLE}
        transform="translate(92 24) scale(0.9)"
        className={`fill-answer-3 ${POP} ${WAIT[5]}`}
      />
      <path
        d={SPARKLE}
        transform="translate(102 42) scale(0.5)"
        className={`fill-answer-5 ${POP} ${WAIT[6]}`}
      />
    </>
  ),
  quiz: (
    <>
      <rect
        x={16}
        y={10}
        width={50}
        height={6}
        rx={3}
        className={`fill-primary ${WIDEN}`}
      />
      {PACK_QUIZ_ROWS.map(({ y, line, isRight }, index) => (
        <g key={y} className={`${RISE} ${WAIT[index + 1]}`}>
          <rect
            x={16}
            y={y}
            width={64}
            height={13}
            rx={6.5}
            className={isRight ? "fill-answer-2" : "fill-surface"}
          />
          <rect
            x={24}
            y={y + 4.5}
            width={line}
            height={4}
            rx={2}
            className={isRight ? "fill-surface" : "fill-primary/30"}
          />
        </g>
      ))}
      <path
        d="M69 47.5l3 3 6-6"
        className={`fill-none stroke-surface ${POP} ${WAIT[4]}`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className={`${POP} ${WAIT[5]}`}>
        <circle cx={98} cy={36} r={13} className="fill-answer-1" />
        <text
          x={98}
          y={39.5}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          className="fill-surface"
        >
          4/5
        </text>
      </g>
    </>
  ),
  flashcards: (
    <>
      {/* Rotation sits on the outer group so the motion classes can't replace it. */}
      <g transform="rotate(-9 58 40)">
        <rect
          x={30}
          y={18}
          width={58}
          height={42}
          rx={8}
          className={`fill-answer-1/40 ${RISE}`}
        />
      </g>
      <g transform="rotate(5 58 40)">
        <rect
          x={30}
          y={18}
          width={58}
          height={42}
          rx={8}
          className={`fill-answer-1/70 ${RISE} ${WAIT[1]}`}
        />
      </g>
      <g className={`${RISE} ${WAIT[2]}`}>
        <rect
          x={28}
          y={18}
          width={60}
          height={44}
          rx={8}
          className="fill-surface"
        />
        <text
          x={58}
          y={44}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
          className="fill-primary"
        >
          ?
        </text>
        <rect
          x={44}
          y={50}
          width={28}
          height={4}
          rx={2}
          className="fill-primary/20"
        />
      </g>
      <g className={`${POP} ${WAIT[4]}`}>
        <circle cx={90} cy={60} r={10} className="fill-answer-3" />
        <path
          d="M85 60a5 5 0 1 0 5-5m2-2.5l-2 2.5 2 2.5"
          className="fill-none stroke-surface"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  ),
  notes: (
    <>
      <rect
        x={22}
        y={8}
        width={66}
        height={66}
        rx={8}
        className={`fill-surface ${RISE}`}
      />
      <rect
        x={30}
        y={16}
        width={30}
        height={5}
        rx={2.5}
        className={`fill-primary ${WIDEN} ${WAIT[1]}`}
      />
      {NOTE_LINES.map(({ y, width }, index) => (
        <rect
          key={y}
          x={30}
          y={y}
          width={width}
          height={4}
          rx={2}
          className={`fill-primary/20 ${WIDEN} ${WAIT[index + 2]}`}
        />
      ))}
      <g className={`${POP} ${WAIT[4]}`}>
        <rect x={69} y={33} width={2} height={10} className="fill-answer-4" />
        <rect
          x={70}
          y={25}
          width={14}
          height={7}
          rx={3.5}
          className="fill-answer-4"
        />
      </g>
      <g className={`${POP} ${WAIT[5]}`}>
        <rect x={55} y={49} width={2} height={10} className="fill-answer-2" />
        <rect
          x={56}
          y={59}
          width={14}
          height={7}
          rx={3.5}
          className="fill-answer-2"
        />
      </g>
      <g className={`${POP} ${WAIT[6]}`}>
        <circle cx={98} cy={60} r={11} className="fill-answer-3" />
        <path
          d="M98 54v6l4 2.5"
          className="fill-none stroke-surface"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  ),
  room: (
    <>
      <rect
        x={16}
        y={10}
        width={58}
        height={60}
        rx={10}
        className={`fill-surface ${RISE}`}
      />
      {ROOM_PEOPLE.map(({ x, y, fill }, index) => (
        <Person
          key={fill}
          x={x}
          y={y}
          fill={fill}
          className={`${POP} ${WAIT[index + 1]}`}
        />
      ))}
      <g className={`${RISE} ${WAIT[4]}`}>
        <rect
          x={84}
          y={18}
          width={24}
          height={18}
          rx={4}
          className="fill-answer-3"
        />
        <path
          d="M86 21l10 8 10-8"
          className="fill-none stroke-surface"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g className={`${POP} ${WAIT[5]}`}>
        <circle cx={96} cy={56} r={11} className="fill-primary" />
        <rect
          x={91}
          y={55}
          width={10}
          height={8}
          rx={2}
          className="fill-surface"
        />
        <path
          d="M93 55v-3a3 3 0 0 1 6 0v3"
          className="fill-none stroke-surface"
          strokeWidth={2}
        />
      </g>
    </>
  ),
  offline: (
    <>
      <rect
        x={16}
        y={10}
        width={38}
        height={60}
        rx={8}
        className={`fill-surface ${RISE}`}
      />
      {OFFLINE_EDITS.map(({ y, width }, index) => (
        <g key={y} className={`${WIDEN} ${WAIT[index + 1]}`}>
          <rect
            x={22}
            y={y}
            width={width}
            height={5}
            rx={2.5}
            className="fill-answer-1/40"
          />
          <circle cx={46} cy={y + 2.5} r={3} className="fill-answer-3" />
        </g>
      ))}
      <path
        d="M58 40h14"
        className={`fill-none stroke-primary/40 ${WIDEN} ${WAIT[4]}`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="2 5"
      />
      <g className={`${POP} ${WAIT[3]}`}>
        <path
          d="M80 48h22a8 8 0 0 0 0-16 11 11 0 0 0-21-3 9 9 0 0 0-1 19z"
          className="fill-surface"
        />
        <path
          d="M82 26l20 24"
          className="fill-none stroke-answer-4"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <g className={`${POP} ${WAIT[5]}`}>
        <circle cx={90} cy={62} r={9} className="fill-answer-2" />
        <path
          d="M86 62l3 3 5-5"
          className="fill-none stroke-surface"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  ),
  create: (
    <>
      <rect
        x={24}
        y={14}
        width={56}
        height={56}
        rx={8}
        className={`fill-surface ${RISE}`}
      />
      <rect
        x={32}
        y={21}
        width={28}
        height={5}
        rx={2.5}
        className={`fill-primary ${WIDEN} ${WAIT[1]}`}
      />
      {ROOM_TOOL_TILES.map(({ x, y, fill }, index) => (
        <rect
          key={fill}
          x={x}
          y={y}
          width={20}
          height={12}
          rx={3}
          className={`${fill} ${POP} ${WAIT[index + 2]}`}
        />
      ))}
      <g className={`${POP} ${WAIT[6]}`}>
        <circle cx={90} cy={18} r={10} className="fill-answer-1" />
        <path
          d="M90 13v10M85 18h10"
          className="fill-none stroke-surface"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </g>
    </>
  ),
  group: (
    <>
      {GROUP_ROLES.map(({ x, person, role }, index) => (
        <g key={x}>
          <Person
            x={x}
            y={24}
            fill={person}
            className={`${POP} ${WAIT[index * 2]}`}
          />
          <rect
            x={x - 12}
            y={50}
            width={24}
            height={9}
            rx={4.5}
            className={`${role} ${WIDEN} ${WAIT[index * 2 + 1]}`}
          />
        </g>
      ))}
    </>
  ),
  work: (
    <>
      <rect
        x={14}
        y={12}
        width={44}
        height={56}
        rx={7}
        className={`fill-surface ${RISE}`}
      />
      {NOTE_LINES.map(({ y, width }, index) => (
        <rect
          key={y}
          x={21}
          y={y - 6}
          width={width * 0.66}
          height={4}
          rx={2}
          className={`fill-primary/20 ${WIDEN} ${WAIT[index + 1]}`}
        />
      ))}
      <rect
        x={64}
        y={12}
        width={42}
        height={28}
        rx={7}
        className={`fill-surface ${RISE} ${WAIT[1]}`}
      />
      {WORK_BARS.map(({ x, height, fill }, index) => (
        <rect
          key={x}
          x={x}
          y={34 - height}
          width={7}
          height={height}
          rx={2}
          className={`${fill} ${GROW} ${WAIT[index + 2]}`}
        />
      ))}
      <rect
        x={64}
        y={46}
        width={42}
        height={22}
        rx={7}
        className={`fill-surface ${RISE} ${WAIT[2]}`}
      />
      <path
        d="M70 60q6-8 12 0t12 0 6-4"
        className={`fill-none stroke-answer-4 ${WIDEN} ${WAIT[5]}`}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </>
  ),
  review: (
    <>
      <g transform="rotate(-8 54 42)">
        <rect
          x={26}
          y={16}
          width={56}
          height={50}
          rx={8}
          className={`fill-answer-1/40 ${RISE}`}
        />
      </g>
      <g className={`${RISE} ${WAIT[1]}`}>
        <rect
          x={26}
          y={16}
          width={56}
          height={50}
          rx={8}
          className="fill-surface"
        />
        <rect
          x={33}
          y={24}
          width={26}
          height={5}
          rx={2.5}
          className="fill-primary"
        />
        {KEY_POINTS.map(({ y, width }) => (
          <g key={y}>
            <circle cx={36} cy={y - 10} r={2.5} className="fill-answer-1" />
            <rect
              x={42}
              y={y - 12}
              width={width}
              height={4}
              rx={2}
              className="fill-primary/30"
            />
          </g>
        ))}
      </g>
      <path
        d="M68 16h10v16l-5-4-5 4z"
        className={`fill-answer-3 ${DROP} ${WAIT[3]}`}
      />
      <path
        d={SPARKLE}
        transform="translate(96 26) scale(0.8)"
        className={`fill-answer-5 ${POP} ${WAIT[5]}`}
      />
    </>
  ),
};

export type SceneArtName = keyof typeof SCENE_ART;

/** Sits inside a `group` with `data-reveal`; see the motion classes above. */
export function SceneArt({ name }: { name: SceneArtName }): React.ReactElement {
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" className={ART}>
      <rect width={120} height={80} className="fill-accent-muted" />
      {SCENE_ART[name]}
    </svg>
  );
}

/** The torn line down the middle of the 404 page, top to bottom. */
const TEAR = [
  [280, 90],
  [272, 110],
  [282, 128],
  [273, 148],
  [282, 166],
  [272, 188],
  [280, 208],
  [271, 230],
  [280, 250],
  [276, 270],
] as const;
const TEAR_LEFT = TEAR.map(([x, y]) => `L${x} ${y}`).join("");
const TEAR_RIGHT = [...TEAR]
  .reverse()
  .map(([x, y]) => `L${x + 6} ${y}`)
  .join("");
const HALF_LINES = [
  { y: 216, width: 70 },
  { y: 232, width: 56 },
  { y: 248, width: 64 },
];

/** A study partner facing right, both hands on the page; mirror for the other side. */
function PageHolder({
  body,
  className = "",
}: {
  body: string;
  className?: string;
}): React.ReactElement {
  return (
    <g className={className}>
      <ellipse cx={120} cy={350} rx={52} ry={6} className="fill-primary/10" />
      <g
        className="fill-none stroke-primary"
        strokeWidth={15}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M110 212l-10 66-14 62" />
        <path d="M130 212l12 64 10 64" />
      </g>
      <ellipse cx={80} cy={344} rx={14} ry={7} className="fill-answer-3" />
      <ellipse cx={158} cy={344} rx={14} ry={7} className="fill-answer-3" />
      <rect x={94} y={140} width={50} height={84} rx={22} className={body} />
      <circle cx={122} cy={112} r={20} className="fill-primary" />
      <path d="M104 106a20 20 0 0 1 36-8q-14 2-24 10z" className={body} />
      <circle cx={133} cy={112} r={2.8} className="fill-surface" />
    </g>
  );
}

function HolderArms({ arm }: { arm: string }): React.ReactElement {
  return (
    <g>
      <g
        className={`fill-none ${arm}`}
        strokeWidth={13}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M128 158l26 14 22 4" />
        <path d="M128 186l26 22 20 18" />
      </g>
      <circle cx={178} cy={176} r={8} className="fill-primary" />
      <circle cx={176} cy={228} r={8} className="fill-primary" />
    </g>
  );
}

export function NotFoundArt(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 560 380"
      role="img"
      aria-label="Illustration of two study partners each holding half of a torn note page that reads 404, while a cursor named You hovers above, puzzled."
      className={ART}
    >
      <rect width={560} height={380} className="fill-accent-muted" />
      <circle cx={470} cy={70} r={90} className="fill-accent-bg/10" />
      <circle cx={70} cy={330} r={80} className="fill-accent-bg/10" />

      <PageHolder body="fill-answer-1" />
      <g transform="translate(560 0) scale(-1 1)">
        <PageHolder body="fill-answer-4" />
      </g>

      <g fontSize={28} fontWeight={700} className="fill-answer-3">
        <text x={98} y={82}>
          ?
        </text>
        <text x={446} y={82}>
          ?
        </text>
      </g>

      <g transform="rotate(-5 225 180)">
        <path d={`M170 90${TEAR_LEFT}H170z`} className="fill-surface" />
        <rect
          x={186}
          y={104}
          width={60}
          height={10}
          rx={5}
          className="fill-primary"
        />
        <text
          x={268}
          y={190}
          textAnchor="end"
          fontSize={72}
          fontWeight={800}
          className="fill-primary"
        >
          40
        </text>
        {HALF_LINES.map(({ y, width }) => (
          <rect
            key={y}
            x={186}
            y={y}
            width={width}
            height={8}
            rx={4}
            className="fill-primary/20"
          />
        ))}
      </g>
      <g transform="rotate(6 335 180)">
        <path
          d={`M286 90H390V270H282${TEAR_RIGHT}z`}
          className="fill-surface"
        />
        <rect
          x={326}
          y={104}
          width={48}
          height={10}
          rx={5}
          className="fill-answer-2"
        />
        <text
          x={290}
          y={190}
          fontSize={72}
          fontWeight={800}
          className="fill-primary"
        >
          4
        </text>
        {HALF_LINES.map(({ y, width }) => (
          <rect
            key={y}
            x={300}
            y={y}
            width={width - 10}
            height={8}
            rx={4}
            className="fill-primary/20"
          />
        ))}
      </g>

      <HolderArms arm="stroke-answer-1" />
      <g transform="translate(560 0) scale(-1 1)">
        <HolderArms arm="stroke-answer-4" />
      </g>

      <g className="fill-surface">
        <path d="M276 284l10 4-6 8z" />
        <path d="M290 304l8-2-2 9z" />
        <path d="M270 318l7 3-5 5z" />
      </g>

      <g transform="rotate(-4 280 316)">
        <rect
          x={236}
          y={292}
          width={88}
          height={50}
          rx={6}
          className="fill-answer-3"
        />
        <path d="M324 326v10a6 6 0 0 1-6 6h-10z" className="fill-primary/20" />
        <g
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          className="fill-surface"
        >
          <text x={280} y={313}>
            Page not
          </text>
          <text x={280} y={329}>
            found
          </text>
        </g>
      </g>

      <path
        d={SPARKLE}
        transform="translate(214 46) scale(1.2)"
        className="fill-answer-3"
      />
      <path
        d={SPARKLE}
        transform="translate(410 120) scale(0.7)"
        className="fill-answer-5"
      />
      <Pointer
        name="You"
        x={300}
        y={30}
        width={40}
        className="fill-accent-bg"
      />
    </svg>
  );
}

/** Three study partners round a table with a shared laptop, for the hero. */
export function HeroGroupArt(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 360 300"
      role="img"
      aria-label="Illustration of three study partners round a table, sharing a laptop and a notebook, with a question and an idea above them."
      className={ART}
    >
      <circle cx={300} cy={60} r={70} className="fill-accent-bg/10" />
      <circle cx={40} cy={120} r={46} className="fill-accent-bg/10" />

      <path d="M46 300v-66a44 44 0 0 1 88 0v66z" className="fill-answer-1" />
      <circle cx={90} cy={156} r={26} className="fill-primary" />
      <path
        d="M66 150a26 26 0 0 1 48-12q-20 0-30 16z"
        className="fill-answer-1"
      />
      <circle cx={102} cy={158} r={3} className="fill-surface" />

      <path d="M226 300v-66a44 44 0 0 1 88 0v66z" className="fill-answer-2" />
      <circle cx={270} cy={156} r={26} className="fill-primary" />
      <path
        d="M294 150a26 26 0 0 0-48-12q20 0 30 16z"
        className="fill-answer-2"
      />
      <circle cx={258} cy={158} r={3} className="fill-surface" />

      <path d="M132 300v-84a48 48 0 0 1 96 0v84z" className="fill-answer-4" />
      <circle cx={180} cy={132} r={30} className="fill-primary" />
      <path
        d="M152 124a30 30 0 0 1 56 0q-14-12-28-4t-28 4z"
        className="fill-answer-4"
      />
      <circle cx={170} cy={134} r={3} className="fill-surface" />
      <circle cx={190} cy={134} r={3} className="fill-surface" />
      <path
        d="M172 146q8 6 16 0"
        className="fill-none stroke-surface"
        strokeWidth={2.5}
        strokeLinecap="round"
      />

      <rect
        x={10}
        y={254}
        width={340}
        height={46}
        rx={14}
        className="fill-surface"
      />
      <rect
        x={10}
        y={254}
        width={340}
        height={8}
        rx={4}
        className="fill-primary/10"
      />
      <g transform="rotate(-8 84 264)">
        <rect
          x={52}
          y={244}
          width={62}
          height={34}
          rx={5}
          className="fill-answer-3"
        />
        <rect
          x={60}
          y={254}
          width={36}
          height={4}
          rx={2}
          className="fill-surface/70"
        />
        <rect
          x={60}
          y={263}
          width={24}
          height={4}
          rx={2}
          className="fill-surface/70"
        />
      </g>
      <path d="M140 196h80l8 62h-96z" className="fill-primary" />
      <circle
        cx={180}
        cy={226}
        r={10}
        className="fill-none stroke-surface"
        strokeWidth={3.5}
      />
      <path d="M184 230l8 2-4 6z" className="fill-accent-bg" />
      <circle cx={112} cy={262} r={9} className="fill-primary" />
      <circle cx={248} cy={262} r={9} className="fill-primary" />

      <path d="M70 108v14l14-12z" className="fill-primary" />
      <rect
        x={50}
        y={70}
        width={52}
        height={42}
        rx={14}
        className="fill-primary"
      />
      <text
        x={76}
        y={100}
        textAnchor="middle"
        fontSize={24}
        fontWeight={700}
        className="fill-surface"
      >
        ?
      </text>
      <g transform="translate(286 92)">
        <circle r={20} className="fill-answer-3" />
        <rect
          x={-7}
          y={16}
          width={14}
          height={10}
          rx={3}
          className="fill-primary"
        />
        <path
          d="M-6 2q6-8 12 0"
          className="fill-none stroke-surface"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </g>
      <path
        d={SPARKLE}
        transform="translate(330 140) scale(0.8)"
        className="fill-answer-5"
      />
      <path
        d={SPARKLE}
        transform="translate(236 70) scale(1.1)"
        className="fill-answer-3"
      />
      <Pointer
        name="Lea"
        x={150}
        y={24}
        width={40}
        className="fill-accent-bg"
      />
    </svg>
  );
}

export type TourChapter = "notes" | "pdf" | "board" | "live" | "pack";

const TOUR_LINES = [
  { y: 118, width: 300 },
  { y: 136, width: 270 },
  { y: 154, width: 310 },
  { y: 172, width: 180 },
];
const TOUR_BULLETS = [
  { y: 214, width: 240 },
  { y: 236, width: 200 },
  { y: 258, width: 260 },
];
const TOUR_THUMBS = [76, 140, 204, 268];
const THUMB_LINES = [
  { dy: 16, width: 30 },
  { dy: 21, width: 26 },
  { dy: 26, width: 30 },
  { dy: 37, width: 28 },
  { dy: 42, width: 30 },
  { dy: 47, width: 18 },
];
const TOUR_DOTS = Array.from({ length: 84 }, (_, index) => ({
  x: 34 + (index % 14) * 38,
  y: 74 + Math.floor(index / 14) * 46,
}));
const POLL_ROWS = [
  { label: "Cheaper paper", width: 120, fill: "fill-answer-2" },
  { label: "Reusable type", width: 230, fill: "fill-answer-1" },
  { label: "More readers", width: 160, fill: "fill-answer-3" },
  { label: "Faster presses", width: 80, fill: "fill-answer-4" },
];
const PHONE_ROWS = [128, 160, 192, 224];

/** One chapter of a Qollab room, drawn inside a shared app window. */
const TOUR_ART: Record<TourChapter, { label: string; body: React.ReactNode }> =
  {
    notes: {
      label:
        "Illustration of shared notes: a page on the printing press with Ana’s cursor at the end of a line and a comment beside it.",
      body: (
        <>
          <rect
            x={90}
            y={80}
            width={220}
            height={18}
            rx={9}
            className="fill-primary"
          />
          {TOUR_LINES.map(({ y, width }) => (
            <rect
              key={y}
              x={90}
              y={y}
              width={width}
              height={9}
              rx={4.5}
              className="fill-primary/20"
            />
          ))}
          <rect
            x={86}
            y={150}
            width={180}
            height={18}
            rx={5}
            className="fill-answer-3/35"
          />
          {TOUR_BULLETS.map(({ y, width }, index) => (
            <g key={y}>
              <circle
                cx={96}
                cy={y + 4}
                r={5}
                className={
                  ["fill-answer-1", "fill-answer-2", "fill-answer-4"][index]
                }
              />
              <rect
                x={110}
                y={y}
                width={width}
                height={9}
                rx={4.5}
                className="fill-primary/20"
              />
            </g>
          ))}
          <rect
            x={270}
            y={166}
            width={3}
            height={18}
            className="fill-answer-4"
          />
          <Pointer
            name="Ana"
            x={272}
            y={176}
            width={44}
            className="fill-answer-4"
          />
          <rect
            x={428}
            y={84}
            width={112}
            height={96}
            rx={14}
            className="fill-accent-muted"
          />
          <circle cx={448} cy={104} r={9} className="fill-answer-2" />
          <rect
            x={464}
            y={100}
            width={56}
            height={8}
            rx={4}
            className="fill-primary/40"
          />
          <rect
            x={442}
            y={126}
            width={84}
            height={7}
            rx={3.5}
            className="fill-primary/20"
          />
          <rect
            x={442}
            y={142}
            width={64}
            height={7}
            rx={3.5}
            className="fill-primary/20"
          />
          <rect
            x={442}
            y={158}
            width={40}
            height={7}
            rx={3.5}
            className="fill-accent-bg"
          />
        </>
      ),
    },
    pdf: {
      label:
        "Illustration of PDF markup: a page with two highlights, an underline and a sticky note, and Marco’s cursor.",
      body: (
        <>
          <rect
            x={0}
            y={48}
            width={560}
            height={302}
            className="fill-primary/5"
          />
          {TOUR_THUMBS.map((y, index) => {
            const isOpen = index === 1;

            return (
              <g key={y}>
                <rect
                  x={24}
                  y={y}
                  width={44}
                  height={54}
                  rx={6}
                  className={
                    isOpen ? "fill-surface stroke-accent-bg" : "fill-surface"
                  }
                  strokeWidth={isOpen ? 3 : 0}
                />
                {/* The open page repeats the big page's marks in miniature. */}
                {isOpen ? (
                  <>
                    <rect
                      x={29}
                      y={y + 14}
                      width={34}
                      height={5}
                      rx={1.5}
                      className="fill-answer-3/40"
                    />
                    <rect
                      x={29}
                      y={y + 35}
                      width={26}
                      height={5}
                      rx={1.5}
                      className="fill-answer-2/30"
                    />
                  </>
                ) : null}
                <rect
                  x={31}
                  y={y + 7}
                  width={20}
                  height={3}
                  rx={1.5}
                  className="fill-primary/70"
                />
                {THUMB_LINES.map(({ dy, width }) => (
                  <rect
                    key={dy}
                    x={31}
                    y={y + dy}
                    width={width}
                    height={2}
                    rx={1}
                    className="fill-primary/20"
                  />
                ))}
                {isOpen ? (
                  <rect
                    x={31}
                    y={y + 30}
                    width={20}
                    height={1.5}
                    rx={0.75}
                    className="fill-answer-4"
                  />
                ) : null}
              </g>
            );
          })}
          <rect
            x={170}
            y={64}
            width={220}
            height={286}
            rx={10}
            className="fill-surface"
          />
          <rect
            x={192}
            y={88}
            width={120}
            height={14}
            rx={7}
            className="fill-primary"
          />
          <rect
            x={186}
            y={118}
            width={186}
            height={22}
            rx={6}
            className="fill-answer-3/40"
          />
          <rect
            x={186}
            y={196}
            width={150}
            height={22}
            rx={6}
            className="fill-answer-2/30"
          />
          {[124, 144, 164, 202, 222, 242, 262].map((y) => (
            <rect
              key={y}
              x={192}
              y={y + 2}
              width={170}
              height={8}
              rx={4}
              className="fill-primary/20"
            />
          ))}
          <rect
            x={192}
            y={182}
            width={120}
            height={4}
            rx={2}
            className="fill-answer-4"
          />
          <g transform="translate(404 110) rotate(6)">
            <rect width={100} height={92} rx={8} className="fill-answer-3" />
            {[22, 40, 58].map((y, index) => (
              <rect
                key={y}
                x={16}
                y={y}
                width={[64, 52, 34][index]}
                height={7}
                rx={3.5}
                className="fill-surface"
              />
            ))}
          </g>
          <Pointer
            name="Marco"
            x={330}
            y={214}
            width={54}
            className="fill-answer-2"
          />
        </>
      ),
    },
    board: {
      label:
        "Illustration of the whiteboard: the question “Why did books get cheaper?”, a box for the printed page with arrows into it, and two sticky notes.",
      body: (
        <>
          {TOUR_DOTS.map(({ x, y }) => (
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
            y={62}
            width={220}
            height={40}
            rx={20}
            className="fill-primary"
          />
          <rect
            x={178}
            y={68}
            width={30}
            height={28}
            rx={14}
            className="fill-accent-bg"
          />
          {BOARD_TOOLS.map((d, index) => (
            <Glyph
              key={index}
              d={d}
              x={184 + index * 34}
              y={73}
              className="stroke-surface"
            />
          ))}
          <text
            x={300}
            y={146}
            textAnchor="middle"
            fontSize={20}
            fontWeight={700}
            className="fill-answer-2"
          >
            Why did books get cheaper?
          </text>
          <g
            className="fill-none stroke-accent-bg"
            strokeWidth={4}
            strokeLinecap="round"
          >
            <path d="M60 196l60 40" />
            <path d="M54 250h66" />
            <path d="M60 306l60-40" />
            <rect x={130} y={214} width={150} height={74} rx={6} />
          </g>
          <g className="fill-accent-bg">
            <path d="M126 240l-14-2 8-12z" />
            <path d="M128 250l-14-8v16z" />
            <path d="M126 260l-14 2 8 12z" />
          </g>
          <text
            x={205}
            y={257}
            textAnchor="middle"
            fontSize={17}
            fontWeight={700}
            className="fill-accent-bg"
          >
            Printed page
          </text>
          <g transform="translate(340 190) rotate(-4)">
            <rect width={88} height={80} rx={6} className="fill-answer-3" />
            <rect
              x={12}
              y={18}
              width={60}
              height={7}
              rx={3.5}
              className="fill-surface"
            />
            <rect
              x={12}
              y={34}
              width={44}
              height={7}
              rx={3.5}
              className="fill-surface"
            />
          </g>
          <g transform="translate(446 220) rotate(5)">
            <rect width={88} height={80} rx={6} className="fill-answer-5" />
            <rect
              x={12}
              y={18}
              width={56}
              height={7}
              rx={3.5}
              className="fill-surface"
            />
            <rect
              x={12}
              y={34}
              width={38}
              height={7}
              rx={3.5}
              className="fill-surface"
            />
          </g>
          <Pointer
            name="Lea"
            x={290}
            y={290}
            width={40}
            className="fill-answer-1"
          />
        </>
      ),
    },
    live: {
      label:
        "Illustration of a live poll: four answers shown as bars on the big screen, and a phone where one answer is chosen.",
      body: (
        <>
          <text
            x={40}
            y={100}
            fontSize={20}
            fontWeight={700}
            className="fill-primary"
          >
            What made books cheaper?
          </text>
          {POLL_ROWS.map(({ label, width, fill }, index) => (
            <g key={label} transform={`translate(40 ${126 + index * 50})`}>
              <text
                y={12}
                fontSize={13}
                fontWeight={600}
                className="fill-primary/70"
              >
                {label}
              </text>
              <rect
                y={20}
                width={280}
                height={16}
                rx={8}
                className="fill-primary/10"
              />
              <rect y={20} width={width} height={16} rx={8} className={fill} />
            </g>
          ))}
          <rect
            x={410}
            y={74}
            width={120}
            height={262}
            rx={22}
            className="fill-surface stroke-primary"
            strokeWidth={6}
          />
          <rect
            x={452}
            y={86}
            width={36}
            height={6}
            rx={3}
            className="fill-primary/20"
          />
          <rect
            x={426}
            y={104}
            width={70}
            height={9}
            rx={4.5}
            className="fill-primary"
          />
          {PHONE_ROWS.map((y, index) => (
            <rect
              key={y}
              x={426}
              y={y}
              width={88}
              height={24}
              rx={12}
              className={index === 1 ? "fill-answer-1" : "fill-primary/10"}
            />
          ))}
          <path
            d="M492 166l5 5 9-10"
            className="fill-none stroke-surface"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ),
    },
    pack: {
      label:
        "Illustration of a study pack: a summary with key points, a quiz question with the right answer marked, and a flashcard.",
      body: (
        <>
          {[
            { x: 34, title: "Summary" },
            { x: 206, title: "Quiz" },
            { x: 378, title: "Flashcards" },
          ].map(({ x, title }) => (
            <g key={title}>
              <rect
                x={x}
                y={78}
                width={150}
                height={240}
                rx={16}
                className="fill-accent-muted"
              />
              <text
                x={x + 18}
                y={108}
                fontSize={15}
                fontWeight={700}
                className="fill-primary"
              >
                {title}
              </text>
            </g>
          ))}
          {[132, 148, 164].map((y, index) => (
            <rect
              key={y}
              x={52}
              y={y}
              width={[110, 96, 70][index]}
              height={8}
              rx={4}
              className="fill-primary/20"
            />
          ))}
          {[196, 222, 248].map((y) => (
            <g key={y}>
              <circle cx={58} cy={y + 4} r={5} className="fill-answer-1" />
              <rect
                x={70}
                y={y}
                width={84}
                height={8}
                rx={4}
                className="fill-primary/30"
              />
            </g>
          ))}
          <rect
            x={224}
            y={126}
            width={110}
            height={9}
            rx={4.5}
            className="fill-primary"
          />
          {[156, 196, 236].map((y, index) => (
            <g key={y}>
              <rect
                x={224}
                y={y}
                width={114}
                height={28}
                rx={14}
                className={index === 1 ? "fill-answer-2" : "fill-surface"}
              />
              <rect
                x={238}
                y={y + 10}
                width={60}
                height={8}
                rx={4}
                className={index === 1 ? "fill-surface" : "fill-primary/30"}
              />
            </g>
          ))}
          <path
            d="M314 210l5 5 9-10"
            className="fill-none stroke-surface"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g transform="rotate(-6 453 210)">
            <rect
              x={398}
              y={150}
              width={110}
              height={120}
              rx={12}
              className="fill-answer-1/40"
            />
          </g>
          <rect
            x={396}
            y={150}
            width={114}
            height={124}
            rx={12}
            className="fill-surface"
          />
          <text
            x={453}
            y={222}
            textAnchor="middle"
            fontSize={44}
            fontWeight={800}
            className="fill-primary"
          >
            ?
          </text>
          <path
            d={SPARKLE}
            transform="translate(512 140) scale(1.2)"
            className="fill-answer-3"
          />
        </>
      ),
    },
  };

/** The app window shared by every tour chapter: room title, people present, then the tool. */
export function TourArt({
  chapter,
}: {
  chapter: TourChapter;
}): React.ReactElement {
  const { label, body } = TOUR_ART[chapter];

  return (
    <svg viewBox="0 0 560 350" role="img" aria-label={label} className={ART}>
      <rect width={560} height={350} className="fill-surface" />
      <rect
        x={20}
        y={16}
        width={16}
        height={16}
        rx={5}
        className="fill-accent-bg"
      />
      <text
        x={46}
        y={29}
        fontSize={14}
        fontWeight={700}
        className="fill-primary"
      >
        Reading 4 · The printing press
      </text>
      {["fill-answer-1", "fill-answer-4", "fill-answer-2"].map(
        (fill, index) => (
          <circle
            key={fill}
            cx={484 + index * 20}
            cy={24}
            r={11}
            className={`${fill} stroke-surface`}
            strokeWidth={3}
          />
        ),
      )}
      <rect y={47} width={560} height={1.5} className="fill-primary/10" />
      {body}
    </svg>
  );
}

/*
 * Small pictures for the hero's tool tiles, drawn like the fact tiles: one
 * idea each, at icon size.
 */
const TOOL_ART = {
  notes: (
    <>
      <rect
        x={14}
        y={10}
        width={36}
        height={44}
        rx={6}
        className="fill-surface"
      />
      {[20, 28, 36].map((y, index) => (
        <rect
          key={y}
          x={20}
          y={y}
          width={[22, 18, 14][index]}
          height={4}
          rx={2}
          className={`fill-primary/30 ${WIDEN} ${WAIT[index]}`}
        />
      ))}
      <g className={`${POP} ${WAIT[3]}`}>
        <rect x={36} y={33} width={2} height={9} className="fill-answer-4" />
        <rect
          x={37}
          y={42}
          width={14}
          height={7}
          rx={3.5}
          className="fill-answer-4"
        />
      </g>
    </>
  ),
  pdf: (
    <>
      <rect
        x={14}
        y={8}
        width={36}
        height={48}
        rx={5}
        className="fill-surface"
      />
      <path d="M40 8h7v13l-3.5-3-3.5 3z" className="fill-accent-bg" />
      <rect
        x={18}
        y={22}
        width={28}
        height={8}
        rx={3}
        className={`fill-answer-3/45 ${WIDEN}`}
      />
      {[24, 36, 44].map((y, index) => (
        <rect
          key={y}
          x={20}
          y={y}
          width={[18, 24, 16][index]}
          height={4}
          rx={2}
          className="fill-primary/30"
        />
      ))}
      <rect
        x={20}
        y={40}
        width={22}
        height={2}
        rx={1}
        className={`fill-answer-4 ${WIDEN} ${WAIT[2]}`}
      />
    </>
  ),
  board: (
    <>
      <rect
        x={8}
        y={12}
        width={48}
        height={36}
        rx={6}
        className="fill-surface"
      />
      <rect x={30} y={48} width={4} height={8} className="fill-primary" />
      <rect
        x={14}
        y={18}
        width={14}
        height={14}
        rx={2}
        className={`fill-answer-3 ${POP}`}
      />
      <circle
        cx={44}
        cy={36}
        r={6}
        className={`fill-none stroke-answer-1 ${POP} ${WAIT[2]}`}
        strokeWidth={2.5}
      />
      <path
        d="M26 38l10-3"
        className="fill-none stroke-primary"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  ),
  live: (
    <>
      <rect
        x={10}
        y={50}
        width={44}
        height={2}
        rx={1}
        className="fill-primary/20"
      />
      {[
        { x: 14, height: 18, fill: "fill-answer-2" },
        { x: 27, height: 34, fill: "fill-answer-1" },
        { x: 40, height: 24, fill: "fill-answer-3" },
      ].map(({ x, height, fill }, index) => (
        <rect
          key={x}
          x={x}
          y={50 - height}
          width={10}
          height={height}
          rx={3}
          className={`${fill} ${GROW} ${WAIT[index]}`}
        />
      ))}
    </>
  ),
  voice: (
    <>
      <rect
        x={24}
        y={10}
        width={16}
        height={28}
        rx={8}
        className="fill-accent-bg"
      />
      <path
        d="M16 30a16 16 0 0 0 32 0M32 46v8M24 54h16"
        className="fill-none stroke-primary"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M46 16a10 10 0 0 1 0 14"
        className={`fill-none stroke-answer-3 ${POP} ${WAIT[2]}`}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M18 16a10 10 0 0 0 0 14"
        className={`fill-none stroke-answer-3 ${POP} ${WAIT[3]}`}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  ),
  packs: (
    <>
      <g transform="rotate(-8 30 34)">
        <rect
          x={12}
          y={16}
          width={34}
          height={38}
          rx={5}
          className="fill-answer-1/40"
        />
      </g>
      <rect
        x={14}
        y={16}
        width={34}
        height={38}
        rx={5}
        className={`fill-surface ${RISE}`}
      />
      <rect
        x={20}
        y={24}
        width={18}
        height={4}
        rx={2}
        className="fill-primary"
      />
      <rect
        x={20}
        y={33}
        width={22}
        height={4}
        rx={2}
        className="fill-primary/30"
      />
      <rect
        x={20}
        y={41}
        width={14}
        height={4}
        rx={2}
        className="fill-primary/30"
      />
      <path
        d={SPARKLE}
        transform="translate(50 14) scale(0.7)"
        className={`fill-answer-3 ${POP} ${WAIT[2]}`}
      />
    </>
  ),
  offline: (
    <>
      <path
        d="M18 40h26a7 7 0 0 0 0-14 10 10 0 0 0-19-3 8 8 0 0 0-7 17z"
        className="fill-surface"
      />
      <path
        d="M20 18l24 28"
        className={`fill-none stroke-answer-4 ${WIDEN}`}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <g className={`${POP} ${WAIT[2]}`}>
        <circle cx={44} cy={46} r={9} className="fill-answer-2" />
        <path
          d="M40 46l3 3 5-5"
          className="fill-none stroke-surface"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </>
  ),
  roles: (
    <>
      <path
        d="M32 8l18 7v13c0 12-8 20-18 26-10-6-18-14-18-26V15z"
        className="fill-answer-2"
      />
      <path
        d="M24 31l6 6 11-12"
        className={`fill-none stroke-surface ${POP} ${WAIT[1]}`}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  breakout: (
    <>
      <rect
        x={6}
        y={14}
        width={26}
        height={36}
        rx={6}
        className="fill-surface"
      />
      <circle cx={14} cy={24} r={4} className="fill-answer-1" />
      <circle cx={24} cy={32} r={4} className="fill-answer-2" />
      <circle cx={14} cy={41} r={4} className="fill-answer-4" />
      <path
        d="M33 26l6-6M33 38l6 6"
        className={`fill-none stroke-primary/40 ${WIDEN} ${WAIT[1]}`}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <g className={`${POP} ${WAIT[2]}`}>
        <rect
          x={40}
          y={6}
          width={18}
          height={18}
          rx={5}
          className="fill-surface"
        />
        <circle cx={49} cy={15} r={4} className="fill-answer-3" />
      </g>
      <g className={`${POP} ${WAIT[3]}`}>
        <rect
          x={40}
          y={40}
          width={18}
          height={18}
          rx={5}
          className="fill-surface"
        />
        <circle cx={49} cy={49} r={4} className="fill-answer-5" />
      </g>
    </>
  ),
  presenter: (
    <>
      <rect
        x={8}
        y={10}
        width={48}
        height={32}
        rx={5}
        className="fill-surface"
      />
      <rect
        x={14}
        y={17}
        width={20}
        height={4}
        rx={2}
        className="fill-primary"
      />
      <rect
        x={14}
        y={26}
        width={26}
        height={3}
        rx={1.5}
        className="fill-primary/30"
      />
      <rect
        x={14}
        y={32}
        width={18}
        height={3}
        rx={1.5}
        className="fill-primary/30"
      />
      <path
        d="M32 42v8M24 56l8-6 8 6"
        className="fill-none stroke-primary"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className={`${POP} ${WAIT[2]}`}>
        <circle cx={44} cy={30} r={7} className="fill-error/25" />
        <circle cx={44} cy={30} r={3.5} className="fill-error" />
      </g>
    </>
  ),
  history: (
    <>
      <circle cx={32} cy={32} r={20} className="fill-surface" />
      <path
        d="M17 27A16 16 0 1 1 18 39"
        className={`fill-none stroke-answer-1 ${POP}`}
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      <path
        d="M11 24l6 3 2-6"
        className={`fill-none stroke-answer-1 ${POP}`}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 23v10l7 4"
        className={`fill-none stroke-primary ${POP} ${WAIT[2]}`}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  saved: (
    <>
      <rect
        x={12}
        y={10}
        width={36}
        height={44}
        rx={6}
        className="fill-surface"
      />
      <rect
        x={18}
        y={18}
        width={16}
        height={4}
        rx={2}
        className="fill-primary"
      />
      {[28, 35, 42].map((y, index) => (
        <rect
          key={y}
          x={18}
          y={y}
          width={[24, 20, 14][index]}
          height={3}
          rx={1.5}
          className={`fill-primary/30 ${WIDEN} ${WAIT[index]}`}
        />
      ))}
      <path
        d="M38 6h12v22l-6-5-6 5z"
        className={`fill-answer-3 ${DROP} ${WAIT[3]}`}
      />
    </>
  ),
  viewer: (
    <>
      <rect
        x={8}
        y={10}
        width={32}
        height={42}
        rx={5}
        className="fill-surface"
      />
      <rect
        x={14}
        y={17}
        width={16}
        height={4}
        rx={2}
        className="fill-primary"
      />
      {[26, 32, 38].map((y, index) => (
        <rect
          key={y}
          x={14}
          y={y}
          width={[20, 16, 18][index]}
          height={3}
          rx={1.5}
          className="fill-primary/30"
        />
      ))}
      <g className={`${POP} ${WAIT[2]}`}>
        <path d="M28 44q14-14 28 0-14 14-28 0z" className="fill-answer-1" />
        <circle cx={42} cy={44} r={5.5} className="fill-surface" />
        <circle cx={42} cy={44} r={2.5} className="fill-primary" />
      </g>
    </>
  ),
  editor: (
    <>
      <rect
        x={8}
        y={10}
        width={34}
        height={44}
        rx={5}
        className="fill-surface"
      />
      <rect
        x={14}
        y={17}
        width={16}
        height={4}
        rx={2}
        className="fill-primary"
      />
      {[26, 32].map((y, index) => (
        <rect
          key={y}
          x={14}
          y={y}
          width={[22, 18][index]}
          height={3}
          rx={1.5}
          className="fill-primary/30"
        />
      ))}
      <rect
        x={14}
        y={40}
        width={14}
        height={3}
        rx={1.5}
        className={`fill-answer-1 ${WIDEN} ${WAIT[1]}`}
      />
      <g className={`${RISE} ${WAIT[2]}`}>
        <path d="M50 12l6 6-21 21-8 2 2-8z" className="fill-answer-3" />
        <path d="M29 33l6 6-8 2z" className="fill-primary" />
      </g>
    </>
  ),
  owner: (
    <>
      <circle
        cx={14}
        cy={40}
        r={5}
        className={`fill-answer-1/50 ${POP} ${WAIT[3]}`}
      />
      <circle
        cx={50}
        cy={40}
        r={5}
        className={`fill-answer-4/50 ${POP} ${WAIT[4]}`}
      />
      <path d="M18 58a14 14 0 0 1 28 0z" className="fill-answer-2" />
      <circle cx={32} cy={35} r={9} className="fill-primary" />
      <path
        d="M22 23l5 3.5 5-8 5 8 5-3.5-2 8.5H24z"
        className={`fill-answer-3 ${DROP} ${WAIT[1]}`}
      />
    </>
  ),
};

export type ToolArtName = keyof typeof TOOL_ART;

/** Sits inside a `group` with `data-reveal`; see the motion classes above. */
export function ToolArt({ name }: { name: ToolArtName }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="size-16 shrink-0 rounded-2xl"
    >
      <rect width={64} height={64} className="fill-accent-muted" />
      {TOOL_ART[name]}
    </svg>
  );
}

/** A study partner from the chest up; `body` colours the jumper and hair. */
function StudyPartner({
  x,
  y,
  body,
  look = 0,
  isReactive = false,
}: {
  x: number;
  y: number;
  body: string;
  look?: -1 | 0 | 1;
  /** On the sign-in pages the partner reacts to the form; see `.auth-*` in landing.css. */
  isReactive?: boolean;
}): React.ReactElement {
  const eyes = look === 0 ? [x - 8, x + 8] : [x + look * 11];
  // A partner facing away from the form turns to look at it.
  const eyesClass = look === 1 ? "auth-eyes auth-eyes-turn" : "auth-eyes";

  return (
    <g>
      <path
        d={`M${x - 36} 262v-50a36 36 0 0 1 72 0v50z`}
        transform={`translate(0 ${y - 150})`}
        className={body}
      />
      <g className={isReactive ? "auth-head" : undefined}>
        <circle cx={x} cy={y} r={24} className="fill-primary" />
        <path
          d={`M${x - 24} ${y - 4}a24 24 0 0 1 48 0q-12-12-24-6t-24 6z`}
          className={body}
        />
        <g className={isReactive ? eyesClass : undefined}>
          {eyes.map((cx) => (
            <circle
              key={cx}
              cx={cx}
              cy={y + 2}
              r={2.8}
              className="fill-surface"
            />
          ))}
        </g>
        {look === 0 ? (
          <path
            d={`M${x - 7} ${y + 11}q7 5 14 0`}
            className={`fill-none stroke-surface ${isReactive ? "auth-smile" : ""}`}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        ) : null}
        {isReactive ? (
          <>
            {look === 0 ? (
              <circle
                cx={x}
                cy={y + 13}
                r={3.6}
                className="auth-gasp fill-surface"
              />
            ) : null}
            {eyes.map((cx) => (
              <ellipse
                key={cx}
                cx={cx}
                cy={y + 3}
                rx={9}
                ry={7}
                className={`auth-hand ${body}`}
              />
            ))}
          </>
        ) : null}
      </g>
    </g>
  );
}

const CLOSING_PEOPLE = [
  { x: 196, y: 138, body: "fill-answer-5", look: 1 },
  { x: 268, y: 120, body: "fill-answer-4", look: 1 },
  { x: 340, y: 106, body: "fill-answer-2", look: 0 },
  { x: 412, y: 122, body: "fill-answer-1", look: -1 },
  { x: 484, y: 136, body: "fill-answer-3", look: -1 },
] as const;
const CLOSING_TILES = [30, 92, 154];

/** Five study partners with their notes and tools, for the closing call to action. */
export function ClosingArt(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 600 260"
      role="img"
      aria-label="Illustration of five study partners holding laptops and notebooks, beside two room cards with checklists and a column of tool tiles."
      className={ART}
    >
      <circle cx={340} cy={130} r={120} className="fill-accent-bg/10" />

      {[
        { y: 30, rotate: -6 },
        { y: 136, rotate: -4 },
      ].map(({ y, rotate }, index) => (
        <g key={y} transform={`rotate(${rotate} 76 ${y + 40})`}>
          <rect
            x={14}
            y={y}
            width={124}
            height={84}
            rx={12}
            className="fill-surface"
          />
          <rect
            x={26}
            y={y + 14}
            width={64}
            height={7}
            rx={3.5}
            className="fill-accent-bg"
          />
          {[0, 1].map((row) => (
            <g key={row}>
              <rect
                x={26}
                y={y + 30 + row * 14}
                width={9}
                height={9}
                rx={2.5}
                className={
                  row === 0 || index === 0
                    ? "fill-accent-bg"
                    : "fill-primary/15"
                }
              />
              <rect
                x={42}
                y={y + 32 + row * 14}
                width={[70, 52][row]}
                height={5}
                rx={2.5}
                className="fill-primary/20"
              />
            </g>
          ))}
          {["fill-answer-1", "fill-answer-4", "fill-answer-2"].map(
            (fill, dot) => (
              <circle
                key={fill}
                cx={32 + dot * 12}
                cy={y + 70}
                r={6}
                className={`${fill} stroke-surface`}
                strokeWidth={2}
              />
            ),
          )}
        </g>
      ))}

      {CLOSING_PEOPLE.map(({ x, y, body, look }) => (
        <StudyPartner key={x} x={x} y={y} body={body} look={look} />
      ))}
      <path d="M236 216h56l6 44h-68z" className="fill-primary" />
      <circle
        cx={264}
        cy={238}
        r={7}
        className="fill-none stroke-surface"
        strokeWidth={2.5}
      />
      <g transform="rotate(-6 412 236)">
        <rect
          x={386}
          y={212}
          width={52}
          height={40}
          rx={4}
          className="fill-accent-bg"
        />
        <rect
          x={392}
          y={222}
          width={32}
          height={4}
          rx={2}
          className="fill-surface/70"
        />
        <rect
          x={392}
          y={232}
          width={22}
          height={4}
          rx={2}
          className="fill-surface/70"
        />
      </g>
      <path d="M458 222h52l4 38h-60z" className="fill-primary/80" />

      {CLOSING_TILES.map((y) => (
        <rect
          key={y}
          x={548}
          y={y}
          width={44}
          height={44}
          rx={12}
          className="fill-surface"
        />
      ))}
      <path
        d="M558 40h24a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-14l-6 5v-5h-4a4 4 0 0 1-4-4V44a4 4 0 0 1 4-4z"
        className="fill-accent-bg"
      />
      <path d="M557 106h10l3 3h12v15h-25z" className="fill-answer-2" />
      <path d="M560 186l18-18 5 5-18 18-7 2z" className="fill-answer-3" />
      <path
        d="M512 210l7 7 13-14"
        className="fill-none stroke-accent-bg"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={SPARKLE}
        transform="translate(170 40) scale(1)"
        className="fill-answer-3"
      />
      <path
        d={SPARKLE}
        transform="translate(500 50) scale(0.7)"
        className="fill-answer-5"
      />
      <Pointer
        name="Ana"
        x={440}
        y={30}
        width={44}
        className="fill-accent-bg"
      />
    </svg>
  );
}

/** A table edge with the floor below it, hiding the partners from the waist down. */
function AuthTable(): React.ReactElement {
  return (
    <>
      <rect
        x={96}
        y={288}
        width={288}
        height={18}
        rx={9}
        className="fill-primary"
      />
      <rect x={120} y={306} width={240} height={56} className="fill-surface" />
    </>
  );
}

/** What the partners say for each mood of the sign-in form (see AuthMood). */
const AUTH_LINES = [
  { mood: "idle", line: "We saved your seat" },
  { mood: "invalid", line: "Check that email" },
  { mood: "valid", line: "Looks good!" },
  { mood: "password", line: "We won’t look" },
  { mood: "peek", line: "Just a peek" },
];

/** One scene per sign-in page, drawn in a doorway to the room. */
const AUTH_ART = {
  login: {
    label:
      "Illustration of three study partners at a table inside a doorway, saying they saved your seat as your cursor arrives.",
    body: (
      <>
        <StudyPartner
          x={176}
          y={212}
          body="fill-answer-1"
          look={1}
          isReactive
        />
        <StudyPartner
          x={304}
          y={212}
          body="fill-answer-2"
          look={-1}
          isReactive
        />
        <StudyPartner x={240} y={184} body="fill-answer-4" isReactive />
        <AuthTable />
        <path d="M212 248h56l6 40h-68z" className="fill-primary" />
        <circle
          cx={240}
          cy={268}
          r={8}
          className="fill-none stroke-surface"
          strokeWidth={3}
        />
        <path d="M92 104v18l18-14z" className="fill-primary" />
        <rect
          x={40}
          y={52}
          width={176}
          height={56}
          rx={22}
          className="fill-primary"
        />
        <g
          textAnchor="middle"
          fontSize={17}
          fontWeight={700}
          className="fill-surface"
        >
          {AUTH_LINES.map(({ mood, line }) => (
            <text
              key={mood}
              x={128}
              y={86}
              className={`auth-say auth-say-${mood}`}
            >
              {line}
            </text>
          ))}
        </g>
        <Pointer
          name="You"
          x={372}
          y={236}
          width={40}
          className="fill-accent-bg"
        />
      </>
    ),
  },
  signup: {
    label:
      "Illustration of two study partners at a table with an empty seat beside them, where your cursor is about to join.",
    body: (
      <>
        <StudyPartner
          x={176}
          y={212}
          body="fill-answer-2"
          look={1}
          isReactive
        />
        <StudyPartner x={240} y={184} body="fill-answer-5" isReactive />
        <g
          className="fill-accent-muted stroke-accent-bg"
          strokeWidth={3.5}
          strokeDasharray="7 7"
          strokeLinecap="round"
        >
          <path d="M282 306v-44a36 36 0 0 1 72 0v44" />
          <circle cx={318} cy={212} r={24} />
        </g>
        <path
          d="M318 202v20M308 212h20"
          className="fill-none stroke-accent-bg"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <AuthTable />
        <rect
          x={262}
          y={44}
          width={178}
          height={72}
          rx={18}
          className="fill-surface"
        />
        <circle cx={294} cy={80} r={17} className="fill-answer-3" />
        <rect
          x={320}
          y={66}
          width={70}
          height={9}
          rx={4.5}
          className="fill-primary"
        />
        <rect
          x={320}
          y={86}
          width={96}
          height={7}
          rx={3.5}
          className="fill-primary/20"
        />
        <rect
          x={392}
          y={34}
          width={56}
          height={24}
          rx={12}
          className="fill-accent-bg"
        />
        <text
          x={420}
          y={51}
          textAnchor="middle"
          fontSize={12}
          fontWeight={700}
          className="fill-surface"
        >
          New
        </text>
        <Pointer
          name="You"
          x={332}
          y={228}
          width={40}
          className="fill-accent-bg"
        />
      </>
    ),
  },
  reset: {
    label:
      "Illustration of a padlock with a reset email on its way, a key and a check mark.",
    body: (
      <>
        <path
          d="M202 196v-42a38 38 0 0 1 76 0v42"
          className="fill-none stroke-primary"
          strokeWidth={18}
          strokeLinecap="round"
        />
        <rect
          x={166}
          y={190}
          width={148}
          height={124}
          rx={26}
          className="fill-answer-1"
        />
        <circle cx={240} cy={240} r={15} className="fill-surface" />
        <rect
          x={233}
          y={246}
          width={14}
          height={34}
          rx={6}
          className="fill-surface"
        />
        <path
          d="M352 148q-18 34-44 46"
          className="fill-none stroke-primary"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="2 10"
        />
        <g transform="rotate(8 384 100)">
          <rect
            x={326}
            y={62}
            width={116}
            height={78}
            rx={12}
            className="fill-surface"
          />
          <path
            d="M334 72l50 36 50-36"
            className="fill-none stroke-answer-3"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="rotate(-24 110 300)">
          <circle
            cx={84}
            cy={300}
            r={20}
            className="fill-none stroke-answer-3"
            strokeWidth={12}
          />
          <rect
            x={102}
            y={294}
            width={72}
            height={12}
            rx={6}
            className="fill-answer-3"
          />
          <rect
            x={150}
            y={302}
            width={10}
            height={16}
            rx={3}
            className="fill-answer-3"
          />
          <rect
            x={166}
            y={302}
            width={8}
            height={12}
            rx={3}
            className="fill-answer-3"
          />
        </g>
        <circle cx={334} cy={300} r={26} className="fill-answer-2" />
        <path
          d="M322 300l9 9 16-18"
          className="fill-none stroke-surface"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
};

export type AuthArtName = keyof typeof AUTH_ART;

export function AuthArt({ name }: { name: AuthArtName }): React.ReactElement {
  const { label, body } = AUTH_ART[name];

  return (
    <svg viewBox="0 0 480 362" role="img" aria-label={label} className={ART}>
      <circle cx={380} cy={90} r={96} className="fill-accent-bg/10" />
      <circle cx={70} cy={300} r={60} className="fill-accent-bg/10" />
      {name === "reset" ? null : (
        <path
          d="M120 362V160a120 120 0 0 1 240 0v202z"
          className="fill-surface"
        />
      )}
      {body}
      <path
        d={SPARKLE}
        transform="translate(60 150) scale(1.1)"
        className="fill-answer-3"
      />
      <path
        d={SPARKLE}
        transform="translate(424 190) scale(0.8)"
        className="fill-answer-5"
      />
    </svg>
  );
}

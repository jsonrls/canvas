/*
 * Qollab's own icons for the landing page. Each is drawn on a 24px grid in two
 * tones of `currentColor`: a solid shape and a soft one at 35%, so the text
 * colour classes callers already pass (`text-accent`, `text-surface`) still
 * apply. Props mirror the app icons, so they swap in one for one.
 */

export interface LandingIconProps {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export type LandingIconComponent = (
  props: LandingIconProps,
) => React.ReactElement;

const SOFT = 0.35;

function Glyph({
  size = 20,
  className = "",
  children,
  ...rest
}: LandingIconProps & { children: React.ReactNode }): React.ReactElement {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** A rounded stroke in the current colour, for lines inside a glyph. */
function Stroke({
  d,
  width = 2.4,
  opacity,
}: {
  d: string;
  width?: number;
  opacity?: number;
}): React.ReactElement {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    />
  );
}

export function Sparkles(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <path d="M10 3.5Q11 12 18.5 13 11 14 10 22.5 9 14 1.5 13 9 12 10 3.5z" />
      <path
        d="M19 1Q19.6 4.4 23 5 19.6 5.6 19 9 18.4 5.6 15 5 18.4 4.4 19 1z"
        opacity={SOFT}
      />
    </Glyph>
  );
}

export function PenTool(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <rect x={2.5} y={3} width={14} height={18} rx={3} opacity={SOFT} />
      <path d="M17.6 3.4a2.1 2.1 0 0 1 3 3L11 16l-4.5 1.5L8 13z" />
    </Glyph>
  );
}

export function DoorOpen(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <rect x={4} y={3} width={16} height={18.5} rx={2} opacity={SOFT} />
      <path d="M6 4.6 15 2.5v20L6 21z" />
      <circle cx={12.4} cy={12.5} r={1.2} opacity={SOFT} />
    </Glyph>
  );
}

export function RefreshCw(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <Stroke d="M20 11a8 8 0 0 0-14.2-4.6M5 2.5v4h4" />
      <Stroke d="M4 13a8 8 0 0 0 14.2 4.6M19 21.5v-4h-4" opacity={0.55} />
    </Glyph>
  );
}

export function Layers3(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <path
        d="M3 17 12 21.5 21 17 18.6 15.8 12 19.1 5.4 15.8z"
        opacity={SOFT}
      />
      <path
        d="M3 12.5 12 17 21 12.5 18.6 11.3 12 14.6 5.4 11.3z"
        opacity={0.6}
      />
      <path d="M12 2.5 21 7.5 12 12.5 3 7.5z" />
    </Glyph>
  );
}

export function Highlighter(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <rect x={2} y={20.5} width={13} height={2.5} rx={1.25} opacity={SOFT} />
      <path d="M14.6 2.6a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L13 17.8 6.2 11z" />
      <path d="M6.2 11 13 17.8 11 19.8H6.5L4 17.3v-4.1z" opacity={0.6} />
    </Glyph>
  );
}

export function Presentation(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <rect x={2} y={2.5} width={20} height={14} rx={2.5} opacity={SOFT} />
      <rect x={6} y={9} width={2.6} height={4.5} rx={1} />
      <rect x={10.7} y={6} width={2.6} height={7.5} rx={1} />
      <rect x={15.4} y={7.8} width={2.6} height={5.7} rx={1} />
      <Stroke d="M12 16.5v3M8 22.5l4-3 4 3" width={2.2} />
    </Glyph>
  );
}

export function Mic(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <rect x={8.5} y={1.5} width={7} height={12.5} rx={3.5} />
      <Stroke
        d="M5 11a7 7 0 0 0 14 0M12 18v4M8.5 22h7"
        width={2.2}
        opacity={0.55}
      />
    </Glyph>
  );
}

export function ChartColumnBig(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <rect x={3} y={11} width={4.5} height={10.5} rx={1.5} opacity={SOFT} />
      <rect x={9.75} y={3} width={4.5} height={18.5} rx={1.5} />
      <rect x={16.5} y={7.5} width={4.5} height={14} rx={1.5} opacity={0.65} />
    </Glyph>
  );
}

export function Route(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <path
        d="M6 18.5c0-5 12-3.5 12-8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="1 4"
        opacity={0.55}
      />
      <circle cx={6} cy={19} r={3} />
      <path d="M18 1.5A4.5 4.5 0 0 1 22.5 6c0 3.3-4.5 7.5-4.5 7.5S13.5 9.3 13.5 6A4.5 4.5 0 0 1 18 1.5z" />
    </Glyph>
  );
}

export function BrainCircuit(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <path d="M3.5 7.5 13 4.5l3.8 13.2-9.5 3z" opacity={SOFT} />
      <rect
        x={8}
        y={4.5}
        width={12}
        height={16}
        rx={2.5}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
      />
      <rect x={11} y={8.5} width={6} height={2.2} rx={1.1} />
      <rect x={11} y={12.8} width={4} height={2.2} rx={1.1} />
    </Glyph>
  );
}

export function ShieldCheck(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <path
        d="M12 1.5 20.5 5v6.5c0 5.2-3.6 9.1-8.5 11-4.9-1.9-8.5-5.8-8.5-11V5z"
        opacity={SOFT}
      />
      <Stroke d="M8.2 12 11 14.8 16 9.2" width={2.6} />
    </Glyph>
  );
}

export function MessageCircleQuestion(
  props: LandingIconProps,
): React.ReactElement {
  return (
    <Glyph {...props}>
      <path
        d="M4 3h16a2.5 2.5 0 0 1 2.5 2.5v10A2.5 2.5 0 0 1 20 18h-8l-5.5 4.5V18H4a2.5 2.5 0 0 1-2.5-2.5v-10A2.5 2.5 0 0 1 4 3z"
        opacity={SOFT}
      />
      <Stroke
        d="M9.4 8.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.1-2.6 3.8"
        width={2.3}
      />
      <circle cx={12} cy={15.6} r={1.3} />
    </Glyph>
  );
}

export function Check(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <circle cx={12} cy={12} r={10.5} opacity={0.2} />
      <Stroke d="M7 12.4 10.4 15.8 17 8.6" width={2.8} />
    </Glyph>
  );
}

/** A price tag, for the pricing section's label. */
export function PriceTag(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <path
        d="M2.5 12.6V4A1.5 1.5 0 0 1 4 2.5h8.6l9 9a1.6 1.6 0 0 1 0 2.2l-7.9 7.9a1.6 1.6 0 0 1-2.2 0z"
        opacity={SOFT}
      />
      <circle cx={7.5} cy={7.5} r={2} />
      <Stroke d="M11.5 13.5l3-3" width={2.4} />
    </Glyph>
  );
}

export function ArrowRight(props: LandingIconProps): React.ReactElement {
  return (
    <Glyph {...props}>
      <Stroke d="M4.5 12h14M13 5.5l6.5 6.5-6.5 6.5" width={2.4} />
    </Glyph>
  );
}

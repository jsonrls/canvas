"use client";

import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useRef } from "react";

import {
  FILLS,
  MOVE,
  STROKES,
} from "@/components/collaboration/live/live-charts";
import type { LiveArea, LivePoint } from "@/lib/live/activities";
import { gridPercent, gridValue, hillPath } from "@/lib/live/shapes";

const GRID_LABEL_LIMIT = 16;

function short(label: string): string {
  return label.length > GRID_LABEL_LIMIT
    ? `${label.slice(0, GRID_LABEL_LIMIT - 1)}…`
    : label;
}

/** Named, coloured circles on two axes. */
export function GridPlot({
  labels,
  onPick,
  points,
  xLabel,
  yLabel,
}: {
  labels: string[];
  onPick?(point: LivePoint): void;
  points: (LivePoint | null)[];
  xLabel: string;
  yLabel: string;
}): React.ReactElement {
  const pick = (event: React.PointerEvent<SVGSVGElement>): void => {
    const box = event.currentTarget.getBoundingClientRect();
    onPick?.({
      x: gridValue(((event.clientX - box.left) / box.width) * 100),
      y: gridValue(100 - ((event.clientY - box.top) / box.height) * 100),
    });
  };

  return (
    <VStack gap={2} className="w-full max-w-lg">
      <Text type="supporting">↑ {yLabel}</Text>
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label={`Grid of ${labels.length} items by ${xLabel} and ${yLabel}`}
        className={`w-full rounded-2xl bg-muted ${onPick ? "cursor-crosshair touch-none select-none" : ""}`}
        onPointerDown={
          onPick
            ? (event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                pick(event);
              }
            : undefined
        }
        onPointerMove={
          onPick
            ? (event) => {
                if (event.buttons > 0) pick(event);
              }
            : undefined
        }
      >
        <path
          d="M50 4V96M4 50H96"
          className="stroke-border"
          strokeWidth="0.4"
          fill="none"
        />
        {points.map((point, index) => {
          if (!point) return null;
          const x = gridPercent(point.x);
          const y = 100 - gridPercent(point.y);
          return (
            <g
              key={`${index}-${labels[index]}`}
              transform={`translate(${x} ${y})`}
              className={onPick ? undefined : MOVE}
            >
              <title>{`${labels[index]}: ${xLabel} ${point.x}, ${yLabel} ${point.y}`}</title>
              <circle
                r="3.4"
                className={`${FILLS[index]} stroke-surface`}
                strokeWidth="0.8"
              />
              <text
                y={y > 88 ? -5.4 : 7.4}
                fontSize="4"
                fontWeight="600"
                textAnchor={x < 30 ? "start" : x > 70 ? "end" : "middle"}
                className="fill-primary"
              >
                {short(labels[index])}
              </text>
            </g>
          );
        })}
      </svg>
      <Text type="supporting" className="self-end">
        {xLabel} →
      </Text>
    </VStack>
  );
}

const INSET = 5;

/** Percent along a hill's line. */
function along(value: number, min: number, max: number): string {
  return `${INSET + ((value - min) / (max - min)) * (100 - 2 * INSET)}%`;
}

function Hill({
  children,
  color,
  counts,
  label,
  max,
  min,
  places,
  ticks,
}: {
  children?: React.ReactNode;
  color: number;
  counts: number[];
  label: string;
  max: number;
  min: number;
  places?: number[];
  ticks: number[];
}): React.ReactElement {
  return (
    <svg role="img" aria-label={label} className="h-36 w-full">
      <svg
        x={`${INSET}%`}
        y="18"
        width={`${100 - 2 * INSET}%`}
        height="80"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={hillPath(counts, places)}
          className={FILLS[color]}
          opacity="0.35"
        />
      </svg>
      <line
        x1={`${INSET}%`}
        x2={`${100 - INSET}%`}
        y1="98"
        y2="98"
        className={STROKES[color]}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {ticks.map((tick) => (
        <text
          key={tick}
          x={along(tick, min, max)}
          y="136"
          textAnchor="middle"
          className="fill-secondary text-sm"
        >
          {tick}
        </text>
      ))}
      {children}
    </svg>
  );
}

/** How a statement was rated: a hill, with the average in a circle. */
export function ScaleHill({
  average,
  color,
  counts,
}: {
  average: number | null;
  color: number;
  counts: number[];
}): React.ReactElement {
  const spoken = counts
    .map((count, index) => `${count} rated ${index + 1}`)
    .join(", ");
  return (
    <Hill
      color={color}
      counts={counts}
      label={`Average ${average ?? "none"}. ${spoken}.`}
      min={1}
      max={counts.length}
      ticks={counts.map((_, index) => index + 1)}
    >
      {average === null ? null : (
        <>
          <circle
            cx={along(average, 1, counts.length)}
            cy="98"
            r="19"
            className={`fill-surface ${STROKES[color]} ${MOVE}`}
            strokeWidth="3"
          />
          <text
            x={along(average, 1, counts.length)}
            y="98"
            textAnchor="middle"
            dominantBaseline="central"
            className={`fill-primary text-base font-bold ${MOVE}`}
          >
            {average}
          </text>
        </>
      )}
    </Hill>
  );
}

/** Guesses along their range, with the answer marked once it is known. */
export function NumberLine({
  answer,
  buckets,
  max,
  min,
}: {
  answer: number | undefined;
  buckets: { from: number; to: number; count: number }[];
  max: number;
  min: number;
}): React.ReactElement {
  const spoken = buckets
    .filter((bucket) => bucket.count > 0)
    .map(({ count, from, to }) =>
      from === to ? `${count} at ${from}` : `${count} from ${from} to ${to}`,
    )
    .join(", ");
  return (
    <Hill
      color={0}
      counts={buckets.map((bucket) => bucket.count)}
      label={`Guesses: ${spoken || "none"}.`}
      min={min}
      max={max}
      places={buckets.map(
        ({ from, to }) => (((from + to) / 2 - min) / (max - min)) * 100,
      )}
      ticks={[min, max]}
    >
      {answer === undefined ? null : (
        <>
          <line
            x1={along(answer, min, max)}
            x2={along(answer, min, max)}
            y1="22"
            y2="104"
            className="stroke-success"
            strokeWidth="3"
            strokeDasharray="6 4"
          />
          <text
            x={along(answer, min, max)}
            y="14"
            textAnchor={
              answer - min < (max - min) * 0.15
                ? "start"
                : max - answer < (max - min) * 0.15
                  ? "end"
                  : "middle"
            }
            className="fill-primary text-base font-bold"
          >
            Answer: {answer}
          </text>
        </>
      )}
    </Hill>
  );
}

/** An image with pins at percentages of its width and height. */
export function PinnedImage({
  alt,
  area,
  onArea,
  onPick,
  pins,
  src,
}: {
  alt: string;
  /** The correct area, drawn under the pins. */
  area?: LiveArea | null;
  /** Called while a rectangle is dragged out on the image. */
  onArea?(area: LiveArea): void;
  onPick?(point: LivePoint): void;
  pins: LivePoint[];
  src: string;
}): React.ReactElement {
  const anchor = useRef<LivePoint | null>(null);
  const at = (event: React.PointerEvent<HTMLElement>): LivePoint => {
    const box = event.currentTarget.getBoundingClientRect();
    const inside = (value: number): number =>
      Math.min(100, Math.max(0, value * 100));
    return {
      x: inside((event.clientX - box.left) / box.width),
      y: inside((event.clientY - box.top) / box.height),
    };
  };

  return (
    <VStack
      className={`relative w-full max-w-2xl overflow-hidden rounded-2xl ${onPick || onArea ? "cursor-crosshair" : ""} ${onArea ? "touch-none select-none" : ""}`}
      onPointerDown={
        onArea
          ? (event: React.PointerEvent<HTMLElement>) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              anchor.current = at(event);
            }
          : undefined
      }
      onPointerMove={
        onArea
          ? (event: React.PointerEvent<HTMLElement>) => {
              const from = anchor.current;
              if (!from || event.buttons === 0) return;
              const to = at(event);
              onArea({
                x: Math.min(from.x, to.x),
                y: Math.min(from.y, to.y),
                width: Math.abs(to.x - from.x),
                height: Math.abs(to.y - from.y),
              });
            }
          : undefined
      }
      // A shortcut for pointers; the sliders beside it do the same by keyboard.
      onClick={
        onPick
          ? (event: React.MouseEvent<HTMLElement>) => {
              const box = event.currentTarget.getBoundingClientRect();
              onPick({
                x: ((event.clientX - box.left) / box.width) * 100,
                y: ((event.clientY - box.top) / box.height) * 100,
              });
            }
          : undefined
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- member-only route of unknown size; the optimizer has no session */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="block h-auto w-full"
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full"
      >
        {area ? (
          <rect
            x={area.x}
            y={area.y}
            width={area.width}
            height={area.height}
            className="fill-success/25 stroke-success"
            strokeWidth="3"
            strokeDasharray="8 5"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        {/* Zero-length round strokes stay circular however the image stretches. */}
        {pins.map((pin, index) => (
          <g key={index} strokeLinecap="round">
            <path
              d={`M${pin.x} ${pin.y}h0`}
              className="stroke-surface"
              strokeWidth="18"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={`M${pin.x} ${pin.y}h0`}
              className="stroke-accent"
              strokeWidth="13"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>
    </VStack>
  );
}

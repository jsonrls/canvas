import { GRID_MAX, type LiveArea } from "@/lib/live/activities";

const GRID_EDGE = 8;
const GRID_SPAN = 100 - 2 * GRID_EDGE;

function evenly(count: number): number[] {
  return Array.from({ length: count }, (_, index) =>
    count === 1 ? 0 : (index / (count - 1)) * 100,
  );
}

/**
 * A filled hill through counts at the given percentages, in a 100 by 100 box.
 * The curve is level at every count, so it never rises above the tallest one.
 */
export function hillPath(
  counts: number[],
  places = evenly(counts.length),
): string {
  const highest = Math.max(...counts, 1);
  const y = counts.map((count) => 100 - (count / highest) * 100);
  let path = `M${places[0]} 100L${places[0]} ${y[0]}`;
  if (counts.length === 1) return `${path}L100 ${y[0]}L100 100Z`;
  for (let index = 1; index < counts.length; index += 1) {
    const middle = (places[index - 1] + places[index]) / 2;
    path += `C${middle} ${y[index - 1]} ${middle} ${y[index]} ${places[index]} ${y[index]}`;
  }
  return `${path}L${places[counts.length - 1]} 100Z`;
}

/** Where a grid step sits, in percent; points stay clear of the frame. */
export function gridPercent(value: number): number {
  return GRID_EDGE + (value / GRID_MAX) * GRID_SPAN;
}

/** The nearest grid step to a place given in percent. */
export function gridValue(percent: number): number {
  const value = Math.round(((percent - GRID_EDGE) / GRID_SPAN) * GRID_MAX);
  return Math.min(GRID_MAX, Math.max(0, value));
}

export function ordinal(place: number): string {
  const teens = place % 100 >= 11 && place % 100 <= 13;
  return `${place}${teens ? "th" : (["th", "st", "nd", "rd"][place % 10] ?? "th")}`;
}

const AREA_MIN = 5;

/** The nearest area the rules accept: at least 5% each way, inside the image. */
export function fitArea(area: LiveArea): LiveArea {
  const size = (value: number): number =>
    Math.min(100, Math.max(AREA_MIN, Math.round(value)));
  const width = size(area.width);
  const height = size(area.height);
  return {
    x: Math.min(100 - width, Math.max(0, Math.round(area.x))),
    y: Math.min(100 - height, Math.max(0, Math.round(area.y))),
    width,
    height,
  };
}

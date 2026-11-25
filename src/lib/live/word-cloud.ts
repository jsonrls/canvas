const MIN_SIZE = 20;
const MAX_SIZE = 88;
const LINE_HEIGHT = 1.15;
const GAP = 6;
const ANSWER_COLORS = 6;

export interface PackedWord {
  text: string;
  count: number;
  size: number;
  /** Centre of the word, in pixels from the top left. */
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A colour slot from the text itself, so a word keeps it as votes arrive. */
export function answerColor(text: string): number {
  let hash = 0;
  for (const letter of text) {
    hash = (hash * 31 + letter.codePointAt(0)!) % 1_000_003;
  }
  return hash % ANSWER_COLORS;
}

function overlaps(a: PackedWord, b: PackedWord): boolean {
  return (
    Math.abs(a.x - b.x) * 2 < a.width + b.width &&
    Math.abs(a.y - b.y) * 2 < a.height + b.height
  );
}

/**
 * Packs words into a cloud, most common first from the centre outwards along a
 * spiral. Words must be sorted by count. The same input gives the same cloud.
 */
export function packWords(
  words: { text: string; count: number }[],
  width: number,
  measure: (text: string, size: number) => number,
): { words: PackedWord[]; height: number } {
  if (words.length === 0 || width <= 0) return { words: [], height: 0 };
  const high = words[0].count;
  const low = words[words.length - 1].count;
  const largest = Math.min(MAX_SIZE, Math.max(36, width / 7));
  // A flat result stays modest instead of filling the screen.
  const flat = words.length > 12 ? 0.1 : 0.35;
  const share = (count: number): number =>
    high === low ? flat : (count - low) / (high - low);
  // Clouds are wider than tall, except where there is no width to spare.
  const stretch = width >= 480 ? 2.2 : 1;

  const placed: PackedWord[] = [];
  let previousSize = Infinity;
  for (const { count, text } of words) {
    let size = Math.min(
      previousSize,
      Math.round(MIN_SIZE + (largest - MIN_SIZE) * share(count)),
    );
    let textWidth = measure(text, size) + GAP;
    if (textWidth > width) {
      size = Math.floor((size * (width - GAP)) / measure(text, size));
      textWidth = Math.min(width, measure(text, size) + GAP);
    } else {
      previousSize = size;
    }
    const word: PackedWord = {
      text,
      count,
      size,
      x: 0,
      y: 0,
      width: textWidth,
      height: size * LINE_HEIGHT,
    };
    const reach = (width - textWidth) / 2;
    let angle = 0;
    do {
      const radius = angle * 1.6;
      const x = radius * stretch * Math.cos(angle);
      // Held inside the edges, so a wide word moves down until it fits.
      word.x = Math.min(reach, Math.max(-reach, x));
      word.y = radius * Math.sin(angle);
      angle += 0.15;
    } while (placed.some((other) => overlaps(other, word)));
    placed.push(word);
  }

  const top = Math.min(...placed.map((word) => word.y - word.height / 2));
  const bottom = Math.max(...placed.map((word) => word.y + word.height / 2));
  return {
    words: placed.map((word) => ({
      ...word,
      x: word.x + width / 2,
      y: word.y - top,
    })),
    height: bottom - top,
  };
}

import {
  getElementBounds,
  type WhiteboardElement,
  type WhiteboardPoint,
} from "./model";

interface WhiteboardAnswerPlacement {
  question: string;
  targetBounds: { height: number; width: number; x: number; y: number };
  targetId: string;
}

function boundsCenter(bounds: {
  height: number;
  width: number;
  x: number;
  y: number;
}): WhiteboardPoint {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

function pointDistance(
  first: WhiteboardPoint,
  second: WhiteboardPoint,
): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function distanceToBounds(
  point: WhiteboardPoint,
  bounds: { height: number; width: number; x: number; y: number },
): number {
  const dx = Math.max(
    bounds.x - point.x,
    0,
    point.x - (bounds.x + bounds.width),
  );
  const dy = Math.max(
    bounds.y - point.y,
    0,
    point.y - (bounds.y + bounds.height),
  );
  return Math.hypot(dx, dy);
}

function isPointNearBounds(
  point: WhiteboardPoint,
  bounds: { height: number; width: number; x: number; y: number },
  padding: number,
): boolean {
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.width + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.height + padding
  );
}

function drawPathLength(points: WhiteboardPoint[]): number {
  return points
    .slice(1)
    .reduce(
      (length, point, index) => length + pointDistance(points[index], point),
      0,
    );
}

function isCircleLikeElement(element: WhiteboardElement): boolean {
  if (element.type === "ellipse") {
    const bounds = getElementBounds(element);
    return bounds.width >= 44 && bounds.height >= 32;
  }

  if (element.type !== "draw" || element.points.length < 12) return false;

  const bounds = getElementBounds(element);
  const width = Math.max(1, bounds.width);
  const height = Math.max(1, bounds.height);
  const ratio = width / height;
  const diagonal = Math.hypot(width, height);
  const pathLength = drawPathLength(element.points);
  const endpoints = [element.points[0], element.points.at(-1)].filter(
    (point): point is WhiteboardPoint => Boolean(point),
  );
  const endpointGap =
    endpoints.length === 2
      ? pointDistance(endpoints[0], endpoints[1])
      : Infinity;

  return (
    width >= 64 &&
    height >= 40 &&
    ratio >= 0.18 &&
    ratio <= 8 &&
    (endpointGap <= diagonal * 0.38 || pathLength >= diagonal * 1.75)
  );
}

function textCenter(element: WhiteboardElement): WhiteboardPoint {
  const bounds = getElementBounds(element);
  return {
    x: bounds.x + Math.max(120, bounds.width) / 2,
    y: bounds.y + Math.max(36, bounds.height) / 2,
  };
}

function textInsideBounds(
  textElement: WhiteboardElement,
  bounds: { height: number; width: number; x: number; y: number },
): boolean {
  return isPointNearBounds(textCenter(textElement), bounds, 18);
}

function getDirectedElementEndpoints(
  element: WhiteboardElement,
): Array<{ end: WhiteboardPoint; start: WhiteboardPoint }> {
  if (element.type === "arrow" || element.type === "line") {
    const start = { x: element.x, y: element.y };
    const end = { x: element.x + element.width, y: element.y + element.height };
    return [
      { start, end },
      { start: end, end: start },
    ];
  }

  if (
    element.type === "draw" &&
    !isCircleLikeElement(element) &&
    element.points.length >= 2
  ) {
    const start = element.points[0];
    const end = element.points[element.points.length - 1];
    const bounds = getElementBounds(element);
    if (
      drawPathLength(element.points) < 48 ||
      Math.hypot(bounds.width, bounds.height) < 48
    ) {
      return [];
    }
    return [
      { start, end },
      { start: end, end: start },
    ];
  }

  return [];
}

export function findWhiteboardAnswerPlacement(
  elements: WhiteboardElement[],
  selectedId: string | null,
): WhiteboardAnswerPlacement | null {
  const textElements = elements.filter(
    (element) => element.type === "text" && element.text.trim().length > 0,
  );
  const circleElements = elements.filter(isCircleLikeElement);

  if (textElements.length === 0 || circleElements.length < 2) return null;

  const questionCandidates = circleElements.flatMap((circle) => {
    const bounds = getElementBounds(circle);
    return textElements
      .filter((textElement) => textInsideBounds(textElement, bounds))
      .map((textElement) => ({
        circle,
        circleBounds: bounds,
        question: textElement.text.trim(),
        textElement,
      }));
  });

  if (questionCandidates.length === 0) return null;

  const selectedElement = selectedId
    ? (elements.find((element) => element.id === selectedId) ?? null)
    : null;
  const prioritizedQuestions = [...questionCandidates].sort((first, second) => {
    const firstSelected =
      first.circle.id === selectedId || first.textElement.id === selectedId;
    const secondSelected =
      second.circle.id === selectedId || second.textElement.id === selectedId;
    if (firstSelected !== secondSelected) return firstSelected ? -1 : 1;
    return second.circle.createdAt.localeCompare(first.circle.createdAt);
  });
  const possibleTargets = circleElements.filter((circle) => {
    if (circle.id === selectedId && selectedElement?.type !== "text")
      return false;
    const bounds = getElementBounds(circle);
    return !textElements.some((textElement) =>
      textInsideBounds(textElement, bounds),
    );
  });

  let best: {
    placement: WhiteboardAnswerPlacement;
    score: number;
  } | null = null;

  for (const question of prioritizedQuestions) {
    for (const target of possibleTargets) {
      if (target.id === question.circle.id) continue;

      const targetBounds = getElementBounds(target);
      const sourcePadding = Math.max(
        88,
        Math.hypot(question.circleBounds.width, question.circleBounds.height) *
          0.25,
      );
      const targetPadding = Math.max(
        96,
        Math.hypot(targetBounds.width, targetBounds.height) * 0.24,
      );

      for (const connector of elements.flatMap(getDirectedElementEndpoints)) {
        if (
          !isPointNearBounds(
            connector.start,
            question.circleBounds,
            sourcePadding,
          ) ||
          !isPointNearBounds(connector.end, targetBounds, targetPadding)
        ) {
          continue;
        }

        const score =
          distanceToBounds(connector.start, question.circleBounds) +
          distanceToBounds(connector.end, targetBounds) * 1.6;
        if (!best || score < best.score) {
          best = {
            placement: {
              question: question.question,
              targetBounds,
              targetId: target.id,
            },
            score,
          };
        }
      }

      if (!best && possibleTargets.length === 1) {
        const sourceCenter = boundsCenter(question.circleBounds);
        const targetCenter = boundsCenter(targetBounds);
        if (
          targetCenter.x > sourceCenter.x ||
          targetCenter.y > sourceCenter.y
        ) {
          best = {
            placement: {
              question: question.question,
              targetBounds,
              targetId: target.id,
            },
            score: 10_000 + pointDistance(sourceCenter, targetCenter),
          };
        }
      }
    }
  }

  return best?.placement ?? null;
}

export function wrapAnswerForTarget(
  answer: string,
  targetWidth: number,
): string {
  const maxLineLength = Math.max(
    18,
    Math.min(58, Math.floor(Math.max(160, targetWidth - 48) / 13)),
  );
  const sourceLines = answer
    .replace(/\s+\n/gu, "\n")
    .split(/\n+/u)
    .map((line) => line.trim())
    .filter(Boolean);
  const wrapped: string[] = [];

  for (const sourceLine of sourceLines) {
    const words = sourceLine.split(/\s+/u);
    let line = "";

    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxLineLength && line) {
        wrapped.push(line);
        line = word;
      } else {
        line = next;
      }
    }

    if (line) wrapped.push(line);
  }

  return wrapped.slice(0, 7).join("\n");
}

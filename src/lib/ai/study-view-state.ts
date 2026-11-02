import type { StudyPack } from "./study-pack";

export function studyTabIndex(
  key: string,
  currentIndex: number,
  count: number,
): number | null {
  if (key === "ArrowRight") return (currentIndex + 1) % count;
  if (key === "ArrowLeft") return (currentIndex - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

export function toggleRevealedCard(
  current: Set<number>,
  index: number,
): Set<number> {
  const next = new Set(current);
  if (next.has(index)) next.delete(index);
  else next.add(index);
  return next;
}

export function quizScore(
  quiz: StudyPack["quiz"],
  answers: Record<number, number>,
) {
  return {
    answeredCount: Object.keys(answers).length,
    correctCount: Object.entries(answers).filter(
      ([questionIndex, answerIndex]) =>
        quiz[Number(questionIndex)]?.answerIndex === answerIndex,
    ).length,
  };
}

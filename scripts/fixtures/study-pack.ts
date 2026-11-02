import type { StudyPack } from "../../src/lib/ai/study-pack";

export const studyPackFixture: StudyPack = {
  summary: {
    title: "Cardiovascular pharmacology review",
    overview:
      "The note compares receptor effects, hemodynamic responses, and adverse-effect patterns that help distinguish common cardiovascular drug classes.",
    keyPoints: [
      "Beta-one blockade lowers heart rate and contractility.",
      "Afterload reduction can improve forward flow in selected conditions.",
      "Medication effects should be connected to the underlying physiology.",
    ],
    openQuestions: ["Which findings separate toxicity from expected effect?"],
  },
  quiz: Array.from({ length: 3 }, (_, index) => ({
    question: `Which mechanism best explains study finding ${index + 1}?`,
    options: ["Mechanism A", "Mechanism B", "Mechanism C", "Mechanism D"],
    answerIndex: index % 4,
    explanation:
      "The shared notes connect this finding to the selected mechanism.",
  })),
  flashcards: Array.from({ length: 4 }, (_, index) => ({
    front: `Prompt ${index + 1}`,
    back: `Grounded answer ${index + 1} from the notes.`,
  })),
  recommendations: [
    {
      kind: "practice",
      title: "Compare adjacent mechanisms",
      rationale: "The notes list effects but need a direct contrast.",
      nextStep: "Build a two-column mechanism and adverse-effect table.",
    },
    {
      kind: "clarify",
      title: "Resolve the remaining toxicity question",
      rationale: "One open question remains in the discussion summary.",
      nextStep: "Verify the finding against the assigned pharmacology source.",
    },
  ],
  misconceptions: [
    {
      confidence: "low",
      suspectedClaim: "A reduced heart rate always indicates toxicity.",
      correction:
        "A reduced heart rate can be an expected pharmacologic effect; clinical context and severity determine concern.",
      whyItMatters:
        "Confusing expected effect with toxicity can distort board-style reasoning.",
    },
  ],
};

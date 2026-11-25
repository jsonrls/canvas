import type { IconComponent } from "@/components/ui/icons";
import {
  BookCheck,
  CircleHelp,
  Layers3,
  Route,
  ShieldAlert,
} from "@/components/ui/icons";

export type StudyView =
  "flashcards" | "misconceptions" | "quiz" | "recommendations" | "summary";

export interface ViewDefinition {
  description: string;
  icon: IconComponent;
  id: StudyView;
  label: string;
  shortLabel: string;
  /** Colours of the view's tab: its icon, and its fill and edge when chosen. */
  tab: { icon: string; selected: string };
}

export const MIN_SOURCE_CHARACTERS = 80;
export const VIEW_DEFINITIONS: readonly ViewDefinition[] = [
  {
    icon: BookCheck,
    description: "The main ideas, plus questions the notes leave open.",
    id: "summary",
    label: "Discussion summary",
    shortLabel: "Summary",
    tab: {
      icon: "text-answer-1",
      selected: "border-answer-1 bg-answer-1/15",
    },
  },
  {
    icon: CircleHelp,
    description: "Questions with an explanation for each answer.",
    id: "quiz",
    label: "Practice quiz",
    shortLabel: "Quiz",
    tab: {
      icon: "text-answer-5",
      selected: "border-answer-5 bg-answer-5/15",
    },
  },
  {
    icon: Layers3,
    description: "Prompt and answer cards to flip through.",
    id: "flashcards",
    label: "Flashcard deck",
    shortLabel: "Cards",
    tab: {
      icon: "text-answer-4",
      selected: "border-answer-4 bg-answer-4/15",
    },
  },
  {
    icon: Route,
    description: "What to study next, based on gaps in the notes.",
    id: "recommendations",
    label: "Content recommendations",
    shortLabel: "Next steps",
    tab: {
      icon: "text-answer-2",
      selected: "border-answer-2 bg-answer-2/15",
    },
  },
  {
    icon: ShieldAlert,
    description: "Claims in the notes that may need checking.",
    id: "misconceptions",
    label: "Misconception review",
    shortLabel: "Review",
    tab: {
      icon: "text-answer-3",
      selected: "border-answer-3 bg-answer-3/15",
    },
  },
];

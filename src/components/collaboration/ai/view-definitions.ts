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
  icon: IconComponent;
  id: StudyView;
  label: string;
  shortLabel: string;
}

export const MIN_SOURCE_CHARACTERS = 80;
export const DEFAULT_QUIZ_COUNT = 5;
export const DEFAULT_FLASHCARD_COUNT = 8;
export const MIN_QUIZ_COUNT = 3;
export const MAX_QUIZ_COUNT = 20;
export const MIN_FLASHCARD_COUNT = 4;
export const MAX_FLASHCARD_COUNT = 20;
export const VIEW_DEFINITIONS: readonly ViewDefinition[] = [
  {
    icon: BookCheck,
    id: "summary",
    label: "Discussion summary",
    shortLabel: "Summary",
  },
  {
    icon: CircleHelp,
    id: "quiz",
    label: "Practice quiz",
    shortLabel: "Quiz",
  },
  {
    icon: Layers3,
    id: "flashcards",
    label: "Flashcard deck",
    shortLabel: "Cards",
  },
  {
    icon: Route,
    id: "recommendations",
    label: "Content recommendations",
    shortLabel: "Next steps",
  },
  {
    icon: ShieldAlert,
    id: "misconceptions",
    label: "Misconception review",
    shortLabel: "Review",
  },
];

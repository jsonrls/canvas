import {
  MAX_FLASHCARD_COUNT,
  MAX_QUIZ_COUNT,
  MIN_FLASHCARD_COUNT,
  MIN_QUIZ_COUNT,
} from "@/components/collaboration/ai/view-definitions";
import { ButtonControl } from "@/components/ui/button";
import { Sparkles, X } from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";

export interface StudyPackConfigDialogProps {
  flashcardCount: number;
  isGenerating: boolean;
  onClose(): void;
  onConfirm(quizCount: number, flashcardCount: number): void;
  quizCount: number;
  setFlashcardCount(n: number): void;
  setQuizCount(n: number): void;
}

export function CountSlider({
  id,
  label,
  max,
  min,
  onChange,
  value,
}: {
  id: string;
  label: string;
  max: number;
  min: number;
  onChange(n: number): void;
  value: number;
}): React.ReactElement {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="sp-config-slider">
      <div className="sp-config-slider__header">
        <label className="sp-config-slider__label" htmlFor={id}>
          {label}
        </label>
        <output className="sp-config-slider__value" htmlFor={id}>
          {value}
        </output>
      </div>
      <div className="sp-config-slider__track-wrap">
        <input
          className="sp-config-slider__input"
          id={id}
          max={max}
          min={min}
          onChange={(e) => onChange(Number(e.target.value))}
          step={1}
          style={{ "--pct": `${pct}%` } as React.CSSProperties}
          type="range"
          value={value}
        />
      </div>
      <div className="sp-config-slider__labels" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export function StudyPackConfigDialog({
  flashcardCount,
  isGenerating,
  onClose,
  onConfirm,
  quizCount,
  setFlashcardCount,
  setQuizCount,
}: StudyPackConfigDialogProps): React.ReactElement {
  return (
    <div
      className="sp-config-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sp-config-title"
    >
      <div className="sp-config-panel">
        <div className="sp-config-header">
          <div>
            <p className="ai-section-kicker">Customise your pack</p>
            <h2 id="sp-config-title">Choose how much to generate</h2>
            <p>
              Adjust the quiz and flashcard counts before the AI builds your
              study pack.
            </p>
          </div>
          <ButtonControl
            variant="ghost"
            size="sm"
            aria-label="Close configuration"
            className="sp-config-close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </ButtonControl>
        </div>

        <div className="sp-config-body">
          <CountSlider
            id="sp-quiz-count"
            label="Quiz questions"
            max={MAX_QUIZ_COUNT}
            min={MIN_QUIZ_COUNT}
            onChange={setQuizCount}
            value={quizCount}
          />
          <CountSlider
            id="sp-flashcard-count"
            label="Flashcards"
            max={MAX_FLASHCARD_COUNT}
            min={MIN_FLASHCARD_COUNT}
            onChange={setFlashcardCount}
            value={flashcardCount}
          />
        </div>

        <div className="sp-config-footer">
          <ButtonControl
            variant="primary"
            className="ai-primary-button"
            aria-busy={isGenerating}
            disabled={isGenerating}
            onClick={() => onConfirm(quizCount, flashcardCount)}
            type="button"
          >
            {isGenerating ? (
              <LoadingIndicator size="icon" />
            ) : (
              <Sparkles aria-hidden="true" size={18} />
            )}
            {isGenerating ? "Building study pack…" : "Generate study pack"}
          </ButtonControl>
          <ButtonControl
            variant="secondary"
            className="sp-config-cancel"
            disabled={isGenerating}
            onClick={onClose}
            type="button"
          >
            Cancel
          </ButtonControl>
        </div>
      </div>
    </div>
  );
}

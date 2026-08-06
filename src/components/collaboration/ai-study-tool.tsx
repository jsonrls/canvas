"use client";

import {
  ArrowLeft,
  Bookmark,
  BookCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  CircleHelp,
  Layers3,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Route,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { StudyPack, StudyPackResponse } from "@/lib/ai/study-pack";
import type { SavedStudyGuideMetadata } from "@/lib/ai/saved-study-guides";

interface AiStudyToolProps {
  onReturnToNotes(): void;
  roomId: string;
  sourceText: string;
}

type StudyView =
  "flashcards" | "misconceptions" | "quiz" | "recommendations" | "summary";

interface ViewDefinition {
  icon: LucideIcon;
  id: StudyView;
  label: string;
  shortLabel: string;
}

const MIN_SOURCE_CHARACTERS = 80;
const DEFAULT_QUIZ_COUNT = 5;
const DEFAULT_FLASHCARD_COUNT = 8;
const MIN_QUIZ_COUNT = 3;
const MAX_QUIZ_COUNT = 20;
const MIN_FLASHCARD_COUNT = 4;
const MAX_FLASHCARD_COUNT = 20;
const VIEW_DEFINITIONS: readonly ViewDefinition[] = [
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

function formatGenerationTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "just now";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function readApiPayload(value: unknown): StudyPackResponse | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const payload = value as Partial<StudyPackResponse>;

  if (
    typeof payload.generatedAt !== "string" ||
    typeof payload.sourceCharacters !== "number" ||
    !payload.studyPack ||
    typeof payload.studyPack !== "object"
  ) {
    return null;
  }

  return payload as StudyPackResponse;
}

function readSavedGuidesPayload(value: unknown): SavedStudyGuideMetadata[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const guides = (value as { guides?: unknown }).guides;

  if (!Array.isArray(guides)) return [];

  return guides.filter((guide): guide is SavedStudyGuideMetadata => {
    if (!guide || typeof guide !== "object" || Array.isArray(guide)) {
      return false;
    }

    const item = guide as Record<string, unknown>;
    return (
      typeof item.id === "string" &&
      typeof item.title === "string" &&
      typeof item.generatedAt === "string" &&
      typeof item.createdAt === "string" &&
      typeof item.sourceCharacters === "number"
    );
  });
}

function readErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const error = (value as { error?: unknown }).error;
  return typeof error === "string" ? error : null;
}

interface StudyPackConfigDialogProps {
  flashcardCount: number;
  isGenerating: boolean;
  onClose(): void;
  onConfirm(quizCount: number, flashcardCount: number): void;
  quizCount: number;
  setFlashcardCount(n: number): void;
  setQuizCount(n: number): void;
}

function CountSlider({
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

function StudyPackConfigDialog({
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
          <button
            aria-label="Close configuration"
            className="sp-config-close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
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
          <button
            className="ai-primary-button"
            disabled={isGenerating}
            onClick={() => onConfirm(quizCount, flashcardCount)}
            type="button"
          >
            {isGenerating ? (
              <RefreshCw className="spin" aria-hidden="true" size={18} />
            ) : (
              <Sparkles aria-hidden="true" size={18} />
            )}
            {isGenerating ? "Building study pack…" : "Generate study pack"}
          </button>
          <button
            className="sp-config-cancel"
            disabled={isGenerating}
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryView({ pack }: { pack: StudyPack }): React.ReactElement {
  return (
    <div className="ai-summary-layout">
      <section className="ai-summary-lead">
        <p className="ai-section-kicker">Room synthesis</p>
        <h2>{pack.summary.title}</h2>
        <p>{pack.summary.overview}</p>
      </section>

      <section className="ai-output-card">
        <div className="ai-output-card__heading">
          <CheckCircle2 aria-hidden="true" size={19} />
          <h3>High-yield takeaways</h3>
        </div>
        <ol className="ai-key-point-list">
          {pack.summary.keyPoints.map((point, index) => (
            <li key={`${index}-${point}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{point}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="ai-output-card ai-output-card--questions">
        <div className="ai-output-card__heading">
          <CircleHelp aria-hidden="true" size={19} />
          <h3>Questions still worth resolving</h3>
        </div>
        {pack.summary.openQuestions.length > 0 ? (
          <ul>
            {pack.summary.openQuestions.map((question, index) => (
              <li key={`${index}-${question}`}>{question}</li>
            ))}
          </ul>
        ) : (
          <p className="ai-inline-empty">
            The notes did not leave a clear unresolved question.
          </p>
        )}
      </section>
    </div>
  );
}

function QuizView({
  answers,
  onAnswer,
  onReset,
  pack,
}: {
  answers: Record<number, number>;
  onAnswer(questionIndex: number, optionIndex: number): void;
  onReset(): void;
  pack: StudyPack;
}): React.ReactElement {
  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.entries(answers).filter(
    ([questionIndex, answerIndex]) =>
      pack.quiz[Number(questionIndex)]?.answerIndex === answerIndex,
  ).length;

  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Active recall</p>
          <h2>Practice the room&apos;s core ideas</h2>
        </div>
        <div className="ai-quiz-score" aria-live="polite">
          <strong>
            {correctCount}/{answeredCount}
          </strong>
          <span>correct so far</span>
        </div>
      </div>

      <div className="ai-quiz-list">
        {pack.quiz.map((item, questionIndex) => {
          const selectedAnswer = answers[questionIndex];
          const isAnswered = selectedAnswer !== undefined;
          const isCorrect = selectedAnswer === item.answerIndex;

          return (
            <article
              className="ai-quiz-card"
              key={`${questionIndex}-${item.question}`}
            >
              <span className="ai-quiz-card__number">
                Question {questionIndex + 1} of {pack.quiz.length}
              </span>
              <h3>{item.question}</h3>
              <div
                className="ai-answer-grid"
                role="group"
                aria-label={`Answers for question ${questionIndex + 1}`}
              >
                {item.options.map((option, optionIndex) => {
                  const isSelected = selectedAnswer === optionIndex;
                  const showCorrect =
                    isAnswered && optionIndex === item.answerIndex;
                  const showIncorrect = isSelected && !isCorrect;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`ai-answer-button${showCorrect ? " ai-answer-button--correct" : ""}${showIncorrect ? " ai-answer-button--incorrect" : ""}`}
                      disabled={isAnswered}
                      key={`${optionIndex}-${option}`}
                      onClick={() => onAnswer(questionIndex, optionIndex)}
                      type="button"
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      {option}
                      {showCorrect ? (
                        <Check aria-hidden="true" size={17} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {isAnswered ? (
                <div
                  className={`ai-answer-feedback${isCorrect ? " ai-answer-feedback--correct" : ""}`}
                  role="status"
                >
                  <strong>{isCorrect ? "Correct." : "Review this one."}</strong>
                  <p>{item.explanation}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {answeredCount > 0 ? (
        <button className="ai-secondary-button" onClick={onReset} type="button">
          <RotateCcw aria-hidden="true" size={16} />
          Reset quiz
        </button>
      ) : null}
    </div>
  );
}

function FlashcardsView({
  onToggle,
  pack,
  revealedCards,
}: {
  onToggle(index: number): void;
  pack: StudyPack;
  revealedCards: Set<number>;
}): React.ReactElement {
  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Rapid review</p>
          <h2>Flashcards from the shared notes</h2>
          <p>Choose a card to reveal its answer.</p>
        </div>
        <span className="ai-count-badge">{pack.flashcards.length} cards</span>
      </div>
      <div className="ai-flashcard-grid">
        {pack.flashcards.map((card, index) => {
          const isRevealed = revealedCards.has(index);

          return (
            <button
              aria-label={`${isRevealed ? "Hide" : "Reveal"} answer for flashcard ${index + 1}`}
              aria-pressed={isRevealed}
              className={`ai-flashcard${isRevealed ? " ai-flashcard--revealed" : ""}`}
              key={`${index}-${card.front}`}
              onClick={() => onToggle(index)}
              type="button"
            >
              <span className="ai-flashcard__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="ai-flashcard__label">
                {isRevealed ? "Answer" : "Prompt"}
              </span>
              <strong>{isRevealed ? card.back : card.front}</strong>
              <small>
                {isRevealed ? "Choose to hide" : "Choose to reveal"}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecommendationsView({
  pack,
}: {
  pack: StudyPack;
}): React.ReactElement {
  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Study direction</p>
          <h2>What to work on next</h2>
          <p>Actions selected from gaps and connections in this snapshot.</p>
        </div>
      </div>
      <div className="ai-recommendation-list">
        {pack.recommendations.map((recommendation, index) => (
          <article key={`${index}-${recommendation.title}`}>
            <span className="ai-recommendation-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <span
                className={`ai-kind-badge ai-kind-badge--${recommendation.kind}`}
              >
                {recommendation.kind}
              </span>
              <h3>{recommendation.title}</h3>
              <p>{recommendation.rationale}</p>
              <strong>{recommendation.nextStep}</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MisconceptionsView({ pack }: { pack: StudyPack }): React.ReactElement {
  return (
    <div>
      <div className="ai-view-heading">
        <div>
          <p className="ai-section-kicker">Cautious review</p>
          <h2>Claims that may need another look</h2>
          <p>These are review prompts, not definitive corrections.</p>
        </div>
      </div>

      {pack.misconceptions.length > 0 ? (
        <div className="ai-misconception-list">
          {pack.misconceptions.map((item, index) => (
            <article key={`${index}-${item.suspectedClaim}`}>
              <div className="ai-misconception-card__heading">
                <span>Review signal {String(index + 1).padStart(2, "0")}</span>
                <span
                  className={`ai-confidence ai-confidence--${item.confidence}`}
                >
                  {item.confidence} confidence
                </span>
              </div>
              <h3>{item.suspectedClaim}</h3>
              <div className="ai-correction-grid">
                <div>
                  <span>Possible correction</span>
                  <p>{item.correction}</p>
                </div>
                <div>
                  <span>Why it matters</span>
                  <p>{item.whyItMatters}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="ai-positive-empty">
          <CheckCircle2 aria-hidden="true" size={26} />
          <div>
            <h3>No supported misconception signal</h3>
            <p>
              The assistant did not find a claim it could responsibly flag.
              Continue verifying the notes against course sources.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiStudyTool({
  onReturnToNotes,
  roomId,
  sourceText,
}: AiStudyToolProps): React.ReactElement {
  const [activeView, setActiveView] = useState<StudyView>("summary");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSavedGuides, setIsLoadingSavedGuides] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedError, setSavedError] = useState("");
  const [savedGuides, setSavedGuides] = useState<SavedStudyGuideMetadata[]>([]);
  const [activeSavedGuideId, setActiveSavedGuideId] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [loadingGuideId, setLoadingGuideId] = useState<string | null>(null);
  const [result, setResult] = useState<StudyPackResponse | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(
    () => new Set(),
  );
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [quizCount, setQuizCount] = useState(DEFAULT_QUIZ_COUNT);
  const [flashcardCount, setFlashcardCount] = useState(DEFAULT_FLASHCARD_COUNT);
  const abortControllerRef = useRef<AbortController | null>(null);
  const normalizedSource = sourceText.trim();
  const sourceWordCount = normalizedSource
    ? normalizedSource.split(/\s+/u).length
    : 0;
  const canGenerate = normalizedSource.length >= MIN_SOURCE_CHARACTERS;

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    const loadSavedGuides = async (): Promise<void> => {
      setIsLoadingSavedGuides(true);
      setSavedError("");

      try {
        const response = await fetch(
          `/api/rooms/${roomId}/saved-study-guides`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: controller.signal,
          },
        );
        const payload: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            readErrorMessage(payload) ??
              "Saved study guides could not be loaded. Try again.",
          );
        }

        setSavedGuides(readSavedGuidesPayload(payload));
      } catch (error) {
        if (controller.signal.aborted) return;
        setSavedError(
          error instanceof Error
            ? error.message
            : "Saved study guides could not be loaded. Try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingSavedGuides(false);
      }
    };

    void loadSavedGuides();
    return () => controller.abort();
  }, [roomId]);

  const generateStudyPack = async (
    configQuizCount = quizCount,
    configFlashcardCount = flashcardCount,
  ): Promise<void> => {
    if (!canGenerate || isGenerating) return;

    setShowConfigDialog(false);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setErrorMessage("");
    setIsGenerating(true);

    try {
      const response = await fetch(`/api/rooms/${roomId}/ai-study-pack`, {
        body: JSON.stringify({
          sourceText: normalizedSource,
          quizCount: configQuizCount,
          flashcardCount: configFlashcardCount,
        }),
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          readErrorMessage(payload) ??
            "The AI assistant could not create a study pack. Try again.",
        );
      }

      const parsed = readApiPayload(payload);

      if (!parsed) {
        throw new Error(
          "The assistant returned an incomplete study pack. Try again.",
        );
      }

      setResult(parsed);
      setActiveSavedGuideId(null);
      setActiveView("summary");
      setAnswers({});
      setRevealedCards(new Set());
    } catch (error) {
      if (controller.signal.aborted) return;
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The AI assistant could not create a study pack. Try again.",
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }

      setIsGenerating(false);
    }
  };

  const saveStudyGuide = async (): Promise<void> => {
    if (!result || isSaving) return;

    setIsSaving(true);
    setSavedError("");

    try {
      const response = await fetch(`/api/rooms/${roomId}/saved-study-guides`, {
        body: JSON.stringify(result),
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          readErrorMessage(payload) ??
            "The study guide could not be saved. Try again.",
        );
      }

      const guide = (payload as { guide?: SavedStudyGuideMetadata }).guide;
      if (!guide) throw new Error("The saved guide response was incomplete.");
      setSavedGuides((current) => [guide, ...current].slice(0, 50));
      setActiveSavedGuideId(guide.id);
    } catch (error) {
      setSavedError(
        error instanceof Error
          ? error.message
          : "The study guide could not be saved. Try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedGuide = async (guideId: string): Promise<void> => {
    if (loadingGuideId) return;

    setLoadingGuideId(guideId);
    setSavedError("");

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/saved-study-guides?guideId=${encodeURIComponent(guideId)}`,
        { cache: "no-store", credentials: "same-origin" },
      );
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          readErrorMessage(payload) ??
            "The saved guide could not be opened. Try again.",
        );
      }

      const guide = (payload as { guide?: StudyPackResponse }).guide;
      if (!guide) throw new Error("The saved guide response was incomplete.");
      setResult(guide);
      setActiveSavedGuideId(guideId);
      setActiveView("summary");
      setAnswers({});
      setRevealedCards(new Set());
    } catch (error) {
      setSavedError(
        error instanceof Error
          ? error.message
          : "The saved guide could not be opened. Try again.",
      );
    } finally {
      setLoadingGuideId(null);
    }
  };

  const deleteSavedGuide = async (guideId: string): Promise<void> => {
    setPendingDeleteId(null);
    setSavedError("");

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/saved-study-guides?guideId=${encodeURIComponent(guideId)}`,
        { cache: "no-store", credentials: "same-origin", method: "DELETE" },
      );
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          readErrorMessage(payload) ??
            "The saved guide could not be deleted. Try again.",
        );
      }

      setSavedGuides((current) =>
        current.filter((guide) => guide.id !== guideId),
      );
      setActiveSavedGuideId((current) =>
        current === guideId ? null : current,
      );
    } catch (error) {
      setSavedError(
        error instanceof Error
          ? error.message
          : "The saved guide could not be deleted. Try again.",
      );
    }
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    let targetIndex = currentIndex;

    if (event.key === "ArrowRight") {
      targetIndex = (currentIndex + 1) % VIEW_DEFINITIONS.length;
    } else if (event.key === "ArrowLeft") {
      targetIndex =
        (currentIndex - 1 + VIEW_DEFINITIONS.length) % VIEW_DEFINITIONS.length;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = VIEW_DEFINITIONS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextView = VIEW_DEFINITIONS[targetIndex];

    if (!nextView) return;
    setActiveView(nextView.id);
    requestAnimationFrame(() => {
      document.getElementById(`ai-tab-${nextView.id}`)?.focus();
    });
  };

  let activeContent: React.ReactElement | null = null;

  if (result) {
    if (activeView === "summary") {
      activeContent = <SummaryView pack={result.studyPack} />;
    } else if (activeView === "quiz") {
      activeContent = (
        <QuizView
          answers={answers}
          onAnswer={(questionIndex, optionIndex) =>
            setAnswers((current) => ({
              ...current,
              [questionIndex]: optionIndex,
            }))
          }
          onReset={() => setAnswers({})}
          pack={result.studyPack}
        />
      );
    } else if (activeView === "flashcards") {
      activeContent = (
        <FlashcardsView
          onToggle={(index) =>
            setRevealedCards((current) => {
              const next = new Set(current);
              if (next.has(index)) next.delete(index);
              else next.add(index);
              return next;
            })
          }
          pack={result.studyPack}
          revealedCards={revealedCards}
        />
      );
    } else if (activeView === "recommendations") {
      activeContent = <RecommendationsView pack={result.studyPack} />;
    } else {
      activeContent = <MisconceptionsView pack={result.studyPack} />;
    }
  }

  return (
    <div className="study-tool ai-study-tool">
      {showConfigDialog ? (
        <StudyPackConfigDialog
          flashcardCount={flashcardCount}
          isGenerating={isGenerating}
          onClose={() => setShowConfigDialog(false)}
          onConfirm={(qc, fc) => void generateStudyPack(qc, fc)}
          quizCount={quizCount}
          setFlashcardCount={setFlashcardCount}
          setQuizCount={setQuizCount}
        />
      ) : null}
      <header className="ai-study-heading">
        <button
          className="ai-back-button"
          onClick={onReturnToNotes}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to notes
        </button>
      </header>

      <section className="ai-source-card" aria-labelledby="ai-source-heading">
        <span className="ai-source-card__icon" aria-hidden="true">
          <BrainCircuit size={23} />
        </span>
        <div>
          <span>Source snapshot</span>
          <h2 id="ai-source-heading">Collaborative notes captured on entry</h2>
          <p>
            {canGenerate
              ? "Later note edits are not included until you reopen the assistant."
              : "Add a few complete study points before generating."}
          </p>
        </div>
        <dl>
          <div>
            <dt>Words</dt>
            <dd>{sourceWordCount}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{canGenerate ? "Ready" : "Needs notes"}</dd>
          </div>
        </dl>
      </section>

      <section
        className="ai-saved-guides"
        aria-labelledby="saved-guides-heading"
      >
        <div className="ai-saved-guides__heading">
          <div>
            <p className="ai-section-kicker">Private library</p>
            <h2 id="saved-guides-heading">Saved study guides</h2>
            <p>Only you can reopen or remove guides saved in this room.</p>
          </div>
          <span className="ai-count-badge">{savedGuides.length}/50</span>
        </div>

        {isLoadingSavedGuides ? (
          <div className="ai-saved-guides__state" role="status">
            <LoaderCircle className="spin" aria-hidden="true" size={18} />
            Loading saved guides…
          </div>
        ) : savedGuides.length > 0 ? (
          <div className="ai-saved-guides__list">
            {savedGuides.map((guide) => (
              <article
                className={`ai-saved-guide-card${activeSavedGuideId === guide.id ? " ai-saved-guide-card--active" : ""}`}
                key={guide.id}
              >
                <button
                  className="ai-saved-guide-card__open"
                  disabled={Boolean(loadingGuideId)}
                  onClick={() => void loadSavedGuide(guide.id)}
                  type="button"
                >
                  <Bookmark aria-hidden="true" size={17} />
                  <span>
                    <strong>{guide.title}</strong>
                    <small>
                      Generated {formatGenerationTime(guide.generatedAt)} ·
                      Saved {formatGenerationTime(guide.createdAt)}
                    </small>
                  </span>
                  {loadingGuideId === guide.id ? (
                    <LoaderCircle
                      className="spin"
                      aria-hidden="true"
                      size={16}
                    />
                  ) : (
                    <ArrowLeft aria-hidden="true" size={16} />
                  )}
                </button>
                {pendingDeleteId === guide.id ? (
                  <div
                    className="ai-saved-guide-card__confirm"
                    role="group"
                    aria-label={`Confirm deleting ${guide.title}`}
                  >
                    <span>Delete this saved guide?</span>
                    <button
                      onClick={() => void deleteSavedGuide(guide.id)}
                      type="button"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(null)}
                      type="button"
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    aria-label={`Delete ${guide.title}`}
                    className="ai-saved-guide-card__delete"
                    onClick={() => setPendingDeleteId(guide.id)}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={16} />
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="ai-saved-guides__state">
            <Bookmark aria-hidden="true" size={18} />
            <span>Saved guides appear here after you choose “Save guide.”</span>
          </div>
        )}
      </section>

      {errorMessage ? (
        <div className="ai-error-callout" role="alert">
          <ShieldAlert aria-hidden="true" size={19} />
          <div>
            <strong>Generation needs attention</strong>
            <p>{errorMessage}</p>
          </div>
          <button
            disabled={isGenerating}
            onClick={() => void generateStudyPack()}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {savedError ? (
        <div className="ai-error-callout" role="alert" aria-live="assertive">
          <ShieldAlert aria-hidden="true" size={19} />
          <div>
            <strong>Saved guides need attention</strong>
            <p>{savedError}</p>
          </div>
          <button onClick={() => setSavedError("")} type="button">
            <X aria-hidden="true" size={16} />
            Dismiss
          </button>
        </div>
      ) : null}

      {!result ? (
        <section className="ai-generation-panel">
          <div className="ai-generation-panel__intro">
            <span className="ai-orbit-mark" aria-hidden="true">
              <Sparkles size={25} />
            </span>
            <p className="ai-section-kicker">One generation · five tools</p>
            <h2>
              {canGenerate ? "Build your room review" : "Start in shared notes"}
            </h2>
            <p>
              {canGenerate
                ? "The assistant organizes what your group wrote without changing the collaborative document."
                : "Add mechanisms, comparisons, and exam clues first for a safer, more useful pack."}
            </p>
          </div>

          <div
            className="ai-capability-grid"
            aria-label="Generated study tools"
          >
            {VIEW_DEFINITIONS.map(({ icon: Icon, id, label }, index) => (
              <div key={id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon aria-hidden="true" size={20} />
                <strong>{label}</strong>
              </div>
            ))}
          </div>

          <div className="ai-generation-action">
            <button
              className="ai-primary-button"
              disabled={isGenerating}
              onClick={
                canGenerate ? () => setShowConfigDialog(true) : onReturnToNotes
              }
              type="button"
            >
              {isGenerating ? (
                <RefreshCw className="spin" aria-hidden="true" size={18} />
              ) : canGenerate ? (
                <Sparkles aria-hidden="true" size={18} />
              ) : (
                <ArrowLeft aria-hidden="true" size={18} />
              )}
              {isGenerating
                ? "Building study pack…"
                : canGenerate
                  ? "Generate study pack"
                  : "Add to shared notes"}
            </button>
            <small>
              Generated content stays private unless you explicitly save it;
              saved guides are not added to the shared notes.
            </small>
          </div>
        </section>
      ) : (
        <section className="ai-result-shell">
          <div className="ai-result-toolbar">
            <div>
              <CheckCircle2 aria-hidden="true" size={18} />
              <span>
                <strong>Study pack ready</strong>
                Generated {formatGenerationTime(result.generatedAt)} from{" "}
                {result.sourceCharacters.toLocaleString()} characters
              </span>
            </div>
            <button
              disabled={isGenerating}
              onClick={() => void generateStudyPack()}
              type="button"
            >
              <RefreshCw
                className={isGenerating ? "spin" : ""}
                aria-hidden="true"
                size={16}
              />
              {isGenerating ? "Regenerating…" : "Regenerate"}
            </button>
            <button
              disabled={isSaving || activeSavedGuideId !== null}
              onClick={() => void saveStudyGuide()}
              type="button"
            >
              {isSaving ? (
                <LoaderCircle className="spin" aria-hidden="true" size={16} />
              ) : (
                <Bookmark aria-hidden="true" size={16} />
              )}
              {activeSavedGuideId !== null
                ? "Saved for later"
                : isSaving
                  ? "Saving…"
                  : "Save guide"}
            </button>
          </div>

          <div
            className="ai-study-tabs"
            role="tablist"
            aria-label="AI study pack views"
          >
            {VIEW_DEFINITIONS.map(({ icon: Icon, id, shortLabel }, index) => (
              <button
                aria-controls={`ai-panel-${id}`}
                aria-selected={activeView === id}
                id={`ai-tab-${id}`}
                key={id}
                onClick={() => setActiveView(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                role="tab"
                tabIndex={activeView === id ? 0 : -1}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />
                {shortLabel}
              </button>
            ))}
          </div>

          <div
            aria-labelledby={`ai-tab-${activeView}`}
            className="ai-study-panel"
            id={`ai-panel-${activeView}`}
            role="tabpanel"
            tabIndex={0}
          >
            {activeContent}
          </div>
        </section>
      )}

      <aside className="ai-safety-note">
        <ShieldAlert aria-hidden="true" size={18} />
        <p>
          <strong>Study aid, not medical advice.</strong> AI can miss context or
          make mistakes. Verify clinical claims, answers, and corrections
          against course materials and authoritative sources.
        </p>
      </aside>
    </div>
  );
}

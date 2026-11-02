"use client";
import { studyTabIndex, toggleRevealedCard } from "@/lib/ai/study-view-state";
import { SavedGuideLibrary } from "./ai/saved-guide-library";
import { useSavedGuides } from "./ai/use-saved-guides";
import { useStudyGeneration } from "./ai/use-study-generation";

import { ButtonControl } from "@/components/ui/button";
import {
  AppIcon,
  ArrowLeft,
  Bookmark,
  BrainCircuit,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  X,
} from "@/components/ui/icons";
import { ArrowLeft as ArrowLeftData, Sparkles as SparklesData } from "lucide";
import { useState } from "react";

import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import type { StudyPackResponse } from "@/lib/ai/study-pack";

import { formatGenerationTime } from "@/lib/ai/study-tool-payload";

interface AiStudyToolProps {
  onReturnToNotes(): void;
  roomId: string;
  sourceText: string;
}

import { StudyPackConfigDialog } from "./ai/study-pack-config-dialog";
import {
  FlashcardsView,
  MisconceptionsView,
  QuizView,
  RecommendationsView,
  SummaryView,
} from "./ai/study-pack-views";
import {
  DEFAULT_FLASHCARD_COUNT,
  DEFAULT_QUIZ_COUNT,
  MIN_SOURCE_CHARACTERS,
  StudyView,
  VIEW_DEFINITIONS,
} from "./ai/view-definitions";
export default function AiStudyTool({
  onReturnToNotes,
  roomId,
  sourceText,
}: AiStudyToolProps): React.ReactElement {
  const [activeView, setActiveView] = useState<StudyView>("summary");

  const [answers, setAnswers] = useState<Record<number, number>>({});

  const [result, setResult] = useState<StudyPackResponse | null>(null);

  const [revealedCards, setRevealedCards] = useState<Set<number>>(
    () => new Set(),
  );

  const [showConfigDialog, setShowConfigDialog] = useState(false);

  const [quizCount, setQuizCount] = useState(DEFAULT_QUIZ_COUNT);

  const [flashcardCount, setFlashcardCount] = useState(DEFAULT_FLASHCARD_COUNT);

  const normalizedSource = sourceText.trim();

  const sourceWordCount = normalizedSource
    ? normalizedSource.split(/\s+/u).length
    : 0;

  const canGenerate = normalizedSource.length >= MIN_SOURCE_CHARACTERS;

  const {
    isLoadingSavedGuides,
    isSaving,
    deletingGuideId,
    savedError,
    setSavedError,
    savedGuides,
    activeSavedGuideId,
    setActiveSavedGuideId,
    pendingDeleteId,
    setPendingDeleteId,
    loadingGuideId,
    saveStudyGuide,
    loadSavedGuide,
    deleteSavedGuide,
  } = useSavedGuides({
    roomId,
    result,
    setResult,
    setActiveView,
    setAnswers,
    setRevealedCards,
  });

  const { errorMessage, isGenerating, generateStudyPack } = useStudyGeneration({
    quizCount,
    flashcardCount,
    canGenerate,
    setShowConfigDialog,
    roomId,
    normalizedSource,
    setResult,
    setActiveSavedGuideId,
    setActiveView,
    setAnswers,
    setRevealedCards,
  });

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ): void => {
    const targetIndex = studyTabIndex(
      event.key,
      currentIndex,
      VIEW_DEFINITIONS.length,
    );
    if (targetIndex === null) return;

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
            setRevealedCards((current) => toggleRevealedCard(current, index))
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
        <ButtonControl
          variant="ghost"
          size="sm"
          className="ai-back-button"
          onClick={onReturnToNotes}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to notes
        </ButtonControl>
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

      <SavedGuideLibrary
        savedGuides={savedGuides}
        isLoadingSavedGuides={isLoadingSavedGuides}
        activeSavedGuideId={activeSavedGuideId}
        loadingGuideId={loadingGuideId}
        loadSavedGuide={loadSavedGuide}
        pendingDeleteId={pendingDeleteId}
        deletingGuideId={deletingGuideId}
        deleteSavedGuide={deleteSavedGuide}
        setPendingDeleteId={setPendingDeleteId}
      />

      {errorMessage ? (
        <div className="ai-error-callout" role="alert">
          <ShieldAlert aria-hidden="true" size={19} />
          <div>
            <strong>Generation needs attention</strong>
            <p>{errorMessage}</p>
          </div>
          <ButtonControl
            variant="secondary"
            disabled={isGenerating}
            onClick={() => void generateStudyPack()}
            type="button"
          >
            Retry
          </ButtonControl>
        </div>
      ) : null}

      {savedError ? (
        <div className="ai-error-callout" role="alert" aria-live="assertive">
          <ShieldAlert aria-hidden="true" size={19} />
          <div>
            <strong>Saved guides need attention</strong>
            <p>{savedError}</p>
          </div>
          <ButtonControl
            variant="ghost"
            size="sm"
            onClick={() => setSavedError("")}
            type="button"
          >
            <X aria-hidden="true" size={16} />
            Dismiss
          </ButtonControl>
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
            <ButtonControl
              variant="primary"
              className="ai-primary-button"
              aria-busy={isGenerating}
              disabled={isGenerating}
              onClick={
                canGenerate ? () => setShowConfigDialog(true) : onReturnToNotes
              }
              type="button"
            >
              {isGenerating ? (
                <LoadingIndicator size="icon" />
              ) : (
                <AppIcon
                  iconData={canGenerate ? SparklesData : ArrowLeftData}
                  aria-hidden="true"
                  size={18}
                />
              )}
              {isGenerating
                ? "Building study pack…"
                : canGenerate
                  ? "Generate study pack"
                  : "Add to shared notes"}
            </ButtonControl>
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
            <ButtonControl
              variant="secondary"
              aria-busy={isGenerating}
              disabled={isGenerating}
              onClick={() => void generateStudyPack()}
              type="button"
            >
              {isGenerating ? (
                <LoadingIndicator size="icon" />
              ) : (
                <RefreshCw aria-hidden="true" size={16} />
              )}
              {isGenerating ? "Regenerating…" : "Regenerate"}
            </ButtonControl>
            <ButtonControl
              variant="secondary"
              aria-busy={isSaving}
              disabled={isSaving || activeSavedGuideId !== null}
              onClick={() => void saveStudyGuide()}
              type="button"
            >
              {isSaving ? (
                <LoadingIndicator size="icon" />
              ) : (
                <Bookmark aria-hidden="true" size={16} />
              )}
              {activeSavedGuideId !== null
                ? "Saved for later"
                : isSaving
                  ? "Saving…"
                  : "Save guide"}
            </ButtonControl>
          </div>

          <div
            className="ai-study-tabs"
            role="tablist"
            aria-label="AI study pack views"
          >
            {VIEW_DEFINITIONS.map(({ icon: Icon, id, shortLabel }, index) => (
              <ButtonControl
                variant="ghost"
                size="sm"
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
              </ButtonControl>
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

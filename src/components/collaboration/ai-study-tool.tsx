"use client";

import { Banner } from "@astryxdesign/core/Banner";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useEffect, useRef, useState } from "react";

import { SavedGuideLibrary } from "@/components/collaboration/ai/saved-guide-library";
import { StudyPackConfigDialog } from "@/components/collaboration/ai/study-pack-config-dialog";
import {
  FlashcardsView,
  MisconceptionsView,
  QuizView,
  RecommendationsView,
  SummaryView,
} from "@/components/collaboration/ai/study-pack-views";
import { useSavedGuides } from "@/components/collaboration/ai/use-saved-guides";
import { useStudyGeneration } from "@/components/collaboration/ai/use-study-generation";
import {
  MIN_SOURCE_CHARACTERS,
  VIEW_DEFINITIONS,
  type StudyView,
} from "@/components/collaboration/ai/view-definitions";
import { Button, ButtonControl } from "@/components/ui/button";
import {
  ArrowLeft,
  Bookmark,
  RefreshCw,
  Sparkles,
} from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { PANEL_HEADING, PANEL_MUTED, PANEL_ROW } from "@/components/ui/panel";
import {
  DEFAULT_FLASHCARD_COUNT,
  DEFAULT_QUIZ_COUNT,
  type StudyPackResponse,
} from "@/lib/ai/study-pack";
import { formatGenerationTime } from "@/lib/ai/study-tool-payload";
import { studyTabIndex, toggleRevealedCard } from "@/lib/ai/study-view-state";
import { readChoice, replaceQuery } from "@/lib/url-state";

const STUDY_VIEWS: readonly [StudyView, ...StudyView[]] = [
  "summary",
  "quiz",
  "flashcards",
  "recommendations",
  "misconceptions",
];

interface AiStudyToolProps {
  onReturnToNotes(): void;
  roomId: string;
  sourceText: string;
}

function countWords(text: string): number {
  return text ? text.split(/\s+/u).length : 0;
}

export default function AiStudyTool({
  onReturnToNotes,
  roomId,
  sourceText,
}: AiStudyToolProps): React.ReactElement {
  // Loaded without SSR. useSearchParams can lag behind a change of tool.
  const [addressed] = useState(
    () => new URLSearchParams(window.location.search),
  );
  const guideToRestore = addressed.get("guide");
  const isRestored = useRef(false);
  const [activeView, setActiveView] = useState<StudyView>(() =>
    readChoice(addressed.get("view"), STUDY_VIEWS),
  );
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<StudyPackResponse | null>(null);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(
    () => new Set(),
  );
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [quizCount, setQuizCount] = useState(DEFAULT_QUIZ_COUNT);
  const [flashcardCount, setFlashcardCount] = useState(DEFAULT_FLASHCARD_COUNT);

  const normalizedSource = sourceText.trim();
  const sourceWordCount = countWords(normalizedSource);
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

  // The address keeps the open guide and view, so a refresh comes back to them.
  useEffect(() => {
    if (isLoadingSavedGuides || loadingGuideId) return;
    if (!isRestored.current) {
      isRestored.current = true;
      const guide = savedGuides.find(({ id }) => id === guideToRestore);
      if (guide) {
        void loadSavedGuide(guide.id, activeView);
        return;
      }
    }
    replaceQuery({
      guide: activeSavedGuideId,
      view: activeView === STUDY_VIEWS[0] ? null : activeView,
    });
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

  const renderActiveView = (pack: StudyPackResponse["studyPack"]) => {
    switch (activeView) {
      case "summary":
        return <SummaryView pack={pack} />;
      case "quiz":
        return (
          <QuizView
            answers={answers}
            onAnswer={(questionIndex, optionIndex) =>
              setAnswers((current) => ({
                ...current,
                [questionIndex]: optionIndex,
              }))
            }
            onReset={() => setAnswers({})}
            pack={pack}
          />
        );
      case "flashcards":
        return (
          <FlashcardsView
            onToggle={(index) =>
              setRevealedCards((current) => toggleRevealedCard(current, index))
            }
            pack={pack}
            revealedCards={revealedCards}
          />
        );
      case "recommendations":
        return <RecommendationsView pack={pack} />;
      case "misconceptions":
        return <MisconceptionsView pack={pack} />;
    }
  };

  if (guideToRestore && !result && (isLoadingSavedGuides || loadingGuideId)) {
    return <LoadingIndicator label="Opening your study guide…" size="panel" />;
  }

  return (
    <HStack hAlign="center" padding={4} className="md:p-6!">
      <StudyPackConfigDialog
        flashcardCount={flashcardCount}
        isGenerating={isGenerating}
        isOpen={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        onConfirm={(quiz, flashcards) =>
          void generateStudyPack(quiz, flashcards)
        }
        quizCount={quizCount}
        setFlashcardCount={setFlashcardCount}
        setQuizCount={setQuizCount}
      />
      {/* Saved guides sit beside the pack from xl and below it before that. */}
      <HStack
        width="100%"
        maxWidth={1180}
        gap={6}
        vAlign="start"
        className="flex-col xl:flex-row"
      >
        <VStack gap={6} className="w-full min-w-0 flex-1">
          <HStack gap={4} hAlign="between" vAlign="start" wrap="wrap">
            <VStack gap={1} className="min-w-0">
              <Heading level={2} className="text-2xl! md:text-3xl!">
                {result
                  ? "Your study pack"
                  : canGenerate
                    ? "Turn your notes into a study pack"
                    : "Add notes to build a study pack"}
              </Heading>
              <Text as="p" color="secondary" className="max-w-prose">
                {result
                  ? `Generated ${formatGenerationTime(result.generatedAt)} from ${result.sourceCharacters.toLocaleString()} characters of notes.`
                  : canGenerate
                    ? `${sourceWordCount.toLocaleString()} words were captured from Shared notes when you opened this page. Reopen it to include later edits.`
                    : `A pack needs at least ${MIN_SOURCE_CHARACTERS} characters of shared notes. This room has ${normalizedSource.length} so far.`}
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              {result || canGenerate ? (
                <Button
                  label="Back to notes"
                  variant="ghost"
                  icon={<ArrowLeft aria-hidden="true" size={16} />}
                  onClick={onReturnToNotes}
                />
              ) : null}
              {result ? (
                <>
                  <Button
                    label="Regenerate"
                    variant="secondary"
                    icon={<RefreshCw aria-hidden="true" size={16} />}
                    isLoading={isGenerating}
                    isDisabled={!canGenerate}
                    onClick={() => void generateStudyPack()}
                  />
                  <Button
                    label={activeSavedGuideId !== null ? "Saved" : "Save guide"}
                    variant="primary"
                    icon={<Bookmark aria-hidden="true" size={16} />}
                    isLoading={isSaving}
                    isDisabled={activeSavedGuideId !== null}
                    onClick={() => void saveStudyGuide()}
                  />
                </>
              ) : null}
            </HStack>
          </HStack>

          {errorMessage ? (
            <Banner
              status="error"
              title="The study pack was not created"
              description={errorMessage}
              endContent={
                <Button
                  label="Retry"
                  variant="secondary"
                  isDisabled={isGenerating}
                  onClick={() => void generateStudyPack()}
                />
              }
            />
          ) : null}
          {savedError && pendingDeleteId === null ? (
            <Banner
              status="error"
              title="Saved guides need attention"
              description={savedError}
              endContent={
                <Button
                  label="Dismiss"
                  variant="ghost"
                  onClick={() => setSavedError("")}
                />
              }
            />
          ) : null}

          {result ? (
            <VStack gap={6}>
              <VStack className="@container">
                {/* Three tiles then two on phones; one row of five from 448px. */}
                <HStack
                  gap={2}
                  role="tablist"
                  aria-label="AI study pack views"
                  className="grid! grid-cols-6 @md:grid-cols-5"
                >
                  {VIEW_DEFINITIONS.map(
                    ({ icon: Icon, id, shortLabel, tab }, index) => (
                      <ButtonControl
                        variant="custom"
                        aria-controls={
                          activeView === id ? `ai-panel-${id}` : undefined
                        }
                        aria-selected={activeView === id}
                        className={`col-span-2 flex min-h-16 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 px-1 text-center text-sm text-primary transition-colors nth-[n+4]:col-span-3 @md:col-span-1! @2xl:min-h-14 @2xl:flex-row @2xl:gap-2 ${
                          activeView === id
                            ? `font-semibold ${tab.selected}`
                            : "border-transparent bg-muted font-medium hover:border-border"
                        }`}
                        id={`ai-tab-${id}`}
                        key={id}
                        onClick={() => setActiveView(id)}
                        onKeyDown={(event) => handleTabKeyDown(event, index)}
                        role="tab"
                        tabIndex={activeView === id ? 0 : -1}
                      >
                        <Icon
                          aria-hidden="true"
                          className={`shrink-0 ${tab.icon}`}
                          size={20}
                        />
                        {shortLabel}
                        {id === "summary" ? null : (
                          <Text
                            type="supporting"
                            className="hidden @2xl:inline"
                          >
                            {result.studyPack[id].length}
                          </Text>
                        )}
                      </ButtonControl>
                    ),
                  )}
                </HStack>
              </VStack>
              <VStack
                aria-labelledby={`ai-tab-${activeView}`}
                id={`ai-panel-${activeView}`}
                role="tabpanel"
                tabIndex={0}
              >
                {renderActiveView(result.studyPack)}
              </VStack>
            </VStack>
          ) : (
            <VStack
              as="section"
              gap={4}
              className={PANEL_MUTED}
              aria-labelledby="ai-pack-contents"
            >
              <Heading
                level={3}
                id="ai-pack-contents"
                className={PANEL_HEADING}
              >
                What you get
              </Heading>
              <VStack as="ul" gap={2}>
                {VIEW_DEFINITIONS.map(
                  ({ description, icon: Icon, id, label }) => (
                    <HStack
                      as="li"
                      gap={4}
                      vAlign="center"
                      className={PANEL_ROW}
                      key={id}
                    >
                      <Icon aria-hidden="true" size={20} />
                      <VStack gap={0} className="min-w-0 flex-1">
                        <Text weight="medium">{label}</Text>
                        <Text type="supporting">{description}</Text>
                      </VStack>
                    </HStack>
                  ),
                )}
              </VStack>
              <HStack gap={4} vAlign="center" wrap="wrap">
                <Button
                  label={
                    canGenerate ? "Generate study pack" : "Add to shared notes"
                  }
                  variant="primary"
                  size="lg"
                  icon={
                    canGenerate ? (
                      <Sparkles aria-hidden="true" size={18} />
                    ) : (
                      <ArrowLeft aria-hidden="true" size={18} />
                    )
                  }
                  isLoading={isGenerating}
                  onClick={
                    canGenerate
                      ? () => setShowConfigDialog(true)
                      : onReturnToNotes
                  }
                />
                <Text
                  type="supporting"
                  className="w-full min-w-0 md:w-auto md:flex-1"
                  role="status"
                >
                  {isGenerating
                    ? "Building your study pack…"
                    : "Only you see the pack. It isn’t added to the shared notes."}
                </Text>
              </HStack>
            </VStack>
          )}

          <Text as="p" type="supporting" className="max-w-prose">
            Study aid only. AI can miss context or make mistakes. Check claims,
            answers and corrections against course materials and authoritative
            sources.
          </Text>
        </VStack>

        <VStack as="aside" className="w-full xl:w-80 xl:shrink-0">
          <SavedGuideLibrary
            savedGuides={savedGuides}
            isLoadingSavedGuides={isLoadingSavedGuides}
            activeSavedGuideId={activeSavedGuideId}
            loadingGuideId={loadingGuideId}
            loadSavedGuide={loadSavedGuide}
            pendingDeleteId={pendingDeleteId}
            deletingGuideId={deletingGuideId}
            deleteError={savedError}
            deleteSavedGuide={deleteSavedGuide}
            setPendingDeleteId={(id) => {
              setSavedError("");
              setPendingDeleteId(id);
            }}
          />
        </VStack>
      </HStack>
    </HStack>
  );
}

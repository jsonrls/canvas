import {
  createStudyRequestScope,
  runStudyRequest,
} from "@/lib/ai/study-request";
import { StudyView } from "@/components/collaboration/ai/view-definitions";
import type { StudyPackResponse } from "@/lib/ai/study-pack";
import { readApiPayload, readErrorMessage } from "@/lib/ai/study-tool-payload";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

export function useStudyGeneration({
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
}: {
  quizCount: number;
  flashcardCount: number;
  canGenerate: boolean;
  setShowConfigDialog: Dispatch<SetStateAction<boolean>>;
  roomId: string;
  normalizedSource: string;
  setResult: Dispatch<SetStateAction<StudyPackResponse | null>>;
  setActiveSavedGuideId: Dispatch<SetStateAction<string | null>>;
  setActiveView: Dispatch<SetStateAction<StudyView>>;
  setAnswers: Dispatch<SetStateAction<Record<number, number>>>;
  setRevealedCards: Dispatch<SetStateAction<Set<number>>>;
}) {
  const [errorMessage, setErrorMessage] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const [requests] = useState(createStudyRequestScope);

  useEffect(() => {
    requests.activate();
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed) setIsGenerating(false);
    });
    return () => {
      disposed = true;
      requests.dispose();
    };
  }, [requests, roomId, normalizedSource]);

  const generateStudyPack = async (
    configQuizCount = quizCount,
    configFlashcardCount = flashcardCount,
  ): Promise<void> => {
    if (!canGenerate || isGenerating) return;

    const request = requests.start();
    if (!request) return;
    setShowConfigDialog(false);
    setErrorMessage("");
    setIsGenerating(true);

    await runStudyRequest(
      request,
      async () => {
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
          signal: request.signal,
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

        return parsed;
      },
      {
        success(parsed) {
          setResult(parsed);
          setActiveSavedGuideId(null);
          setActiveView("summary");
          setAnswers({});
          setRevealedCards(new Set());
        },
        error(error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "The AI assistant could not create a study pack. Try again.",
          );
        },
        settled() {
          setIsGenerating(false);
        },
      },
    );
  };
  return { errorMessage, isGenerating, generateStudyPack };
}

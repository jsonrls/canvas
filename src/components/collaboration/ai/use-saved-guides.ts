import { createStudyRequestScope } from "@/lib/ai/study-request";
import { StudyView } from "@/components/collaboration/ai/view-definitions";
import { useToast } from "@/components/ui/toast";
import type { SavedStudyGuideMetadata } from "@/lib/ai/saved-study-guides";
import type { StudyPackResponse } from "@/lib/ai/study-pack";
import {
  readErrorMessage,
  readSavedGuidesPayload,
} from "@/lib/ai/study-tool-payload";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

export function useSavedGuides({
  roomId,
  result,
  setResult,
  setActiveView,
  setAnswers,
  setRevealedCards,
}: {
  roomId: string;
  result: StudyPackResponse | null;

  setResult: Dispatch<SetStateAction<StudyPackResponse | null>>;
  setActiveView: Dispatch<SetStateAction<StudyView>>;
  setAnswers: Dispatch<SetStateAction<Record<number, number>>>;
  setRevealedCards: Dispatch<SetStateAction<Set<number>>>;
}) {
  const { success } = useToast();

  const [isLoadingSavedGuides, setIsLoadingSavedGuides] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [deletingGuideId, setDeletingGuideId] = useState<string | null>(null);

  const [savedError, setSavedError] = useState("");

  const [savedGuides, setSavedGuides] = useState<SavedStudyGuideMetadata[]>([]);

  const [activeSavedGuideId, setActiveSavedGuideId] = useState<string | null>(
    null,
  );

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [loadingGuideId, setLoadingGuideId] = useState<string | null>(null);

  const [requests] = useState(() => ({
    list: createStudyRequestScope(),
    load: createStudyRequestScope(),
    save: createStudyRequestScope(),
    remove: createStudyRequestScope(),
  }));

  useEffect(() => {
    for (const scope of Object.values(requests)) scope.activate();
    const request = requests.list.start()!;
    const loadSavedGuides = async (): Promise<void> => {
      setIsLoadingSavedGuides(true);
      setIsSaving(false);
      setLoadingGuideId(null);
      setDeletingGuideId(null);
      setSavedGuides([]);
      setActiveSavedGuideId(null);
      setPendingDeleteId(null);
      setSavedError("");

      try {
        const response = await fetch(
          `/api/rooms/${roomId}/saved-study-guides`,
          {
            cache: "no-store",
            credentials: "same-origin",
            signal: request.signal,
          },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (!request.isCurrent()) return;

        if (!response.ok) {
          throw new Error(
            readErrorMessage(payload) ??
              "Saved study guides could not be loaded. Try again.",
          );
        }

        setSavedGuides(readSavedGuidesPayload(payload));
      } catch (error) {
        if (!request.isCurrent()) return;
        setSavedError(
          error instanceof Error
            ? error.message
            : "Saved study guides could not be loaded. Try again.",
        );
      } finally {
        if (request.isCurrent()) {
          setIsLoadingSavedGuides(false);
          request.finish();
        }
      }
    };

    void loadSavedGuides();
    return () => {
      for (const scope of Object.values(requests)) scope.dispose();
    };
  }, [roomId, requests]);

  const saveStudyGuide = async (): Promise<void> => {
    if (!result || isSaving) return;

    const request = requests.save.start();
    if (!request) return;
    setIsSaving(true);
    setSavedError("");

    try {
      const response = await fetch(`/api/rooms/${roomId}/saved-study-guides`, {
        body: JSON.stringify(result),
        cache: "no-store",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: request.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!request.isCurrent()) return;

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
      success("Study guide saved for later.");
    } catch (error) {
      if (!request.isCurrent()) return;
      setSavedError(
        error instanceof Error
          ? error.message
          : "The study guide could not be saved. Try again.",
      );
    } finally {
      if (request.isCurrent()) {
        setIsSaving(false);
        request.finish();
      }
    }
  };

  const loadSavedGuide = async (guideId: string): Promise<void> => {
    if (loadingGuideId) return;

    const request = requests.load.start();
    if (!request) return;
    setLoadingGuideId(guideId);
    setSavedError("");

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/saved-study-guides?guideId=${encodeURIComponent(guideId)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          signal: request.signal,
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!request.isCurrent()) return;

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
      if (!request.isCurrent()) return;
      setSavedError(
        error instanceof Error
          ? error.message
          : "The saved guide could not be opened. Try again.",
      );
    } finally {
      if (request.isCurrent()) {
        setLoadingGuideId(null);
        request.finish();
      }
    }
  };

  const deleteSavedGuide = async (guideId: string): Promise<void> => {
    if (deletingGuideId) return;

    const request = requests.remove.start();
    if (!request) return;
    setDeletingGuideId(guideId);
    setSavedError("");

    try {
      const response = await fetch(
        `/api/rooms/${roomId}/saved-study-guides?guideId=${encodeURIComponent(guideId)}`,
        {
          cache: "no-store",
          credentials: "same-origin",
          method: "DELETE",
          signal: request.signal,
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!request.isCurrent()) return;

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
      setPendingDeleteId(null);
      success("Saved study guide deleted.");
    } catch (error) {
      if (!request.isCurrent()) return;
      setSavedError(
        error instanceof Error
          ? error.message
          : "The saved guide could not be deleted. Try again.",
      );
    } finally {
      if (request.isCurrent()) {
        setDeletingGuideId(null);
        request.finish();
      }
    }
  };
  return {
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
  };
}

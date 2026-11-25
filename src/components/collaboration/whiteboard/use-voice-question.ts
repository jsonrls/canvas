import { fitCameraToElements } from "@/lib/whiteboard/geometry";
import {
  getViewSize,
  type ViewportSize,
  type WhiteboardCamera,
  type WhiteboardElement,
} from "@/lib/whiteboard/model";
import {
  layoutVoiceQuestion,
  readVoiceQuestion,
  voiceErrorMessage,
  voiceQuestionElements,
} from "@/lib/whiteboard/voice-question";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type * as Y from "yjs";
import { measureBoardText } from "./measure-board-text";
import { useVoiceInput, type SpokenWords } from "./use-voice-input";

/** Screen space kept clear for the floating toolbars and the notice. */
const VIEW_INSET = { bottom: 64, side: 16, top: 104 };

/** Puts a spoken question on the board and asks for its answer. */
export function useVoiceQuestion({
  answerPlacedQuestion,
  camera,
  color,
  currentUser,
  elements,
  enabled,
  hasInteractedWithBoardRef,
  setCamera,
  setMessage,
  setSelectedId,
  transact,
  viewport,
}: {
  answerPlacedQuestion: (
    question: string,
    targetId: string,
    boardElements: WhiteboardElement[],
  ) => Promise<void>;
  camera: WhiteboardCamera;
  color: string;
  currentUser: { displayName: string; id: string };
  elements: WhiteboardElement[];
  enabled: boolean;
  hasInteractedWithBoardRef: RefObject<boolean>;
  setCamera: Dispatch<SetStateAction<WhiteboardCamera>>;
  setMessage: (message: string) => void;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  transact: (change: (document: Y.Doc) => void) => void;
  viewport: ViewportSize;
}) {
  const handleSpoken = ({
    errorCode,
    leftTab,
    transcript,
  }: SpokenWords): void => {
    const { kind, text } = readVoiceQuestion(transcript);
    const errorMessage = errorCode ? voiceErrorMessage(errorCode) : null;

    if (kind === "empty") {
      setMessage(
        errorMessage ??
          (leftTab
            ? "The microphone was turned off because you left this tab."
            : "Nothing was heard. Check your microphone and try again."),
      );
      return;
    }

    const size = getViewSize(viewport, camera.zoom);
    const layout = layoutVoiceQuestion({
      elements,
      measure: measureBoardText,
      text,
      view: {
        x: camera.x + VIEW_INSET.side / camera.zoom,
        y: camera.y + VIEW_INSET.top / camera.zoom,
        width: size.width - (VIEW_INSET.side * 2) / camera.zoom,
        height:
          size.height - (VIEW_INSET.top + VIEW_INSET.bottom) / camera.zoom,
      },
      withAnswer: kind === "question",
    });
    const placed = voiceQuestionElements({
      author: {
        color,
        id: currentUser.id,
        name: currentUser.displayName || "Study partner",
      },
      layout,
      newId: () => crypto.randomUUID(),
      now: Date.now(),
      text,
    });

    // The first element would otherwise trigger the board's automatic fit.
    hasInteractedWithBoardRef.current = true;
    // One change, so one Undo removes the whole set.
    transact((document) => {
      const elementMap = document.getMap<WhiteboardElement>(
        "whiteboard-elements",
      );
      for (const element of placed) elementMap.set(element.id, element);
    });
    setSelectedId(placed.find(({ type }) => type === "text")?.id ?? null);
    if (!layout.inView) {
      setCamera(fitCameraToElements(placed, viewport, camera.zoom));
    }

    if (kind !== "question") {
      setMessage(
        kind === "short"
          ? "That is too short to answer. The words are on the board."
          : "That is too long to answer (over 500 characters). The words are on the board; ask a shorter question.",
      );
      return;
    }
    if (leftTab) {
      setMessage(
        "The microphone was turned off because you left this tab. Choose AI answer to answer what you said.",
      );
      return;
    }

    const target = placed[placed.length - 1];
    void answerPlacedQuestion(text, target.id, [...elements, ...placed]);
  };

  const { cancel, download, seconds, start, status, stop } = useVoiceInput({
    enabled,
    onSpoken: handleSpoken,
  });

  const toggle = (): void => {
    if (status === "listening") {
      stop();
      return;
    }
    if (status === "starting") cancel();
    if (status !== "idle") return;
    setMessage("");
    start();
  };

  return { cancel, download, seconds, status, toggle };
}

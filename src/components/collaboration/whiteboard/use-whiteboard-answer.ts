import {
  WhiteboardAnswerPayload,
  WhiteboardTool,
} from "@/components/collaboration/whiteboard/types";
import { useToast } from "@/components/ui/toast";
import {
  formatWhiteboardAnswer,
  MAX_WHITEBOARD_CONTEXT_CHARACTERS,
} from "@/lib/ai/whiteboard-answer";
import { findWhiteboardAnswerPlacement } from "@/lib/whiteboard/answer-placement";
import {
  getElementBounds,
  type WhiteboardElement,
  type WhiteboardElementType,
} from "@/lib/whiteboard/model";
import { fitBoardTextInEllipse } from "@/lib/whiteboard/text-layout";
import { measureBoardText } from "./measure-board-text";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export function useWhiteboardAnswer({
  elements,
  selectedId,
  canEdit,
  roomId,
  upsertElement,
  readElement,
  currentUser,
  setSelectedId,
  setTool,
  autoAnswerTriggerRef,
}: {
  elements: WhiteboardElement[];
  selectedId: string | null;
  canEdit: boolean;
  roomId: string;
  upsertElement: (element: WhiteboardElement) => void;
  readElement: (id: string) => WhiteboardElement | null;
  currentUser: { displayName: string; id: string };
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  setTool: Dispatch<SetStateAction<WhiteboardTool>>;
  autoAnswerTriggerRef: RefObject<{
    id: string;
    type: WhiteboardElementType;
  } | null>;
}) {
  const { success } = useToast();

  const [aiAnswerMessage, setAiAnswerMessage] = useState("");

  const [aiAnswerLoading, setAiAnswerLoading] = useState(false);

  const pendingAnswerKeysRef = useRef<Set<string>>(new Set());

  const requestAnswer = useCallback(
    async (
      question: string,
      targetId: string,
      boardElements: WhiteboardElement[],
      loadingMessage: string,
    ): Promise<void> => {
      const answerKey = `${targetId}:${question}`;
      if (pendingAnswerKeysRef.current.has(answerKey)) return;
      pendingAnswerKeysRef.current.add(answerKey);
      setAiAnswerLoading(true);
      setAiAnswerMessage(loadingMessage);

      try {
        if (!navigator.onLine) {
          throw new Error(
            "You are offline. The question is on the board; choose AI answer when you are back online.",
          );
        }
        // Other text on the board tells the assistant the topic and level.
        const boardNotes = boardElements
          .filter(
            (element) =>
              element.type === "text" &&
              element.text.trim() &&
              element.text.trim() !== question,
          )
          .map((element) => element.text.trim())
          .join("\n")
          .slice(0, MAX_WHITEBOARD_CONTEXT_CHARACTERS);
        const response = await fetch(`/api/rooms/${roomId}/whiteboard-answer`, {
          body: JSON.stringify({
            question,
            ...(boardNotes ? { context: boardNotes } : {}),
          }),
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });
        const payload = (await response.json()) as WhiteboardAnswerPayload;

        if (!response.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "The AI answer could not be generated.",
          );
        }

        if (typeof payload.answer !== "string" || !payload.answer.trim()) {
          throw new Error("The AI answer was empty. Try again.");
        }

        const points = Array.isArray(payload.points)
          ? payload.points.filter(
              (point): point is string => typeof point === "string",
            )
          : [];
        const answerText = formatWhiteboardAnswer({
          answer: payload.answer.trim(),
          points,
        });
        // Where the circle is now, not when the question was asked.
        const target = readElement(targetId);
        if (!target) {
          throw new Error("The answer circle was removed before the answer.");
        }
        // Largest text size that fits the circle, centred in it.
        const targetBounds = getElementBounds(target);
        const box = fitBoardTextInEllipse(
          answerText,
          measureBoardText,
          targetBounds,
        );
        const id = crypto.randomUUID();

        upsertElement({
          authorId: currentUser.id,
          authorName: currentUser.displayName || "Study partner",
          color: "#7352FA",
          createdAt: new Date().toISOString(),
          fontSize: box.fontSize,
          height: box.height,
          id,
          points: [],
          src: "",
          text: answerText,
          type: "text",
          width: box.width,
          x: targetBounds.x + (targetBounds.width - box.width) / 2,
          y: targetBounds.y + (targetBounds.height - box.height) / 2,
        });
        setSelectedId(id);
        setTool("select");
        setAiAnswerMessage("");
        success("AI answer added inside the blank circle.");
      } catch (error) {
        setAiAnswerMessage(
          // `fetch` throws a TypeError with no useful text when it can't connect.
          error instanceof Error && !(error instanceof TypeError)
            ? error.message
            : "The AI answer could not be reached. Choose AI answer to try again.",
        );
      } finally {
        pendingAnswerKeysRef.current.delete(answerKey);
        setAiAnswerLoading(false);
      }
    },
    [
      currentUser.displayName,
      currentUser.id,
      readElement,
      roomId,
      setSelectedId,
      setTool,
      success,
      upsertElement,
    ],
  );

  const answerWhiteboardQuestion = useCallback(
    async (
      candidateElements = elements,
      candidateSelectedId = selectedId,
      mode: "auto" | "manual" = "manual",
    ): Promise<void> => {
      if (!canEdit || aiAnswerLoading) return;

      const placement = findWhiteboardAnswerPlacement(
        candidateElements,
        candidateSelectedId,
      );
      if (!placement) {
        if (mode === "manual") {
          setAiAnswerMessage(
            "Circle a question and draw an arrow to one blank circle.",
          );
        }
        return;
      }

      await requestAnswer(
        placement.question,
        placement.targetId,
        candidateElements,
        mode === "auto" ? "Answering inside the blank circle..." : "",
      );
    },
    [aiAnswerLoading, canEdit, elements, requestAnswer, selectedId],
  );

  /** For a question that comes with its own circle, so nothing to look for. */
  const answerPlacedQuestion = useCallback(
    async (
      question: string,
      targetId: string,
      boardElements: WhiteboardElement[],
    ): Promise<void> => {
      if (!canEdit) return;
      if (aiAnswerLoading) {
        setAiAnswerMessage(
          "Another answer is being written. Choose AI answer when it is done.",
        );
        return;
      }
      await requestAnswer(
        question,
        targetId,
        boardElements,
        "Answering your question…",
      );
    },
    [aiAnswerLoading, canEdit, requestAnswer],
  );

  useEffect(() => {
    const trigger = autoAnswerTriggerRef.current;
    if (!trigger || !canEdit || aiAnswerLoading) return;

    if (!elements.some((element) => element.id === trigger.id)) return;

    autoAnswerTriggerRef.current = null;
    if (
      trigger.type !== "arrow" &&
      trigger.type !== "draw" &&
      trigger.type !== "ellipse" &&
      trigger.type !== "line" &&
      trigger.type !== "text"
    ) {
      return;
    }

    void answerWhiteboardQuestion(elements, trigger.id, "auto");
  }, [
    aiAnswerLoading,
    answerWhiteboardQuestion,
    autoAnswerTriggerRef,
    canEdit,
    elements,
  ]);
  return {
    aiAnswerMessage,
    aiAnswerLoading,
    answerPlacedQuestion,
    answerWhiteboardQuestion,
    setAiAnswerMessage,
  };
}

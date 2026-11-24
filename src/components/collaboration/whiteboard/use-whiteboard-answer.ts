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

      const answerKey = `${placement.targetId}:${placement.question}`;
      if (pendingAnswerKeysRef.current.has(answerKey)) return;
      pendingAnswerKeysRef.current.add(answerKey);
      setAiAnswerLoading(true);
      setAiAnswerMessage(
        mode === "auto" ? "Answering inside the blank circle..." : "",
      );

      try {
        // Other text on the board tells the assistant the topic and level.
        const boardNotes = candidateElements
          .filter(
            (element) =>
              element.type === "text" &&
              element.text.trim() &&
              element.text.trim() !== placement.question,
          )
          .map((element) => element.text.trim())
          .join("\n")
          .slice(0, MAX_WHITEBOARD_CONTEXT_CHARACTERS);
        const response = await fetch(`/api/rooms/${roomId}/whiteboard-answer`, {
          body: JSON.stringify({
            question: placement.question,
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
        // Largest text size that fits the circle, centred in it.
        const { targetBounds } = placement;
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
          error instanceof Error
            ? error.message
            : "The AI answer could not be generated.",
        );
      } finally {
        pendingAnswerKeysRef.current.delete(answerKey);
        setAiAnswerLoading(false);
      }
    },
    [
      aiAnswerLoading,
      canEdit,
      currentUser.displayName,
      currentUser.id,
      elements,
      roomId,
      selectedId,
      setSelectedId,
      setTool,
      success,
      upsertElement,
    ],
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
  return { aiAnswerMessage, aiAnswerLoading, answerWhiteboardQuestion };
}

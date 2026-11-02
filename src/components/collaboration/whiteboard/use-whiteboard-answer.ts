import {
  WhiteboardAnswerPayload,
  WhiteboardTool,
} from "@/components/collaboration/whiteboard/types";
import { useToast } from "@/components/ui/toast";
import {
  findWhiteboardAnswerPlacement,
  wrapAnswerForTarget,
} from "@/lib/whiteboard/answer-placement";
import {
  type WhiteboardElement,
  type WhiteboardElementType,
} from "@/lib/whiteboard/model";
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
        const response = await fetch(`/api/rooms/${roomId}/whiteboard-answer`, {
          body: JSON.stringify({ question: placement.question }),
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

        const answerText = wrapAnswerForTarget(
          payload.answer.trim(),
          placement.targetBounds.width,
        );
        const lines = answerText.split("\n").filter(Boolean);
        const textHeight = Math.max(36, lines.length * 32);
        const textWidth = Math.max(160, placement.targetBounds.width - 48);
        const id = crypto.randomUUID();

        upsertElement({
          authorId: currentUser.id,
          authorName: currentUser.displayName || "Study partner",
          color: "#7352FA",
          createdAt: new Date().toISOString(),
          height: textHeight,
          id,
          points: [],
          src: "",
          text: answerText,
          type: "text",
          width: textWidth,
          x:
            placement.targetBounds.x +
            Math.max(18, (placement.targetBounds.width - textWidth) / 2),
          y:
            placement.targetBounds.y +
            Math.max(18, (placement.targetBounds.height - textHeight) / 2),
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

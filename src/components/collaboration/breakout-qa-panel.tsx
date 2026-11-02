"use client";

import { Button, IconButton } from "@/components/ui/button";
import {
  MessageCircleQuestion,
  SendHorizontal,
  Trash2,
  X,
} from "@/components/ui/icons";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Token } from "@astryxdesign/core/Token";
import { VStack } from "@astryxdesign/core/VStack";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import type { RoomDocumentKind } from "@/lib/rooms/repository";

interface BreakoutQaPanelProps {
  activeTool: RoomDocumentKind;
  canAsk: boolean;
  document: Y.Doc | null;
  draft: string;
  onDraftChange(draft: string): void;
  onClose(): void;
  participantCount: number;
  user: {
    color: string;
    id: string;
    name: string;
  } | null;
}

interface BreakoutQuestion {
  authorColor: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: number;
  id: string;
  tool: RoomDocumentKind;
}

const QUESTIONS_KEY = "breakout-questions";
const MAX_QUESTION_LENGTH = 300;
const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const TOOL_LABELS: Record<RoomDocumentKind, string> = {
  notes: "Notes",
  pdf: "PDF",
  whiteboard: "Board",
};

function isRoomDocumentKind(value: unknown): value is RoomDocumentKind {
  return value === "notes" || value === "pdf" || value === "whiteboard";
}

function isBreakoutQuestion(value: unknown): value is BreakoutQuestion {
  if (!value || typeof value !== "object") return false;

  const question = value as Partial<BreakoutQuestion>;

  return (
    typeof question.authorColor === "string" &&
    typeof question.authorId === "string" &&
    typeof question.authorName === "string" &&
    typeof question.body === "string" &&
    typeof question.createdAt === "number" &&
    typeof question.id === "string" &&
    isRoomDocumentKind(question.tool)
  );
}

function readQuestions(
  questions: Y.Array<BreakoutQuestion>,
): BreakoutQuestion[] {
  return questions
    .toArray()
    .filter(isBreakoutQuestion)
    .toSorted((first, second) => first.createdAt - second.createdAt);
}

function createQuestionId(document: Y.Doc): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${document.clientID}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function BreakoutQaPanel({
  activeTool,
  canAsk,
  document,
  draft,
  onDraftChange,
  onClose,
  participantCount,
  user,
}: BreakoutQaPanelProps): React.ReactElement {
  const [questions, setQuestions] = useState<BreakoutQuestion[]>([]);
  const questionListRef = useRef<HTMLDivElement>(null);
  const sharedQuestions = useMemo(
    () => document?.getArray<BreakoutQuestion>(QUESTIONS_KEY) ?? null,
    [document],
  );

  useEffect(() => {
    if (!sharedQuestions) {
      queueMicrotask(() => setQuestions([]));
      return;
    }

    const updateQuestions = (): void => {
      setQuestions(readQuestions(sharedQuestions));
    };

    updateQuestions();
    sharedQuestions.observe(updateQuestions);

    return () => {
      sharedQuestions.unobserve(updateQuestions);
    };
  }, [sharedQuestions]);

  useEffect(() => {
    const list = questionListRef.current;
    if (!list) return;

    list.scrollTop = list.scrollHeight;
  }, [questions.length]);

  const submitQuestion = (event: FormEvent<HTMLElement>): void => {
    event.preventDefault();

    const body = draft.trim();
    if (!body || !canAsk || !document || !sharedQuestions || !user) return;

    const question: BreakoutQuestion = {
      authorColor: user.color,
      authorId: user.id,
      authorName: user.name,
      body: body.slice(0, MAX_QUESTION_LENGTH),
      createdAt: Date.now(),
      id: createQuestionId(document),
      tool: activeTool,
    };

    document.transact(() => {
      sharedQuestions.push([question]);
    }, "breakout-qa");
    onDraftChange("");
  };

  const removeQuestion = (questionId: string): void => {
    if (!document || !sharedQuestions || !user) return;

    const questionIndex = sharedQuestions
      .toArray()
      .findIndex((question) => question.id === questionId);
    const question =
      questionIndex >= 0 ? sharedQuestions.get(questionIndex) : undefined;
    const isAuthor = questionIndex >= 0 && question?.authorId === user.id;

    if (!isAuthor) return;

    document.transact(() => {
      sharedQuestions.delete(questionIndex, 1);
    }, "breakout-qa");
  };

  return (
    <VStack
      as="section"
      id="breakout-qa-panel"
      aria-label="Breakout room Q and A"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
        }
      }}
      gap={0}
      className="h-full min-h-0 min-w-0 overflow-hidden bg-surface"
    >
      <HStack
        as="header"
        padding={4}
        gap={2}
        hAlign="between"
        vAlign="center"
        className="shrink-0 border-b border-border"
      >
        <VStack gap={1}>
          <Heading level={2}>Q&amp;A</Heading>
          <Text type="supporting">{participantCount} active</Text>
        </VStack>
        <IconButton
          label="Close Q and A"
          icon={<X aria-hidden="true" size={19} />}
          onClick={onClose}
        />
      </HStack>
      <VStack
        ref={questionListRef}
        isScrollable
        className="flex-1 min-h-0 min-w-0 overscroll-contain"
        aria-live="polite"
        aria-relevant="additions"
      >
        {questions.length > 0 ? (
          questions.map((question) => (
            <HStack
              as="article"
              padding={4}
              gap={3}
              key={question.id}
              className="shrink-0 min-w-0 border-b border-border"
            >
              <Avatar name={question.authorName} size="sm" />
              <VStack gap={2} className="flex-1 min-w-0">
                <HStack gap={2} hAlign="between" vAlign="start">
                  <VStack gap={1} className="min-w-0">
                    <Text weight="semibold" className="break-words">
                      {question.authorName}
                    </Text>
                    <HStack gap={2} wrap="wrap" vAlign="center">
                      <time
                        className="text-secondary text-sm"
                        dateTime={new Date(question.createdAt).toISOString()}
                      >
                        {TIME_FORMATTER.format(question.createdAt)}
                      </time>
                      <Token label={TOOL_LABELS[question.tool]} />
                    </HStack>
                  </VStack>
                  {user && question.authorId === user.id ? (
                    <IconButton
                      variant="danger-ghost"
                      label="Remove question"
                      icon={<Trash2 aria-hidden="true" size={16} />}
                      onClick={() => removeQuestion(question.id)}
                    />
                  ) : null}
                </HStack>
                <Text className="whitespace-pre-wrap break-words">
                  {question.body}
                </Text>
              </VStack>
            </HStack>
          ))
        ) : (
          <VStack
            gap={3}
            padding={6}
            hAlign="center"
            vAlign="center"
            className="flex-1"
          >
            <MessageCircleQuestion aria-hidden="true" size={24} />
            <Heading level={3}>Questions will appear here</Heading>
            <Text color="secondary">
              Ask about the shared notes, the PDF, or anything on the
              whiteboard.
            </Text>
          </VStack>
        )}
      </VStack>
      <VStack
        as="form"
        padding={4}
        gap={3}
        onSubmit={submitQuestion}
        className="shrink-0 border-t border-border"
      >
        <TextArea
          label="Ask the group"
          isDisabled={!canAsk || !document || !user}
          onChange={(value) =>
            onDraftChange(value.slice(0, MAX_QUESTION_LENGTH))
          }
          placeholder={
            canAsk
              ? `Ask about ${TOOL_LABELS[activeTool].toLowerCase()}…`
              : "Q&A is read-only"
          }
          rows={2}
          value={draft}
        />
        <Text type="supporting">
          {canAsk
            ? `${draft.length}/${MAX_QUESTION_LENGTH} · Visible to everyone in this breakout`
            : "The room owner has disabled viewer collaboration."}
        </Text>
        <Button
          label="Post question"
          icon={<SendHorizontal aria-hidden="true" size={17} />}
          isDisabled={!draft.trim() || !canAsk || !document || !user}
          type="submit"
        />
      </VStack>
    </VStack>
  );
}

"use client";

import {
  CircleHelp,
  MessageCircleQuestion,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import type { RoomDocumentKind } from "@/lib/rooms/repository";

interface BreakoutQaPanelProps {
  activeTool: RoomDocumentKind;
  canAsk: boolean;
  document: Y.Doc | null;
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
  onClose,
  participantCount,
  user,
}: BreakoutQaPanelProps): React.ReactElement {
  const [draft, setDraft] = useState("");
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

  const submitQuestion = (event: FormEvent<HTMLFormElement>): void => {
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
    setDraft("");
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
    <aside className="breakout-qa" aria-label="Breakout room Q and A">
      <header className="breakout-qa__header">
        <div>
          <span className="breakout-qa__eyebrow">
            <span aria-hidden="true" />
            Live
          </span>
          <h2>Q&amp;A</h2>
        </div>
        <div className="breakout-qa__header-actions">
          <span className="breakout-qa__active-count">
            {participantCount} active
          </span>
          <button
            aria-label="Close Q and A"
            className="breakout-qa__close"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
      </header>

      <div
        className="breakout-qa__questions"
        ref={questionListRef}
        aria-live="polite"
        aria-relevant="additions"
      >
        {questions.length > 0 ? (
          questions.map((question) => (
            <article className="breakout-qa__question" key={question.id}>
              <span
                className="breakout-qa__avatar"
                style={{ backgroundColor: question.authorColor }}
                aria-hidden="true"
              >
                {question.authorName.charAt(0).toUpperCase()}
              </span>
              <div>
                <div className="breakout-qa__question-heading">
                  <div className="breakout-qa__question-meta">
                    <strong>{question.authorName}</strong>
                    <time dateTime={new Date(question.createdAt).toISOString()}>
                      {TIME_FORMATTER.format(question.createdAt)}
                    </time>
                    <span>{TOOL_LABELS[question.tool]}</span>
                  </div>
                  {user && question.authorId === user.id ? (
                    <button
                      aria-label="Remove question"
                      onClick={() => removeQuestion(question.id)}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  ) : null}
                </div>
                <p>{question.body}</p>
              </div>
            </article>
          ))
        ) : (
          <div className="breakout-qa__empty">
            <span aria-hidden="true">
              <MessageCircleQuestion size={24} />
            </span>
            <h3>Questions will appear here</h3>
            <p>
              Ask about the shared notes, the PDF, or anything on the
              whiteboard.
            </p>
          </div>
        )}
      </div>

      <form className="breakout-qa__composer" onSubmit={submitQuestion}>
        <label htmlFor="breakout-question">
          <CircleHelp aria-hidden="true" size={15} />
          Ask the group
        </label>
        <div className="breakout-qa__composer-row">
          <textarea
            aria-describedby="breakout-question-help"
            disabled={!canAsk || !document || !user}
            id="breakout-question"
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={
              canAsk
                ? `Ask about ${TOOL_LABELS[activeTool].toLowerCase()}…`
                : "Q&A is read-only"
            }
            rows={1}
            value={draft}
          />
          <button
            aria-label="Post question"
            disabled={!draft.trim() || !canAsk || !document || !user}
            type="submit"
          >
            <SendHorizontal aria-hidden="true" size={17} />
          </button>
        </div>
        <p id="breakout-question-help">
          {canAsk
            ? `${draft.length}/${MAX_QUESTION_LENGTH} · Visible to everyone in this breakout`
            : "The room owner has disabled viewer collaboration."}
        </p>
      </form>
    </aside>
  );
}

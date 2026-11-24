"use client";

import { Dialog } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import { TextArea } from "@astryxdesign/core/TextArea";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { useEffect, useState } from "react";

import {
  LiveLeaderboard,
  LiveResults,
} from "@/components/collaboration/live/live-results";
import { LiveQuestionForm } from "@/components/collaboration/live/live-question-form";
import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { Button, IconButton } from "@/components/ui/button";
import {
  ChartColumnBig,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Play,
  RotateCcw,
  Square,
  Trash2,
  X,
} from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import {
  LIVE_KIND_LABELS,
  SCALE_MAX,
  WORDS_MAX,
  type LiveQuestion,
  type LiveResponseValue,
  type LiveSnapshot,
} from "@/lib/live/activities";

/** Ticks once a second while a quiz countdown is running. */
function useSecondsLeft(closesAt: string | null): number | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!closesAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [closesAt]);

  if (!closesAt) return null;
  return Math.max(0, Math.ceil((Date.parse(closesAt) - now) / 1000));
}

function describeResponse(
  question: LiveQuestion,
  value: LiveResponseValue,
): string {
  if ("option" in value) return question.options[value.option] ?? "";
  if ("words" in value) return value.words.join(", ");
  if ("text" in value) return value.text;
  return `${value.rating} out of ${SCALE_MAX}`;
}

function VotingStatus({
  isOpen,
  secondsLeft,
}: {
  isOpen: boolean;
  secondsLeft: number | null;
}): React.ReactElement {
  return (
    <HStack gap={2} vAlign="center" role="status">
      <StatusDot
        variant={isOpen ? "success" : "neutral"}
        label={isOpen ? "Voting open" : "Voting closed"}
        isPulsing={isOpen}
        aria-hidden
      />
      <Text weight="medium">{isOpen ? "Voting open" : "Voting closed"}</Text>
      {isOpen && secondsLeft !== null ? (
        <Token label={`${secondsLeft}s left`} color="orange" size="sm" />
      ) : null}
    </HStack>
  );
}

function AnswerForm({
  isBusy,
  onSubmit,
  question,
}: {
  isBusy: boolean;
  onSubmit(value: LiveResponseValue): void;
  question: LiveQuestion;
}): React.ReactElement {
  const [choice, setChoice] = useState("");
  const [text, setText] = useState("");

  const value: LiveResponseValue | null =
    question.kind === "poll" || question.kind === "quiz"
      ? choice === ""
        ? null
        : { option: Number(choice) }
      : question.kind === "scale"
        ? choice === ""
          ? null
          : { rating: Number(choice) }
        : question.kind === "word_cloud"
          ? text.trim()
            ? { words: text.split(",").slice(0, WORDS_MAX) }
            : null
          : text.trim()
            ? { text }
            : null;

  return (
    <VStack
      as="form"
      gap={4}
      aria-label="Your answer"
      onSubmit={(event: React.FormEvent) => {
        event.preventDefault();
        if (value) onSubmit(value);
      }}
    >
      {question.kind === "poll" || question.kind === "quiz" ? (
        <RadioList
          label="Choose one"
          value={choice}
          onChange={setChoice}
          width="100%"
        >
          {question.options.map((option, index) => (
            <RadioListItem
              key={`${index}-${option}`}
              label={option}
              value={String(index)}
            />
          ))}
        </RadioList>
      ) : question.kind === "scale" ? (
        <RadioList
          label={`Rate from 1 to ${SCALE_MAX}`}
          value={choice}
          onChange={setChoice}
          orientation="horizontal"
        >
          {Array.from({ length: SCALE_MAX }, (_, index) => (
            <RadioListItem
              key={index}
              label={String(index + 1)}
              value={String(index + 1)}
            />
          ))}
        </RadioList>
      ) : question.kind === "word_cloud" ? (
        <TextInput
          label="Your words"
          description={`Up to ${WORDS_MAX} words, separated by commas.`}
          value={text}
          onChange={setText}
          placeholder="photosynthesis, chlorophyll"
        />
      ) : (
        <TextArea
          label="Your answer"
          value={text}
          onChange={setText}
          maxLength={280}
          rows={4}
        />
      )}
      <HStack hAlign="end">
        <Button
          type="submit"
          label="Send answer"
          isLoading={isBusy}
          isDisabled={!value}
        />
      </HStack>
    </VStack>
  );
}

function QuestionHeading({
  question,
}: {
  question: LiveQuestion;
}): React.ReactElement {
  return (
    <VStack gap={2}>
      <HStack gap={2}>
        <Token label={LIVE_KIND_LABELS[question.kind]} size="sm" />
      </HStack>
      <Heading level={2} className="break-words">
        {question.prompt}
      </Heading>
    </VStack>
  );
}

function StudentStage({
  isBusy,
  onRespond,
  snapshot,
}: {
  isBusy: boolean;
  onRespond(question: LiveQuestion, value: LiveResponseValue): void;
  snapshot: LiveSnapshot;
}): React.ReactElement {
  const { current, session, myResponse, myPoints } = snapshot;
  const secondsLeft = useSecondsLeft(
    session.isAccepting ? session.closesAt : null,
  );

  if (!current) {
    return (
      <EmptyState
        title="Waiting for the host"
        description="When the host starts a question, it appears here and you can answer."
        icon={<ChartColumnBig />}
      />
    );
  }

  const isOpen =
    session.isAccepting && (secondsLeft === null || secondsLeft > 0);

  return (
    <VStack gap={6}>
      <QuestionHeading question={current} />
      <VotingStatus isOpen={isOpen} secondsLeft={secondsLeft} />
      {myResponse ? (
        <VStack gap={1} role="status">
          <Text weight="semibold">Answer sent</Text>
          <Text type="supporting" className="break-words">
            You answered: {describeResponse(current, myResponse)}
          </Text>
          {session.showResults && myPoints !== null ? (
            <Text weight="semibold">
              {myPoints > 0
                ? `Correct! +${myPoints} points`
                : "Not this time — 0 points"}
            </Text>
          ) : null}
        </VStack>
      ) : isOpen ? (
        <AnswerForm
          key={current.id}
          isBusy={isBusy}
          question={current}
          onSubmit={(value) => onRespond(current, value)}
        />
      ) : (
        <Text type="supporting">Voting is closed for this question.</Text>
      )}
      {session.showResults && snapshot.results ? (
        <>
          <Divider />
          <LiveResults question={current} results={snapshot.results} />
        </>
      ) : myResponse ? (
        <Text type="supporting">Results appear when the host shows them.</Text>
      ) : null}
      {snapshot.leaderboard ? (
        <LiveLeaderboard leaderboard={snapshot.leaderboard} />
      ) : null}
    </VStack>
  );
}

function HostStage({
  isBusy,
  onAct,
  snapshot,
}: {
  isBusy: boolean;
  onAct: LiveActivitiesState["act"];
  snapshot: LiveSnapshot;
}): React.ReactElement {
  const { current, questions, session } = snapshot;
  const [isResetOpen, setIsResetOpen] = useState(false);
  const secondsLeft = useSecondsLeft(
    session.isAccepting ? session.closesAt : null,
  );

  if (!current) {
    return (
      <EmptyState
        title={
          questions.length ? "Pick a question to present" : "No questions yet"
        }
        description={
          questions.length
            ? "Choose Present next to a question. Everyone in the room sees it here."
            : "Add a poll, word cloud, open question, scale, or quiz to get started."
        }
        icon={<ChartColumnBig />}
      />
    );
  }

  const index = questions.findIndex((question) => question.id === current.id);
  const previous = index > 0 ? questions[index - 1] : null;
  const next =
    index >= 0 && index < questions.length - 1 ? questions[index + 1] : null;
  const isOpen =
    session.isAccepting && (secondsLeft === null || secondsLeft > 0);

  return (
    <VStack gap={6}>
      <HStack gap={3} hAlign="between" vAlign="start" wrap="wrap">
        <QuestionHeading question={current} />
        <Text type="supporting">
          Question {index + 1} of {questions.length}
        </Text>
      </HStack>
      <HStack
        gap={2}
        wrap="wrap"
        vAlign="center"
        aria-label="Presenter controls"
        role="toolbar"
      >
        <Button
          label={session.isAccepting ? "Close voting" : "Open voting"}
          icon={
            session.isAccepting ? (
              <Square aria-hidden="true" size={16} />
            ) : (
              <Play aria-hidden="true" size={16} />
            )
          }
          isDisabled={isBusy}
          onClick={() =>
            void onAct({ action: "set_accepting", value: !session.isAccepting })
          }
        />
        <Button
          label={session.showResults ? "Hide results" : "Show results"}
          variant="secondary"
          icon={
            session.showResults ? (
              <EyeOff aria-hidden="true" size={16} />
            ) : (
              <Eye aria-hidden="true" size={16} />
            )
          }
          isDisabled={isBusy}
          onClick={() =>
            void onAct({ action: "set_results", value: !session.showResults })
          }
        />
        <IconButton
          label="Previous question"
          tooltip="Previous question"
          icon={<ChevronLeft aria-hidden="true" size={16} />}
          isDisabled={isBusy || !previous}
          onClick={() =>
            previous &&
            void onAct({ action: "present", questionId: previous.id })
          }
        />
        <IconButton
          label="Next question"
          tooltip="Next question"
          icon={<ChevronRight aria-hidden="true" size={16} />}
          isDisabled={isBusy || !next}
          onClick={() =>
            next && void onAct({ action: "present", questionId: next.id })
          }
        />
        <IconButton
          label="Reset all results"
          tooltip="Reset all results"
          icon={<RotateCcw aria-hidden="true" size={16} />}
          isDisabled={isBusy}
          onClick={() => setIsResetOpen(true)}
        />
        <IconButton
          label="Stop presenting this question"
          tooltip="Stop presenting"
          icon={<X aria-hidden="true" size={16} />}
          isDisabled={isBusy}
          onClick={() => void onAct({ action: "present", questionId: null })}
        />
      </HStack>
      <HStack gap={4} wrap="wrap" vAlign="center">
        <VotingStatus isOpen={isOpen} secondsLeft={secondsLeft} />
        <Text type="supporting">
          {session.showResults
            ? "Students can see the results."
            : "Results are hidden from students."}
        </Text>
      </HStack>
      <Divider />
      {snapshot.results ? (
        <LiveResults question={current} results={snapshot.results} />
      ) : null}
      {snapshot.leaderboard ? (
        <LiveLeaderboard leaderboard={snapshot.leaderboard} />
      ) : null}
      <Dialog
        isOpen={isResetOpen}
        onOpenChange={setIsResetOpen}
        aria-label="Reset all results"
        purpose="form"
        width={420}
      >
        <VStack gap={4} padding={6}>
          <Heading level={2}>Reset all results?</Heading>
          <Text>
            This permanently deletes every answer and quiz score in this room.
            Your questions stay.
          </Text>
          <HStack gap={2} hAlign="end">
            <Button
              label="Cancel"
              variant="ghost"
              onClick={() => setIsResetOpen(false)}
            />
            <Button
              label="Reset results"
              variant="destructive"
              isLoading={isBusy}
              onClick={async () => {
                if (await onAct({ action: "reset_results" })) {
                  setIsResetOpen(false);
                }
              }}
            />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}

function QuestionList({
  isBusy,
  onAct,
  snapshot,
}: {
  isBusy: boolean;
  onAct: LiveActivitiesState["act"];
  snapshot: LiveSnapshot;
}): React.ReactElement {
  if (snapshot.questions.length === 0) {
    return <Text type="supporting">Questions you add appear here.</Text>;
  }

  return (
    <List aria-label="Live questions">
      {snapshot.questions.map((question, index) => {
        const isCurrent = question.id === snapshot.session.questionId;
        return (
          <ListItem
            key={question.id}
            isSelected={isCurrent}
            startContent={<Text type="supporting">{index + 1}</Text>}
            label={question.prompt}
            description={LIVE_KIND_LABELS[question.kind]}
            endContent={
              <HStack gap={1}>
                <IconButton
                  label={`Present question ${index + 1}`}
                  tooltip={isCurrent ? "Presenting" : "Present"}
                  icon={<Play aria-hidden="true" size={16} />}
                  isDisabled={isBusy || isCurrent}
                  onClick={() =>
                    void onAct({ action: "present", questionId: question.id })
                  }
                />
                <IconButton
                  label={`Delete question ${index + 1}`}
                  tooltip="Delete"
                  icon={<Trash2 aria-hidden="true" size={16} />}
                  isDisabled={isBusy}
                  onClick={() =>
                    void onAct({
                      action: "delete_question",
                      questionId: question.id,
                    })
                  }
                />
              </HStack>
            }
          />
        );
      })}
    </List>
  );
}

export default function LiveActivitiesTool({
  live,
}: {
  live: LiveActivitiesState;
}): React.ReactElement {
  const { act, error, isMutating, snapshot } = live;

  if (!snapshot) {
    return error ? (
      <EmptyState
        title="Live activities are unavailable"
        description={error}
        icon={<ChartColumnBig />}
      />
    ) : (
      <LoadingIndicator label="Opening live activities…" size="panel" />
    );
  }

  const errorBanner = error ? (
    <Text role="alert" weight="medium" className="text-error">
      {error}
    </Text>
  ) : null;

  if (!snapshot.canHost) {
    return (
      <VStack gap={4} padding={6} className="mx-auto w-full max-w-2xl">
        {errorBanner}
        <StudentStage
          isBusy={isMutating}
          snapshot={snapshot}
          onRespond={(question, value) =>
            void act({ action: "respond", questionId: question.id, value })
          }
        />
      </VStack>
    );
  }

  return (
    <HStack
      gap={0}
      vAlign="stretch"
      className="min-h-full flex-col lg:flex-row"
    >
      <VStack
        as="aside"
        gap={6}
        padding={5}
        aria-label="Live questions"
        className="border-b border-border lg:w-96 lg:shrink-0 lg:border-b-0 lg:border-r"
      >
        <QuestionList isBusy={isMutating} onAct={act} snapshot={snapshot} />
        <Divider />
        <LiveQuestionForm
          isBusy={isMutating}
          onCreate={(draft) => act({ action: "create_question", draft })}
        />
      </VStack>
      <VStack
        gap={4}
        padding={6}
        className="min-w-0 flex-1"
        aria-label="Presented question"
        as="section"
      >
        {errorBanner}
        <HostStage isBusy={isMutating} onAct={act} snapshot={snapshot} />
      </VStack>
    </HStack>
  );
}

"use client";

import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Divider } from "@astryxdesign/core/Divider";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack, VStack } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { StatusDot } from "@astryxdesign/core/StatusDot";
import { Text } from "@astryxdesign/core/Text";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  describeResponse,
  LiveAnswerForm,
} from "@/components/collaboration/live/live-answer-form";
import {
  enterFullscreen,
  LiveProjector,
} from "@/components/collaboration/live/live-projector";
import { LiveQa } from "@/components/collaboration/live/live-qa";
import {
  LiveLeaderboard,
  LiveResults,
} from "@/components/collaboration/live/live-results";
import { LiveQuestionForm } from "@/components/collaboration/live/live-question-form";
import { useQuestionOrder } from "@/components/collaboration/live/use-question-order";
import type { LiveActivitiesState } from "@/components/collaboration/live/use-live-activities";
import { Button, ButtonControl, IconButton } from "@/components/ui/button";
import {
  ChartColumnBig,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  GripVertical,
  Maximize2,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  X,
} from "@/components/ui/icons";
import { LoadingIndicator } from "@/components/ui/LoadingScreen";
import { PANEL_ACCENT } from "@/components/ui/panel";
import {
  Countdown,
  LiveKindToken,
} from "@/components/collaboration/live/live-charts";
import { liveApiPath } from "@/lib/live/scope";
import { ordinal } from "@/lib/live/shapes";
import {
  canShareResults,
  layoutOf,
  LIVE_KIND_LABELS,
  LIVE_LAYOUT_LABELS,
  LIVE_LAYOUTS,
  liveOpenError,
  liveRevealError,
  showsLiveResults,
  type LiveLayout,
  type LiveQuestion,
  type LiveQuestionKind,
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

function voteNoun(kind: LiveQuestionKind): string {
  return kind === "qa" ? "Q&A" : kind === "form" ? "Form" : "Voting";
}

function VotingStatus({
  isOpen,
  kind,
  secondsLeft,
}: {
  isOpen: boolean;
  kind: LiveQuestionKind;
  secondsLeft: number | null;
}): React.ReactElement {
  const label =
    !isOpen && secondsLeft === 0
      ? "Time’s up"
      : `${voteNoun(kind)} ${isOpen ? "open" : "closed"}`;
  return (
    <HStack gap={2} vAlign="center" role="status">
      <StatusDot
        variant={isOpen ? "success" : "neutral"}
        label={label}
        isPulsing={isOpen}
        aria-hidden
      />
      <Text weight="medium">{label}</Text>
    </HStack>
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
        <LiveKindToken kind={question.kind} />
      </HStack>
      <Heading level={2} className="break-words">
        {question.prompt}
      </Heading>
    </VStack>
  );
}

/** How the student did, once the host shows results. */
function Verdict({
  snapshot,
}: {
  snapshot: LiveSnapshot;
}): React.ReactElement | null {
  const { current, leaderboard, myPoints, myResponse } = snapshot;
  if (!current || !myResponse) return null;
  const { answer, area } = current.settings;
  let title: string;
  let detail = "";
  if (current.kind === "quiz" && myPoints !== null) {
    title = myPoints > 0 ? "Correct" : "Not this time";
    detail = `+${myPoints} points.`;
    if (leaderboard?.me) {
      detail += ` You’re ${ordinal(leaderboard.me.rank)} overall.`;
    }
  } else if ("number" in myResponse && answer !== undefined) {
    const off = Math.abs(myResponse.number - answer);
    title = off === 0 ? "Exactly right" : `Off by ${off}`;
    detail = `The answer is ${answer}.`;
  } else if ("pin" in myResponse && area) {
    const { x, y } = myResponse.pin;
    const isInside =
      x >= area.x &&
      x <= area.x + area.width &&
      y >= area.y &&
      y <= area.y + area.height;
    title = isInside ? "In the correct area" : "Outside the correct area";
  } else {
    return null;
  }
  return (
    <VStack gap={1} className={PANEL_ACCENT}>
      <Heading level={3} className="text-2xl!">
        {title}
      </Heading>
      {detail ? <Text size="lg">{detail}</Text> : null}
    </VStack>
  );
}

function StudentStage({
  imageUrl,
  isBusy,
  onAct,
  snapshot,
}: {
  imageUrl: string;
  isBusy: boolean;
  onAct: LiveActivitiesState["act"];
  snapshot: LiveSnapshot;
}): React.ReactElement {
  const { current, session, myResponse } = snapshot;
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
      <HStack gap={4} hAlign="between" vAlign="start">
        <QuestionHeading question={current} />
        {isOpen && secondsLeft !== null && current.timeLimitSeconds ? (
          <Countdown seconds={secondsLeft} total={current.timeLimitSeconds} />
        ) : null}
      </HStack>
      <VotingStatus
        isOpen={isOpen}
        kind={current.kind}
        secondsLeft={secondsLeft}
      />
      {current.kind === "qa" ? (
        <LiveQa
          key={current.id}
          act={onAct}
          canHost={false}
          isBusy={isBusy}
          isOpen={isOpen}
          items={snapshot.qa ?? []}
          question={current}
        />
      ) : myResponse ? (
        <VStack gap={4} role="status">
          {session.showResults ? <Verdict snapshot={snapshot} /> : null}
          <Text weight="semibold">Answer sent</Text>
          <Text type="supporting" className="break-words">
            You answered: {describeResponse(current, myResponse)}
          </Text>
        </VStack>
      ) : isOpen ? (
        <LiveAnswerForm
          key={current.id}
          imageUrl={imageUrl}
          isBusy={isBusy}
          question={current}
          onSubmit={(value) =>
            void onAct({ action: "respond", questionId: current.id, value })
          }
        />
      ) : (
        <Text type="supporting">
          {voteNoun(current.kind)} is closed for this question.
        </Text>
      )}
      {session.showResults && snapshot.results ? (
        <>
          <Divider />
          <LiveResults
            imageUrl={imageUrl}
            question={current}
            results={snapshot.results}
          />
        </>
      ) : myResponse ? (
        <Text type="supporting">
          {canShareResults(current.kind)
            ? "Results appear when the host shows them."
            : "Only the room’s owner and editors see form answers."}
        </Text>
      ) : null}
      {snapshot.leaderboard ? (
        <LiveLeaderboard leaderboard={snapshot.leaderboard} />
      ) : null}
    </VStack>
  );
}

function presenterState(snapshot: LiveSnapshot) {
  const { current, questions, session } = snapshot;
  if (!current) {
    return { canShow: false, index: -1, openError: null, revealError: null };
  }
  const run = {
    hasOpened: session.hasOpened,
    responseCount: snapshot.responseCount,
  };
  return {
    canShow: current.kind !== "qa" && canShareResults(current.kind),
    index: questions.findIndex((question) => question.id === current.id),
    openError: session.isAccepting ? null : liveOpenError(current, run),
    revealError: session.showResults ? null : liveRevealError(current, run),
  };
}

function PresenterToolbar({
  children,
  isBusy,
  onAct,
  screen,
  snapshot,
}: {
  children?: React.ReactNode;
  isBusy: boolean;
  onAct: LiveActivitiesState["act"];
  /** On full screen, what the results button controls for live results. */
  screen?: { isHidden: boolean; onToggle(): void };
  snapshot: LiveSnapshot;
}): React.ReactElement | null {
  const { current, questions, session } = snapshot;
  const { canShow, index, openError, revealError } = presenterState(snapshot);
  if (!current) return null;
  const isLive = showsLiveResults(current);
  const isScreenToggle = screen !== undefined && isLive;
  const isShown = isScreenToggle ? !screen.isHidden : session.showResults;
  const noun =
    current.kind === "qa" ? "Q&A" : voteNoun(current.kind).toLowerCase();
  const previous = index > 0 ? questions[index - 1] : null;
  const next =
    index >= 0 && index < questions.length - 1 ? questions[index + 1] : null;

  return (
    <HStack
      gap={2}
      wrap="wrap"
      vAlign="center"
      aria-label="Presenter controls"
      role="toolbar"
    >
      <Button
        label={`${session.isAccepting ? "Close" : "Open"} ${noun}`}
        variant={session.isAccepting ? "destructive" : "primary"}
        icon={
          session.isAccepting ? (
            <Square aria-hidden="true" size={16} />
          ) : (
            <Play aria-hidden="true" size={16} />
          )
        }
        isDisabled={isBusy || openError !== null}
        onClick={() =>
          void onAct({ action: "set_accepting", value: !session.isAccepting })
        }
      />
      {canShow ? (
        <Button
          label={
            isLive && !isScreenToggle
              ? isShown
                ? "Hide from students"
                : "Show to students"
              : isShown
                ? "Hide results"
                : "Show results"
          }
          variant="secondary"
          icon={
            isShown ? (
              <EyeOff aria-hidden="true" size={16} />
            ) : (
              <Eye aria-hidden="true" size={16} />
            )
          }
          isDisabled={!isScreenToggle && (isBusy || revealError !== null)}
          onClick={() =>
            isScreenToggle
              ? screen.onToggle()
              : void onAct({ action: "set_results", value: !isShown })
          }
        />
      ) : null}
      <IconButton
        label="Previous question"
        tooltip="Previous question"
        icon={<ChevronLeft aria-hidden="true" size={16} />}
        isDisabled={isBusy || !previous}
        onClick={() =>
          previous && void onAct({ action: "present", questionId: previous.id })
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
      {children}
    </HStack>
  );
}

function HostStage({
  imageUrl,
  isBusy,
  onAct,
  snapshot,
}: {
  imageUrl: string;
  isBusy: boolean;
  onAct: LiveActivitiesState["act"];
  snapshot: LiveSnapshot;
}): React.ReactElement {
  const { current, questions, session } = snapshot;
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isProjecting, setIsProjecting] = useState(false);
  // Live results start on the screen again for each question.
  const [hiddenId, setHiddenId] = useState<string | null>(null);
  const stopProjecting = useCallback(() => setIsProjecting(false), []);
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

  const { canShow, index, openError, revealError } = presenterState(snapshot);
  const isOpen =
    session.isAccepting && (secondsLeft === null || secondsLeft > 0);
  const layouts = LIVE_LAYOUTS[current.kind];
  const isHidden = hiddenId === current.id;
  const votingStatus = (
    <VotingStatus
      isOpen={isOpen}
      kind={current.kind}
      secondsLeft={secondsLeft}
    />
  );

  return (
    <VStack gap={6}>
      <HStack gap={3} hAlign="between" vAlign="start" wrap="wrap">
        <QuestionHeading question={current} />
        <VStack gap={2} hAlign="end">
          <Text type="supporting">
            Question {index + 1} of {questions.length}
          </Text>
          {isOpen && secondsLeft !== null && current.timeLimitSeconds ? (
            <Countdown seconds={secondsLeft} total={current.timeLimitSeconds} />
          ) : null}
        </VStack>
      </HStack>
      <PresenterToolbar isBusy={isBusy} onAct={onAct} snapshot={snapshot}>
        <IconButton
          label="Full screen"
          tooltip="Full screen"
          icon={<Maximize2 aria-hidden="true" size={16} />}
          onClick={() => {
            setIsProjecting(true);
            enterFullscreen();
          }}
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
      </PresenterToolbar>
      {layouts ? (
        <SegmentedControl
          label="Show results as"
          className="self-start"
          value={layoutOf(current) ?? layouts[0]}
          onChange={(layout) =>
            void onAct({
              action: "set_layout",
              questionId: current.id,
              layout: layout as LiveLayout,
            })
          }
        >
          {layouts.map((layout) => (
            <SegmentedControlItem
              key={layout}
              value={layout}
              label={LIVE_LAYOUT_LABELS[layout]}
            />
          ))}
        </SegmentedControl>
      ) : null}
      <HStack gap={4} wrap="wrap" vAlign="center">
        {votingStatus}
        {canShow ? (
          <Text type="supporting">
            {session.showResults
              ? "Students can see the results."
              : "Results are hidden from students."}
          </Text>
        ) : null}
      </HStack>
      {(openError ?? revealError) ? (
        <Text as="p" type="supporting">
          {openError ?? revealError}
        </Text>
      ) : null}
      <Divider />
      {current.kind === "qa" ? (
        <LiveQa
          key={current.id}
          act={onAct}
          canHost
          isBusy={isBusy}
          isOpen={isOpen}
          items={snapshot.qa ?? []}
          question={current}
        />
      ) : snapshot.results ? (
        <LiveResults
          imageUrl={imageUrl}
          question={current}
          results={snapshot.results}
        />
      ) : null}
      {snapshot.leaderboard ? (
        <LiveLeaderboard leaderboard={snapshot.leaderboard} />
      ) : null}
      <LiveProjector
        act={onAct}
        controls={
          <PresenterToolbar
            isBusy={isBusy}
            onAct={onAct}
            screen={{
              isHidden,
              onToggle: () => setHiddenId(isHidden ? null : current.id),
            }}
            snapshot={snapshot}
          />
        }
        imageUrl={imageUrl}
        isHidden={isHidden}
        isOpen={isProjecting}
        onClose={stopProjecting}
        secondsLeft={isOpen ? secondsLeft : null}
        snapshot={snapshot}
        status={votingStatus}
      />
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
            This closes voting and permanently deletes every answer, audience
            question and quiz score in this room. Your questions stay.
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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const hintId = useId();
  const listRef = useRef<HTMLElement>(null);
  const {
    cancelDrag,
    dragBy,
    drag,
    dropSlot,
    endDrag,
    moved,
    questions,
    startDrag,
    step,
  } = useQuestionOrder({ listRef, onAct, questions: snapshot.questions });
  const pending = questions.find((question) => question.id === pendingId);

  const confirmDelete = async (): Promise<void> => {
    if (!pending) return;
    await onAct({ action: "delete_question", questionId: pending.id });
    // A failure shows in the page's alert, which the dialog would cover.
    setPendingId(null);
  };

  // A deleted row takes its button with it, so focus has nowhere to return.
  const lastPendingId = useRef<string | null>(null);
  useEffect(() => {
    if (pendingId !== null) {
      lastPendingId.current = pendingId;
      return;
    }
    const closedId = lastPendingId.current;
    lastPendingId.current = null;
    if (closedId && !questions.some((question) => question.id === closedId)) {
      listRef.current?.focus();
    }
  }, [pendingId, questions]);

  // Moving a row in the page drops the focus its handle had.
  useLayoutEffect(() => {
    if (!moved || document.activeElement !== document.body) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-move-id="${moved.id}"]`)
      ?.focus();
  }, [moved, questions]);

  return (
    <VStack ref={listRef} tabIndex={-1} className="outline-none">
      {questions.length > 1 ? (
        <Text id={hintId} className="sr-only">
          Drag to reorder, or press the up and down arrow keys.
        </Text>
      ) : null}
      <Text role="status" className="sr-only">
        {moved
          ? `Moved to ${questions.findIndex(({ id }) => id === moved.id) + 1} of ${questions.length}.`
          : ""}
      </Text>
      {questions.length === 0 ? (
        <Text type="supporting">Questions you add appear here.</Text>
      ) : (
        <List aria-label="Live questions">
          {questions.map((question, index) => {
            const isCurrent = question.id === snapshot.session.questionId;
            return (
              <ListItem
                key={question.id}
                isSelected={isCurrent}
                // The line shows where a dragged question will land.
                className={`border-y-2 ${
                  dropSlot === index
                    ? "border-t-accent!"
                    : "border-t-transparent!"
                } ${
                  dropSlot === questions.length &&
                  index === questions.length - 1
                    ? "border-b-accent!"
                    : "border-b-transparent!"
                } ${drag?.id === question.id ? "opacity-50" : ""}`}
                startContent={
                  <HStack gap={1} vAlign="center">
                    {questions.length > 1 ? (
                      <ButtonControl
                        variant="ghost"
                        size="sm"
                        className="touch-none! cursor-grab! px-1! active:cursor-grabbing!"
                        aria-label={`Move question ${index + 1}`}
                        aria-describedby={hintId}
                        title="Drag to reorder"
                        data-move-id={question.id}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          event.currentTarget.setPointerCapture(
                            event.pointerId,
                          );
                          startDrag(question.id, event.clientY);
                        }}
                        onPointerMove={(event) => dragBy(event.clientY)}
                        onPointerUp={endDrag}
                        onPointerCancel={cancelDrag}
                        onKeyDown={(event) => {
                          const by =
                            event.key === "ArrowUp"
                              ? -1
                              : event.key === "ArrowDown"
                                ? 1
                                : 0;
                          if (by === 0) return;
                          event.preventDefault();
                          step(question.id, by);
                        }}
                      >
                        <GripVertical aria-hidden="true" size={16} />
                      </ButtonControl>
                    ) : null}
                    <Text
                      type="supporting"
                      className="w-5 text-end tabular-nums"
                    >
                      {index + 1}
                    </Text>
                  </HStack>
                }
                label={question.prompt}
                description={LIVE_KIND_LABELS[question.kind]}
                endContent={
                  <HStack gap={1}>
                    <IconButton
                      label={`Present question ${index + 1}`}
                      tooltip={isCurrent ? "Presenting" : "Present"}
                      // Blue, with a light blue background on hover only.
                      variant="link"
                      icon={<Play aria-hidden="true" size={16} />}
                      isDisabled={isBusy || isCurrent}
                      onClick={() =>
                        void onAct({
                          action: "present",
                          questionId: question.id,
                        })
                      }
                    />
                    <IconButton
                      label={`Delete question ${index + 1}`}
                      tooltip="Delete"
                      variant="danger-ghost"
                      icon={<Trash2 aria-hidden="true" size={16} />}
                      isDisabled={isBusy}
                      onClick={() => setPendingId(question.id)}
                    />
                  </HStack>
                }
              />
            );
          })}
        </List>
      )}
      <Dialog
        isOpen={pending !== undefined}
        onOpenChange={(open) => {
          if (!open && !isBusy) setPendingId(null);
        }}
        purpose="form"
        role="alertdialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <VStack gap={4} padding={4}>
          <Heading level={2} id={titleId}>
            Delete this question?
          </Heading>
          <Text
            as="p"
            color="secondary"
            id={descriptionId}
            className="break-words"
          >
            “{pending?.prompt}” and every answer to it will be permanently
            deleted.
            {pending?.id === snapshot.session.questionId
              ? " It is being presented now."
              : ""}{" "}
            This can’t be undone.
          </Text>
          <HStack gap={2} hAlign="end" wrap="wrap">
            <Button
              label="Keep question"
              variant="ghost"
              data-autofocus
              onClick={() => {
                if (!isBusy) setPendingId(null);
              }}
            />
            <Button
              label="Delete question"
              variant="destructive"
              isLoading={isBusy}
              onClick={() => void confirmDelete()}
            />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}

function ExportButton({
  breakoutCode,
  roomSlug,
}: {
  breakoutCode?: string;
  roomSlug: string;
}): React.ReactElement {
  const [isExporting, setIsExporting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const download = async (): Promise<void> => {
    setFailure(null);
    setIsExporting(true);
    try {
      const response = await fetch(
        `${liveApiPath(roomSlug, breakoutCode)}/export`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("EXPORT_FAILED");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${breakoutCode ? `${roomSlug}-${breakoutCode}` : roomSlug}-live-results.xlsx`;
      link.click();
      // Safari starts the download after this turn.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setFailure("The results could not be exported. Try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <VStack gap={2}>
      <Button
        label="Export to Excel"
        variant="accent-soft"
        icon={<Download aria-hidden="true" size={16} />}
        isLoading={isExporting}
        onClick={() => void download()}
      />
      {failure ? (
        <Text role="alert" className="text-error">
          {failure}
        </Text>
      ) : null}
    </VStack>
  );
}

function HostPanel({
  breakoutCode,
  error,
  isBusy,
  onAct,
  roomSlug,
  snapshot,
}: {
  breakoutCode?: string;
  error: string | null;
  isBusy: boolean;
  onAct: LiveActivitiesState["act"];
  roomSlug: string;
  snapshot: LiveSnapshot;
}): React.ReactElement {
  const [isAdding, setIsAdding] = useState(false);
  const titleId = useId();
  const listRef = useRef<HTMLElement>(null);
  const count = snapshot.questions.length;

  return (
    <VStack
      as="aside"
      gap={0}
      aria-labelledby={titleId}
      className="border-b border-border @2xl:w-96 @2xl:min-h-0 @2xl:shrink-0 @2xl:border-b-0 @2xl:border-r"
    >
      <HStack
        gap={2}
        hAlign="between"
        vAlign="center"
        wrap="wrap"
        className="shrink-0 px-5 pt-5 pb-2"
      >
        <Heading level={2} id={titleId} className="text-lg!">
          Questions{count > 0 ? ` (${count})` : ""}
        </Heading>
        {count > 0 ? (
          <ExportButton breakoutCode={breakoutCode} roomSlug={roomSlug} />
        ) : null}
      </HStack>
      <VStack
        ref={listRef}
        className="px-5 py-2 @2xl:min-h-0 @2xl:flex-1 @2xl:overflow-y-auto"
      >
        <QuestionList isBusy={isBusy} onAct={onAct} snapshot={snapshot} />
      </VStack>
      {/* Stays in view: below the list, or above it where the page scrolls. */}
      <VStack className="shrink-0 px-5 py-4 @max-2xl:order-first @2xl:border-t @2xl:border-border">
        <Button
          label="Add question"
          variant="primary"
          width="100%"
          icon={<Plus aria-hidden="true" size={16} />}
          onClick={() => setIsAdding(true)}
        />
      </VStack>
      {/* Stays mounted, so closing it keeps what was typed. */}
      <Dialog
        isOpen={isAdding}
        onOpenChange={(open) => {
          if (!isBusy) setIsAdding(open);
        }}
        purpose="form"
        width={560}
        maxHeight="90dvh"
      >
        <DialogHeader
          title="Add a question"
          onOpenChange={(open) => {
            if (!isBusy) setIsAdding(open);
          }}
        />
        <LiveQuestionForm
          error={error}
          isBusy={isBusy}
          onCancel={() => setIsAdding(false)}
          onCreate={async (draft, image) => {
            const created = await onAct(
              { action: "create_question", draft },
              image,
            );
            if (created) {
              setIsAdding(false);
              // After the new row is drawn. Closing returns focus first.
              setTimeout(() => {
                listRef.current
                  ?.querySelector("li:last-child")
                  ?.scrollIntoView({ block: "nearest" });
              });
            }
            return created;
          }}
        />
      </Dialog>
    </VStack>
  );
}

export default function LiveActivitiesTool({
  breakoutCode,
  live,
  roomSlug,
}: {
  breakoutCode?: string;
  live: LiveActivitiesState;
  roomSlug: string;
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

  const imageUrl = `${liveApiPath(roomSlug, breakoutCode)}/image?questionId=${snapshot.current?.id ?? ""}`;
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
          imageUrl={imageUrl}
          isBusy={isMutating}
          onAct={act}
          snapshot={snapshot}
        />
      </VStack>
    );
  }

  return (
    // Sized by its own width: a breakout can have the Q&A rail beside it.
    <VStack gap={0} className="@container h-full">
      <HStack
        gap={0}
        vAlign="stretch"
        // When wide, the two sides scroll on their own, so both stay in reach.
        className="min-h-full flex-col @2xl:h-full @2xl:flex-row"
      >
        <HostPanel
          breakoutCode={breakoutCode}
          error={error}
          isBusy={isMutating}
          onAct={act}
          roomSlug={roomSlug}
          snapshot={snapshot}
        />
        <VStack
          gap={4}
          padding={6}
          className="min-w-0 flex-1 @2xl:min-h-0 @2xl:overflow-y-auto"
          aria-label="Presented question"
          as="section"
        >
          {errorBanner}
          <HostStage
            imageUrl={imageUrl}
            isBusy={isMutating}
            onAct={act}
            snapshot={snapshot}
          />
        </VStack>
      </HStack>
    </VStack>
  );
}

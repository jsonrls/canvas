"use client";

import { Avatar } from "@astryxdesign/core/Avatar";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { useEffect, useRef, useState } from "react";

import {
  ChoiceChart,
  RankedBars,
  WordCloud,
} from "@/components/collaboration/live/live-charts";
import { ButtonControl } from "@/components/ui/button";
import {
  ChartColumnBig,
  type IconComponent,
  MessageCircleQuestion,
  Sparkles,
  ThumbsUp,
  Trophy,
} from "@/components/ui/icons";

/*
 * Sample live activities as a pair: the room's big screen, drawn with the
 * real charts, and one person's phone. Tapping on the phone changes the
 * screen, but nothing here reaches a real room.
 */

interface Scene {
  /** What the room sees. */
  screen: React.ReactElement;
  /** What one person answers with. */
  phone: React.ReactElement;
  /** A short count shown beside the host's name. */
  tally: string;
}

const PHONE_CHOICE =
  "min-h-11 w-full cursor-pointer rounded-2xl px-3 text-left font-medium transition-colors";
const CHOICE_IDLE = "bg-muted text-primary! hover:bg-accent-muted";
const CHOICE_PICKED = "bg-inverted text-surface!";

const POLL_OPTIONS = ["Cheaper books", "More readers", "Faster news"];
const POLL_VOTES = [6, 4, 2];

function usePollScene(): Scene {
  const [choice, setChoice] = useState<number | null>(null);
  const counts = POLL_VOTES.map(
    (votes, index) => votes + (choice === index ? 1 : 0),
  );

  return {
    tally: `${counts.reduce((sum, count) => sum + count)} votes`,
    screen: (
      <VStack gap={5}>
        <Text as="p" weight="medium" className="landing-h3">
          What did printing change most?
        </Text>
        <ChoiceChart
          layout="columns"
          options={POLL_OPTIONS}
          counts={counts}
          correctOption={null}
        />
      </VStack>
    ),
    phone: (
      <VStack role="group" aria-label="Vote in the sample poll" gap={2}>
        <Text weight="semibold">Tap to vote</Text>
        {POLL_OPTIONS.map((option, index) => (
          <ButtonControl
            key={option}
            variant="custom"
            aria-pressed={choice === index}
            onClick={() => setChoice(index)}
            className={`${PHONE_CHOICE} ${choice === index ? CHOICE_PICKED : CHOICE_IDLE}`}
          >
            {option}
          </ButtonControl>
        ))}
      </VStack>
    ),
  };
}

const CLOUD_WORDS = [
  { text: "books", count: 9 },
  { text: "ideas", count: 7 },
  { text: "science", count: 6 },
  { text: "debate", count: 4 },
  { text: "letters", count: 4 },
  { text: "reform", count: 3 },
  { text: "readers", count: 3 },
  { text: "stories", count: 2 },
  { text: "learning", count: 2 },
];
const MY_WORD = "maps";

function useCloudScene(): Scene {
  const [isSent, setIsSent] = useState(false);
  const words = isSent
    ? [...CLOUD_WORDS, { text: MY_WORD, count: 5 }]
    : CLOUD_WORDS;

  return {
    tally: `${words.length} words`,
    screen: (
      <VStack gap={5}>
        <Text as="p" weight="medium" className="landing-h3">
          One word for what printing spread
        </Text>
        <WordCloud words={words} />
      </VStack>
    ),
    phone: (
      <VStack gap={2}>
        <Text weight="semibold">Your word</Text>
        <HStack vAlign="center" className="min-h-11 rounded-2xl bg-muted px-3">
          <Text weight="medium">{MY_WORD}</Text>
        </HStack>
        <ButtonControl
          variant="custom"
          aria-pressed={isSent}
          onClick={() => setIsSent(!isSent)}
          className={`${PHONE_CHOICE} text-center ${isSent ? CHOICE_PICKED : "bg-accent-bg text-surface!"}`}
        >
          {isSent ? "Sent. Take it back" : "Send to the cloud"}
        </ButtonControl>
      </VStack>
    ),
  };
}

const QUIZ_OPTIONS = ["Venice", "Mainz", "Paris"];
const QUIZ_ANSWER = 1;
const MY_QUIZ_POINTS = 940;
const LEADERS = [
  { name: "Lea Tan", value: 2840 },
  { name: "Marco Diaz", value: 2610 },
];
const PLACES = ["1st", "2nd", "3rd"];

function useQuizScene(): Scene {
  const [pick, setPick] = useState<number | null>(null);
  const isRight = pick === QUIZ_ANSWER;
  const rows = [
    ...LEADERS,
    { name: "You", value: 1975 + (isRight ? MY_QUIZ_POINTS : 0) },
  ]
    .sort((a, b) => b.value - a.value)
    .map((leader, index) => ({
      ...leader,
      color: index,
      place: PLACES[index],
      valueLabel: `${leader.value.toLocaleString("en-US")} points`,
    }));

  function optionTone(index: number): string {
    if (pick === null) return CHOICE_IDLE;
    if (index === QUIZ_ANSWER) return "bg-success-muted text-primary!";
    return index === pick
      ? "bg-error-muted text-primary!"
      : "bg-muted text-primary!";
  }

  return {
    tally: "Question 4 of 4",
    screen: (
      <VStack gap={5}>
        <Text as="p" weight="medium" className="landing-h3">
          Leaderboard
        </Text>
        <RankedBars label="Sample leaderboard" max={3000} rows={rows} />
      </VStack>
    ),
    phone: (
      <VStack role="group" aria-label="Answer the sample quiz" gap={2}>
        <Text weight="semibold">Where did Gutenberg print?</Text>
        {QUIZ_OPTIONS.map((option, index) => (
          <ButtonControl
            key={option}
            variant="custom"
            aria-pressed={pick === index}
            onClick={() => setPick(index)}
            className={`${PHONE_CHOICE} ${optionTone(index)}`}
          >
            {option}
          </ButtonControl>
        ))}
        <Text color="secondary" aria-live="polite">
          {pick === null
            ? "Faster answers score more."
            : isRight
              ? `Correct. +${MY_QUIZ_POINTS} points.`
              : `It was ${QUIZ_OPTIONS[QUIZ_ANSWER]}.`}
        </Text>
      </VStack>
    ),
  };
}

const ROOM_QUESTIONS = [
  { text: "Was paper or metal type the bigger cost?", votes: 5 },
  { text: "How many copies came from one print run?", votes: 5 },
  { text: "Who was able to read them?", votes: 2 },
];

function useQaScene(): Scene {
  const [upvoted, setUpvoted] = useState<string[]>([]);
  const ranked = ROOM_QUESTIONS.map((question) => ({
    ...question,
    votes: question.votes + (upvoted.includes(question.text) ? 1 : 0),
  })).sort((a, b) => b.votes - a.votes);

  return {
    tally: `${ROOM_QUESTIONS.length} questions`,
    screen: (
      <VStack gap={5}>
        <Text as="p" weight="medium" className="landing-h3">
          Questions from the room
        </Text>
        <VStack as="ol" gap={2}>
          {ranked.map(({ text, votes }) => (
            <HStack
              as="li"
              key={text}
              gap={3}
              hAlign="between"
              vAlign="center"
              className="rounded-2xl bg-muted py-3 pr-4 pl-4"
            >
              <Text className="min-w-0">{text}</Text>
              <HStack gap={1} vAlign="center" className="shrink-0">
                <ThumbsUp size={14} aria-hidden="true" />
                <Text weight="semibold">{votes}</Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      </VStack>
    ),
    phone: (
      <VStack role="group" aria-label="Upvote a sample question" gap={2}>
        <Text weight="semibold">Upvote a question</Text>
        {ROOM_QUESTIONS.map(({ text }) => {
          const isUpvoted = upvoted.includes(text);

          return (
            <ButtonControl
              key={text}
              variant="custom"
              aria-pressed={isUpvoted}
              onClick={() =>
                setUpvoted(
                  isUpvoted
                    ? upvoted.filter((item) => item !== text)
                    : [...upvoted, text],
                )
              }
              className={`${PHONE_CHOICE} py-2 ${isUpvoted ? CHOICE_PICKED : CHOICE_IDLE}`}
            >
              {text}
            </ButtonControl>
          );
        })}
      </VStack>
    ),
  };
}

const ACTIVITIES: {
  title: string;
  detail: string;
  Icon: IconComponent;
}[] = [
  {
    title: "Poll",
    detail: "Everyone taps a choice. The columns grow as the votes arrive.",
    Icon: ChartColumnBig,
  },
  {
    title: "Word cloud",
    detail: "Short answers, sized by how often the room gives them.",
    Icon: Sparkles,
  },
  {
    title: "Quiz",
    detail: "A timer, points for speed, and a leaderboard after each question.",
    Icon: Trophy,
  },
  {
    title: "Live Q&A",
    detail: "People send questions and upvote the ones they want answered.",
    Icon: MessageCircleQuestion,
  },
];

/** From this width the section pins and scrolling changes the activity. */
const PINNED = "(min-width: 1024px)";
const ENTER =
  "transition duration-500 ease-out starting:translate-y-4 starting:opacity-0";

/**
 * The whole section: a heading, a row of activity tabs, and one large frame
 * holding the big screen and a phone. From `lg` it pins to the viewport while
 * the page scrolls through one step per activity; the bar in the open tab
 * fills as its step passes. Below `lg` it is a plain stack and the tabs choose.
 */
export function LiveActivitiesDemo(): React.ReactElement {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scenes = [
    usePollScene(),
    useCloudScene(),
    useQuizScene(),
    useQaScene(),
  ];
  const active = ACTIVITIES[activeIndex] ?? ACTIVITIES[0];
  const scene = scenes[activeIndex] ?? scenes[0];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;

    const update = (): void => {
      frame = 0;
      const travel = track.offsetHeight - window.innerHeight;
      if (!window.matchMedia(PINNED).matches || travel <= 0) {
        track.style.removeProperty("--landing-step-progress");
        return;
      }
      const progress = -track.getBoundingClientRect().top / travel;
      const step = Math.min(0.999, Math.max(0, progress)) * ACTIVITIES.length;
      track.style.setProperty("--landing-step-progress", (step % 1).toFixed(3));
      setActiveIndex(Math.floor(step));
    };
    const schedule = (): void => {
      frame ||= requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  function openStep(index: number): void {
    const track = trackRef.current;
    const travel = track ? track.offsetHeight - window.innerHeight : 0;
    if (!track || !window.matchMedia(PINNED).matches || travel <= 0) {
      setActiveIndex(index);
      return;
    }
    // While pinned the scroll position owns the step, so move the page there.
    window.scrollTo({
      top:
        track.getBoundingClientRect().top +
        window.scrollY +
        (travel * (index + 0.5)) / ACTIVITIES.length,
    });
  }

  return (
    <VStack ref={trackRef} gap={0}>
      <VStack gap={5} className="lg:sticky lg:top-0 lg:h-dvh lg:pt-20 lg:pb-6">
        <VStack gap={4} hAlign="start">
          <HStack
            gap={2}
            vAlign="center"
            className="rounded-full border border-border bg-surface px-3 py-1"
          >
            <ChartColumnBig size={14} aria-hidden="true" />
            <Text weight="medium">Live activities</Text>
          </HStack>
          <HStack
            gap={4}
            className="w-full flex-col items-stretch! lg:flex-row lg:items-end! lg:justify-between"
          >
            <Heading
              level={2}
              id="live-title"
              textWrap="balance"
              className="landing-title max-w-xl"
            >
              Ask the room, watch it answer
            </Heading>
            <Text
              as="p"
              key={active.title}
              color="secondary"
              className={`landing-body max-w-sm ${ENTER}`}
            >
              {active.detail}
            </Text>
          </HStack>
        </VStack>
        <Grid
          role="group"
          aria-label="Sample activities"
          columns={{ minWidth: 150, max: 4 }}
          gap={2}
        >
          {ACTIVITIES.map(({ title, Icon }, index) => {
            const isActive = index === activeIndex;

            return (
              <ButtonControl
                key={title}
                variant="custom"
                aria-pressed={isActive}
                onClick={() => openStep(index)}
                className={`relative flex min-h-14 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl p-2 text-left transition-colors duration-300 ${
                  isActive ? "bg-inverted" : "bg-muted hover:bg-accent-muted"
                }`}
              >
                <VStack
                  hAlign="center"
                  className="size-10 shrink-0 justify-center rounded-xl bg-surface"
                >
                  <Icon size={18} aria-hidden="true" className="text-accent" />
                </VStack>
                <Text
                  weight="semibold"
                  className={`text-base! ${isActive ? "text-surface!" : ""}`}
                >
                  {title}
                </Text>
                {isActive ? (
                  <VStack
                    aria-hidden="true"
                    className="landing-step-fill absolute inset-x-0 bottom-0 h-1 bg-accent-bg"
                  />
                ) : null}
              </ButtonControl>
            );
          })}
        </Grid>
        <VStack className="min-h-0 flex-1 justify-center rounded-3xl bg-muted p-4 md:p-6">
          <HStack
            key={active.title}
            data-ui=""
            gap={0}
            className={`flex-col items-center! justify-center sm:flex-row ${ENTER}`}
          >
            <VStack
              gap={5}
              className="landing-float w-full max-w-2xl min-w-0 rounded-3xl bg-surface p-5 sm:flex-1 sm:pr-10 md:pr-12"
            >
              <HStack gap={3} hAlign="between" vAlign="center">
                <HStack gap={2} vAlign="center">
                  <Avatar name="Ana Reyes" size="sm" tooltip={false} />
                  <Text weight="medium">Ana is hosting</Text>
                </HStack>
                <Text color="secondary">{scene.tally}</Text>
              </HStack>
              {scene.screen}
            </VStack>
            <VStack
              gap={3}
              className="landing-float -mt-4 w-56 shrink-0 rounded-3xl border-4 border-inverted bg-surface p-3 sm:mt-16 sm:-ml-8"
            >
              <VStack
                aria-hidden="true"
                className="mx-auto h-1 w-10 rounded-full bg-inverted/20"
              />
              {scene.phone}
            </VStack>
          </HStack>
        </VStack>
      </VStack>
      {ACTIVITIES.slice(1).map(({ title }) => (
        <VStack
          key={title}
          aria-hidden="true"
          className="hidden! h-120 lg:block!"
        />
      ))}
    </VStack>
  );
}

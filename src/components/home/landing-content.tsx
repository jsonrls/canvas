import { Avatar } from "@astryxdesign/core/Avatar";
import { Grid } from "@astryxdesign/core/Grid";
import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import Image from "next/image";

import {
  FaqList,
  FlashcardDemo,
  LiveRoom,
  OfflineDemo,
  SessionSteps,
} from "./landing-demos";
import {
  NotesFragment,
  PdfFragment,
  QuizFragment,
  SummaryFragment,
  WhiteboardFragment,
} from "./landing-fragments";
import {
  FRAME,
  LandingSection,
  PillLink,
  REVEAL,
  SectionHead,
} from "./landing-section";
import {
  Bookmark,
  BrainCircuit,
  Check,
  Crown,
  DoorOpen,
  Eye,
  FileText,
  Highlighter,
  History,
  type IconComponent,
  Layers3,
  MessageCircleQuestion,
  PenTool,
  Pencil,
  Presentation,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Split,
} from "@/components/ui/icons";

interface LandingAction {
  destination: string;
  action: string;
}

const STUDENTS = "/images/home-study-collaboration.png";

/* The photo's white ground is pushed to pure white, then multiplied away. */
const PHOTO = "object-cover brightness-105 contrast-105 mix-blend-multiply";

const HERO_FACTS = ["Live", "Works offline", "Role-based"];

const HERO_PRESENCE = [
  { name: "Ana Reyes", detail: "Editing the notes", place: "Notes" },
  { name: "Marco Diaz", detail: "Highlighted page 12", place: "PDF" },
];

const ROOM_TOOLS = [
  { label: "Shared notes", Icon: PenTool },
  { label: "PDF markup", Icon: FileText },
  { label: "Whiteboard", Icon: Presentation },
  { label: "Study packs", Icon: BrainCircuit },
  { label: "Offline edits", Icon: RefreshCw },
  { label: "Member roles", Icon: ShieldCheck },
];

export function LandingHero({
  destination,
  action,
}: LandingAction): React.ReactElement {
  return (
    <VStack
      as="section"
      aria-labelledby="home-title"
      hAlign="center"
      className="px-4 pt-12 pb-14 md:px-8 lg:pt-20 lg:pb-20"
    >
      <VStack width="100%" maxWidth={FRAME} gap={10} hAlign="center">
        <VStack gap={6} hAlign="center" className="text-center">
          <HStack
            gap={3}
            vAlign="center"
            className="rounded-full border border-border bg-surface px-4 py-1"
          >
            <ShieldCheck size={14} aria-hidden="true" />
            {HERO_FACTS.map((fact) => (
              <Text key={fact} weight="medium">
                {fact}
              </Text>
            ))}
          </HStack>
          <Heading
            level={1}
            id="home-title"
            textWrap="balance"
            className="landing-display max-w-4xl"
          >
            Write, mark up &amp; review in one shared room.
          </Heading>
          <Text as="p" color="secondary" className="landing-body max-w-xl">
            Qollab is a study room for your group. Write notes, annotate PDFs
            and sketch on a whiteboard live, then turn it all into a review.
          </Text>
          <HStack gap={3} wrap="wrap" hAlign="center">
            <PillLink href={destination} label={action} />
            <PillLink href="#how" label="See how it works" tone="outline" />
          </HStack>
        </VStack>
        <HStack gap={4} className="w-full flex-col items-stretch! lg:flex-row">
          <VStack className="landing-photo relative min-h-120 min-w-0 overflow-hidden rounded-3xl lg:w-4/12">
            <Image
              src={STUDENTS}
              alt="Two students smiling, one holding a laptop."
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 380px"
              className={`landing-crop-a ${PHOTO}`}
            />
            <VStack gap={2} className="relative mt-auto p-4">
              {HERO_PRESENCE.map(({ name, detail, place }) => (
                <HStack
                  key={name}
                  gap={3}
                  vAlign="center"
                  className="landing-float rounded-2xl bg-surface p-3"
                >
                  <Avatar name={name} size="sm" tooltip={false} />
                  <VStack gap={0} className="min-w-0 flex-1">
                    <Text weight="semibold">{name}</Text>
                    <Text color="secondary">{detail}</Text>
                  </VStack>
                  <Text weight="semibold" className="text-accent!">
                    {place}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </VStack>
          <VStack
            hAlign="center"
            className="landing-sky relative min-w-0 justify-center overflow-hidden rounded-3xl p-4 md:p-8 lg:w-8/12"
          >
            <LiveRoom />
            <VStack
              gap={3}
              aria-hidden="true"
              className="absolute top-1/2 right-6 hidden! -translate-y-1/2 xl:flex!"
            >
              {["Lea Tan", "Marco Diaz"].map((name) => (
                <VStack
                  key={name}
                  hAlign="center"
                  className="size-14 justify-center rounded-2xl bg-surface/90"
                >
                  <Avatar name={name} size="sm" tooltip={false} />
                </VStack>
              ))}
            </VStack>
          </VStack>
        </HStack>
        <Text as="p" color="secondary">
          Sample room. Names and notes are illustrative.
        </Text>
        <VStack gap={5} hAlign="center" className="w-full">
          <Text as="p" weight="medium" className="text-base!">
            <Text weight="medium" className="text-base! text-accent!">
              Everything
            </Text>{" "}
            a study group needs, in one room
          </Text>
          <Grid columns={{ minWidth: 104, max: 6 }} gap={3} className="w-full">
            {ROOM_TOOLS.map(({ label, Icon }) => (
              <VStack
                key={label}
                gap={2}
                hAlign="center"
                className="rounded-2xl bg-muted px-2 py-5 text-center"
              >
                <Icon size={20} aria-hidden="true" />
                <Text weight="semibold">{label}</Text>
              </VStack>
            ))}
          </Grid>
        </VStack>
      </VStack>
    </VStack>
  );
}

interface CardProps {
  Icon: IconComponent;
  title: string;
  detail: string;
  children: React.ReactNode;
}

function WhyCard({
  Icon,
  title,
  detail,
  children,
}: CardProps): React.ReactElement {
  return (
    <VStack
      as="article"
      data-reveal=""
      gap={6}
      className={`min-w-0 rounded-3xl bg-muted p-6 lg:flex-1 ${REVEAL}`}
    >
      <VStack gap={2}>
        <Icon size={22} aria-hidden="true" className="text-accent" />
        <Heading level={3} className="landing-h3">
          {title}
        </Heading>
        <Text as="p" color="secondary">
          {detail}
        </Text>
      </VStack>
      <VStack className="mt-auto overflow-hidden rounded-2xl bg-surface">
        {children}
      </VStack>
    </VStack>
  );
}

export function LandingWhy(): React.ReactElement {
  return (
    <LandingSection id="why" labelledBy="why-title">
      <SectionHead
        id="why-title"
        Icon={Sparkles}
        label="Why Qollab"
        title="Everything for studying together"
        detail="Keep the notes, the reading and the discussion in one place, with the people you study with."
        layout="center"
      />
      <HStack gap={4} className="flex-col items-stretch! lg:flex-row">
        <WhyCard
          Icon={PenTool}
          title="Notes you write together"
          detail="One document, live cursors and every version kept."
        >
          <NotesFragment isBrief />
        </WhyCard>
        <VStack
          as="article"
          data-reveal=""
          className={`landing-photo min-h-96 min-w-0 overflow-hidden rounded-3xl lg:flex-1 ${REVEAL}`}
        >
          <VStack gap={2} className="p-6">
            <DoorOpen size={22} aria-hidden="true" className="text-accent" />
            <Heading level={3} className="landing-h3">
              Rooms for your whole group
            </Heading>
            <Text as="p" color="secondary">
              Add classmates by email. Keep a room private, or open it up.
            </Text>
          </VStack>
          <VStack className="relative mt-auto h-64">
            <Image
              src={STUDENTS}
              alt="Two students looking up from their notebooks."
              fill
              sizes="(max-width: 640px) 100vw, 380px"
              className={`landing-crop-b ${PHOTO}`}
            />
          </VStack>
        </VStack>
        <WhyCard
          Icon={RefreshCw}
          title="Keep writing offline"
          detail="Edits wait on your device and merge when you’re back. Try it."
        >
          <OfflineDemo />
        </WhyCard>
      </HStack>
    </LandingSection>
  );
}

const MORE_TOOLS = [
  {
    Icon: Split,
    title: "Breakout rooms",
    detail: "Split off a few people to work one question through.",
  },
  {
    Icon: Presentation,
    title: "Presenter mode",
    detail: "Lead with a laser pointer while your group follows.",
  },
  {
    Icon: History,
    title: "Version history",
    detail: "Name a snapshot of your notes and restore it later.",
  },
  {
    Icon: Bookmark,
    title: "Saved guides",
    detail: "Keep a study pack and reopen it when you review.",
  },
];

/** A tall card whose preview runs off the bottom edge, like a cropped screen. */
function FeatureCard({
  Icon,
  title,
  detail,
  children,
}: CardProps): React.ReactElement {
  return (
    <VStack
      as="article"
      data-reveal=""
      gap={8}
      className={`min-w-0 overflow-hidden rounded-3xl bg-muted px-6 pt-6 md:px-8 md:pt-8 lg:w-1/2 ${REVEAL}`}
    >
      <VStack gap={3}>
        <VStack
          hAlign="center"
          className="size-11 justify-center rounded-full bg-surface"
        >
          <Icon size={20} aria-hidden="true" className="text-accent" />
        </VStack>
        <Heading level={3} className="landing-subtitle">
          {title}
        </Heading>
        <Text as="p" color="secondary" className="landing-body max-w-md">
          {detail}
        </Text>
      </VStack>
      <VStack className="landing-float mx-auto mt-auto w-full max-w-sm overflow-hidden rounded-t-3xl bg-surface">
        {children}
      </VStack>
    </VStack>
  );
}

export function LandingTools(): React.ReactElement {
  return (
    <LandingSection id="workspace" labelledBy="workspace-title">
      <SectionHead
        id="workspace-title"
        Icon={Layers3}
        label="Study tools"
        title="Everything you need to run a study session"
        detail="The reading, the diagram and the side conversations stay in the room, next to your notes."
      />
      <HStack gap={4} className="flex-col items-stretch! lg:flex-row">
        <FeatureCard
          Icon={Highlighter}
          title="PDFs you mark up"
          detail="Highlights, sticky notes and comments on one shared copy."
        >
          <PdfFragment />
        </FeatureCard>
        <FeatureCard
          Icon={Presentation}
          title="A whiteboard for the hard parts"
          detail="Draw the connections, then walk everyone through them."
        >
          <WhiteboardFragment />
        </FeatureCard>
      </HStack>
      <Grid columns={{ minWidth: 250, max: 4 }} gap={4}>
        {MORE_TOOLS.map(({ Icon, title, detail }) => (
          <VStack
            key={title}
            data-reveal=""
            gap={3}
            className={`rounded-3xl bg-muted p-6 ${REVEAL}`}
          >
            <Icon size={20} aria-hidden="true" className="text-accent" />
            <VStack gap={1}>
              <Text weight="semibold" className="text-base!">
                {title}
              </Text>
              <Text as="p" color="secondary">
                {detail}
              </Text>
            </VStack>
          </VStack>
        ))}
      </Grid>
    </LandingSection>
  );
}

export function LandingSession(): React.ReactElement {
  return (
    <LandingSection id="how" labelledBy="how-title">
      <SectionHead
        id="how-title"
        Icon={Route}
        label="How it works"
        title="A study session, start to finish"
        detail="Four steps from an empty room to a review you can reopen before the exam."
      />
      <VStack data-reveal="" className={REVEAL}>
        <SessionSteps />
      </VStack>
    </LandingSection>
  );
}

const PACK_PARTS = [
  {
    title: "A summary to read first",
    detail: "The key points of your room’s notes, in one short read.",
    preview: (
      <VStack className="rounded-2xl bg-surface">
        <SummaryFragment />
      </VStack>
    ),
  },
  {
    title: "A quiz to test yourself",
    detail: "Questions drawn from the same notes, so you find the gaps early.",
    preview: (
      <VStack className="rounded-2xl bg-surface">
        <QuizFragment />
      </VStack>
    ),
  },
  {
    title: "Flashcards for the last pass",
    detail: "Flip through them alone or with your group. Try the sample card.",
    preview: <FlashcardDemo />,
  },
];

export function LandingPacks(): React.ReactElement {
  return (
    <LandingSection labelledBy="packs-title">
      <SectionHead
        id="packs-title"
        Icon={BrainCircuit}
        label="Study packs"
        title="Turn your notes into a review"
        detail="A pack is generated from a snapshot of the room’s notes. Treat it as a starting point and check it against your sources."
      />
      <VStack gap={4}>
        {PACK_PARTS.map(({ title, detail, preview }) => (
          <HStack
            as="article"
            key={title}
            data-reveal=""
            gap={2}
            className={`flex-col items-stretch! rounded-3xl bg-muted p-3 md:flex-row md:items-center! ${REVEAL}`}
          >
            <VStack className="min-w-0 shrink-0 rounded-2xl bg-accent-muted p-3 md:w-96">
              {preview}
            </VStack>
            <VStack gap={3} className="min-w-0 p-3 md:p-8">
              <Heading level={3} className="landing-subtitle">
                {title}
              </Heading>
              <Text as="p" color="secondary" className="landing-body max-w-md">
                {detail}
              </Text>
            </VStack>
          </HStack>
        ))}
      </VStack>
    </LandingSection>
  );
}

const ROLES = [
  {
    name: "Viewer",
    Icon: Eye,
    summary: "Follows along and reviews.",
    abilities: [
      "Read the notes, PDF and whiteboard",
      "Read the version history",
      "Generate a study pack from the notes",
    ],
    verb: "Read",
    scope: "Notes, PDF, whiteboard and history",
    isFeatured: false,
  },
  {
    name: "Editor",
    Icon: Pencil,
    summary: "Works in the room with you.",
    abilities: [
      "Everything a viewer can do",
      "Write notes and restore versions",
      "Upload, annotate and comment on the PDF",
      "Draw on the whiteboard",
    ],
    verb: "Write",
    scope: "Notes, PDF comments and whiteboard",
    isFeatured: true,
  },
  {
    name: "Owner",
    Icon: Crown,
    summary: "Runs the room they created.",
    abilities: [
      "Everything an editor can do",
      "Add members and change roles",
      "Change room settings",
    ],
    verb: "Manage",
    scope: "Members, roles and room settings",
    isFeatured: false,
  },
];

export function LandingRoles(): React.ReactElement {
  return (
    <LandingSection id="roles" labelledBy="roles-title" className="bg-muted">
      <SectionHead
        id="roles-title"
        Icon={ShieldCheck}
        label="Roles"
        title="A clear role for every member"
        detail="The owner decides who can write and who follows along, person by person."
      />
      <HStack gap={4} className="flex-col items-stretch! lg:flex-row">
        {ROLES.map(
          ({ name, Icon, summary, abilities, verb, scope, isFeatured }) => {
            const ink = isFeatured ? "text-surface!" : "";

            return (
              <VStack
                as="article"
                key={name}
                data-reveal=""
                gap={8}
                className={`min-w-0 rounded-3xl p-6 lg:flex-1 ${
                  isFeatured ? "bg-inverted" : "bg-surface"
                } ${REVEAL}`}
              >
                <HStack gap={3} vAlign="center">
                  <VStack
                    hAlign="center"
                    className={`size-10 shrink-0 justify-center rounded-xl ${
                      isFeatured ? "bg-surface" : "bg-accent-muted"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                  </VStack>
                  <VStack gap={0} className="min-w-0">
                    <Heading level={3} className={`landing-h3 ${ink}`}>
                      {name}
                    </Heading>
                    <Text color="secondary" className={ink}>
                      {summary}
                    </Text>
                  </VStack>
                </HStack>
                <VStack gap={2}>
                  <Text weight="semibold" className={ink}>
                    What they can do
                  </Text>
                  {abilities.map((ability) => (
                    <HStack key={ability} gap={2} vAlign="start">
                      <Check
                        size={16}
                        aria-hidden="true"
                        className={`mt-0.5 shrink-0 ${
                          isFeatured ? "text-surface" : "text-accent"
                        }`}
                      />
                      <Text className={ink}>{ability}</Text>
                    </HStack>
                  ))}
                </VStack>
                <VStack gap={1} className="mt-auto">
                  <Text className={`landing-title ${ink}`}>{verb}</Text>
                  <Text color="secondary" className={ink}>
                    {scope}
                  </Text>
                </VStack>
              </VStack>
            );
          },
        )}
      </HStack>
    </LandingSection>
  );
}

const QUESTIONS = [
  {
    question: "How do I start a study room?",
    answer:
      "Create an account, then create a room named after your subject. Choose public or private, then add classmates who have an account by their email.",
  },
  {
    question: "Who can see what’s in my room?",
    answer:
      "Private rooms are for their members. Public rooms can be found and joined. PDFs sit in private storage and members open them through short-lived links.",
  },
  {
    question: "What happens if my connection drops?",
    answer:
      "Once a room has loaded, you can keep editing. Your changes are stored on your device and merge when you reconnect. If someone edited the same note, Qollab shows you both versions to review.",
  },
  {
    question: "What does a study pack use?",
    answer:
      "It uses a snapshot of the room’s notes, not the PDF or whiteboard. Each pack has a summary, a quiz, flashcards, recommendations and a misconception review.",
  },
  {
    question: "Can I rely on the generated material?",
    answer:
      "Treat it as a study aid, not as an authority or as medical advice. Always check it against your own sources.",
  },
  {
    question: "What can I upload?",
    answer:
      "Each room holds one active PDF of up to 15 MiB, which owners and editors can replace. You can also add images to the whiteboard.",
  },
];

export function LandingFaq({
  destination,
  action,
}: LandingAction): React.ReactElement {
  return (
    <LandingSection id="faq" labelledBy="faq-title">
      <HStack gap={10} className="flex-col items-stretch! lg:flex-row">
        <VStack gap={8} className="min-w-0 lg:w-5/12">
          <SectionHead
            id="faq-title"
            Icon={MessageCircleQuestion}
            label="FAQ"
            title="Frequently asked questions"
            detail="Short answers on rooms, privacy, offline work and study packs."
            layout="stack"
          />
          <VStack
            gap={4}
            hAlign="start"
            className="mt-auto rounded-3xl bg-muted p-6"
          >
            <VStack gap={1}>
              <Text weight="semibold" className="text-base!">
                Ready to try it?
              </Text>
              <Text as="p" color="secondary">
                Open a room and bring your group in.
              </Text>
            </VStack>
            <PillLink href={destination} label={action} />
          </VStack>
        </VStack>
        <VStack className="min-w-0 lg:w-7/12">
          <FaqList questions={QUESTIONS} />
        </VStack>
      </HStack>
    </LandingSection>
  );
}

export function LandingClosing({
  destination,
  action,
}: LandingAction): React.ReactElement {
  return (
    <VStack
      as="section"
      aria-labelledby="start-title"
      hAlign="center"
      className="px-4 pb-14 md:px-8 lg:pb-20"
    >
      <HStack
        width="100%"
        maxWidth={FRAME}
        gap={6}
        className="landing-photo flex-col items-stretch! overflow-hidden rounded-3xl p-6 md:p-10 lg:flex-row lg:items-center!"
      >
        <VStack gap={6} hAlign="start" className="min-w-0 lg:w-5/12">
          <Heading
            level={2}
            id="start-title"
            textWrap="balance"
            className="landing-title"
          >
            Make room for your next study session.
          </Heading>
          <PillLink href={destination} label={action} />
        </VStack>
        <Image
          src={STUDENTS}
          alt="Five students with laptops and notebooks, surrounded by study notes and tool icons."
          width={1942}
          height={809}
          sizes="(max-width: 1024px) 100vw, 620px"
          className="h-auto w-full min-w-0 brightness-105 contrast-105 mix-blend-multiply lg:w-7/12"
        />
      </HStack>
    </VStack>
  );
}

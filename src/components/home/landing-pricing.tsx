import { Heading } from "@astryxdesign/core/Heading";
import { HStack } from "@astryxdesign/core/HStack";
import { proportional, Table } from "@astryxdesign/core/Table";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";

import {
  LandingSection,
  PillLink,
  REVEAL,
  SectionHead,
} from "./landing-section";
import { BadgeCheck, Check } from "@/components/ui/icons";

// Source: artifacts/qollab-pricing-model.pdf (25 Nov 2026). AI quotas are capped
// so every plan keeps a margin at full use; free AI is a one-time trial.
// Live participants show 100, not the PDF's 200, until a load test proves more.
const TIERS = [
  {
    name: "Free",
    price: "₱0",
    period: "to try it",
    audience: "For trying Qollab with a small group.",
    includes: [
      "2 rooms",
      "Up to 30 people in a live activity",
      "2 study packs and 3 whiteboard answers to try",
    ],
    isFeatured: false,
  },
  {
    name: "Plus",
    price: "₱199",
    period: "a month",
    audience: "For someone who runs a study group.",
    includes: [
      "10 rooms",
      "Up to 50 people in a live activity",
      "12 study packs and 30 whiteboard answers a month",
    ],
    isFeatured: false,
  },
  {
    name: "Host",
    price: "₱499",
    period: "a month",
    audience: "For teachers, tutors and trainers.",
    includes: [
      "30 rooms",
      "Up to 100 people in a live activity",
      "30 study packs and 80 whiteboard answers a month",
      "Export live results to Excel",
    ],
    isFeatured: true,
  },
  {
    name: "School",
    price: "₱24,900",
    period: "a year, for 10 hosts",
    audience: "For a school, department or training team.",
    includes: [
      "Host features for 10 hosts",
      "30 rooms per host",
      "200 study packs and 500 whiteboard answers a month, shared",
    ],
    isFeatured: false,
  },
];

interface PlanRow extends Record<string, unknown> {
  feature: string;
  free: string;
  plus: string;
  host: string;
  school: string;
}

const PLAN_ROWS: PlanRow[] = [
  {
    feature: "Monthly",
    free: "₱0",
    plus: "₱199",
    host: "₱499",
    school: "Not offered",
  },
  {
    feature: "5-month pass",
    free: "Not offered",
    plus: "₱799",
    host: "₱1,990",
    school: "Not offered",
  },
  {
    feature: "Yearly",
    free: "Not offered",
    plus: "₱1,490",
    host: "₱3,990",
    school: "₱24,900",
  },
  {
    feature: "Study packs",
    free: "2, once",
    plus: "12 a month",
    host: "30 a month",
    school: "200 a month, shared",
  },
  {
    feature: "Whiteboard answers",
    free: "3, once",
    plus: "30 a month",
    host: "80 a month",
    school: "500 a month, shared",
  },
  {
    feature: "Rooms",
    free: "2",
    plus: "10",
    host: "30",
    school: "30 per host",
  },
  {
    feature: "Live participants",
    free: "30",
    plus: "50",
    host: "100",
    school: "100",
  },
  {
    feature: "Invited members",
    free: "Join free",
    plus: "Join free",
    host: "Join free",
    school: "Join free",
  },
  {
    feature: "Excel export",
    free: "No",
    plus: "No",
    host: "Yes",
    school: "Yes",
  },
];

const PLAN_COLUMNS = [
  { key: "feature", header: "Plan", width: proportional(1.4) },
  { key: "free", header: "Free", width: proportional(1) },
  { key: "plus", header: "Plus", width: proportional(1) },
  { key: "host", header: "Host", width: proportional(1) },
  { key: "school", header: "School", width: proportional(1.2) },
];

interface LandingPricingProps {
  destination: string;
}

export function LandingPricing({
  destination,
}: LandingPricingProps): React.ReactElement {
  return (
    <LandingSection id="pricing" labelledBy="pricing-title">
      <SectionHead
        id="pricing-title"
        Icon={BadgeCheck}
        label="Pricing"
        title="The host pays. Everyone they invite joins free."
        detail="Start free. When paid plans open, choose monthly, a 5-month pass for a school term, or a year."
      />
      <HStack gap={4} className="flex-col items-stretch! lg:flex-row">
        {TIERS.map(
          ({ name, price, period, audience, includes, isFeatured }) => {
            const ink = isFeatured ? "text-surface!" : "";

            return (
              <VStack
                as="article"
                key={name}
                data-reveal=""
                gap={6}
                className={`min-w-0 rounded-3xl p-6 lg:flex-1 ${
                  isFeatured ? "bg-inverted" : "bg-muted"
                } ${REVEAL}`}
              >
                <VStack gap={2}>
                  <Heading level={3} className={`landing-h3 ${ink}`}>
                    {name}
                  </Heading>
                  <HStack gap={2} vAlign="end" wrap="wrap">
                    <Text className={`landing-title ${ink}`}>{price}</Text>
                    <Text color="secondary" className={ink}>
                      {period}
                    </Text>
                  </HStack>
                  <Text as="p" color="secondary" className={ink}>
                    {audience}
                  </Text>
                </VStack>
                <VStack gap={2}>
                  {includes.map((item) => (
                    <HStack key={item} gap={2} vAlign="start">
                      <Check
                        size={16}
                        aria-hidden="true"
                        className={`mt-0.5 shrink-0 ${
                          isFeatured ? "text-surface" : "text-accent"
                        }`}
                      />
                      <Text className={ink}>{item}</Text>
                    </HStack>
                  ))}
                </VStack>
                <VStack gap={0} hAlign="start" className="mt-auto">
                  {name === "Free" ? (
                    <PillLink href={destination} label="Start free" />
                  ) : (
                    <Text weight="medium" color="secondary" className={ink}>
                      Opening soon
                    </Text>
                  )}
                </VStack>
              </VStack>
            );
          },
        )}
      </HStack>
      <VStack gap={3} data-reveal="" className={REVEAL}>
        <Heading level={3} className="landing-subtitle">
          Compare plans
        </Heading>
        <Table
          data={PLAN_ROWS}
          columns={PLAN_COLUMNS}
          idKey="feature"
          density="balanced"
        />
        <Text as="p" color="secondary">
          Prices are in Philippine pesos. Study packs and whiteboard answers
          reset each month on paid plans. On Free they are a one-time trial.
        </Text>
      </VStack>
    </LandingSection>
  );
}

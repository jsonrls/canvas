import {
  LIVE_KIND_LABELS,
  SCALE_MAX,
  scaleStatements,
  summarizeResults,
  type LiveQuestion,
  type LiveResponseValue,
  type QaItem,
} from "@/lib/live/activities";
import type { Sheet, SheetRow } from "@/lib/xlsx";

type Cells = SheetRow["cells"];

const heading = (...cells: Cells): SheetRow => ({ cells, isHeading: true });
const row = (...cells: Cells): SheetRow => ({ cells });
const BLANK = row();

function summaryRows(
  question: LiveQuestion,
  values: LiveResponseValue[],
): SheetRow[] {
  const { options, settings } = question;
  const results = summarizeResults(question, values);
  switch (results.type) {
    case "choice":
      return [
        heading("Option", "Votes", question.kind === "quiz" ? "Correct" : ""),
        ...options.map((option, index) =>
          row(
            option,
            results.counts[index],
            question.correctOption === index ? "Correct" : "",
          ),
        ),
      ];
    case "words":
      return [
        heading("Word", "Times sent"),
        ...results.words.map((word) => row(word.text, word.count)),
      ];
    case "scale":
      return [
        heading(
          "Statement",
          "Average",
          ...Array.from({ length: SCALE_MAX }, (_, i) => `Rated ${i + 1}`),
        ),
        ...results.rows.map((scale) =>
          row(scale.label ?? question.prompt, scale.average, ...scale.counts),
        ),
      ];
    case "ranking":
      return [
        heading("Item", "Average position"),
        ...results.rows.map((rank) => row(options[rank.option], rank.average)),
      ];
    case "points":
      return [
        heading("Item", "Average points"),
        ...options.map((option, index) => row(option, results.averages[index])),
      ];
    case "grid":
      return [
        heading("Item", settings.xLabel ?? "", settings.yLabel ?? ""),
        ...options.map((option, index) =>
          row(option, results.averages[index].x, results.averages[index].y),
        ),
      ];
    case "number":
      return [
        row("Correct number", settings.answer ?? null),
        row("Average guess", results.average),
        row("Exact guesses", results.exact),
        BLANK,
        heading("Range", "Guesses"),
        ...results.buckets.map(({ count, from, to }) =>
          row(from === to ? String(from) : `${from} to ${to}`, count),
        ),
      ];
    case "pin":
      return results.inArea === null
        ? []
        : [row("Pins in the correct area", results.inArea)];
    case "texts":
    case "form":
      // Nothing to add up; the answers below are the result.
      return [];
  }
}

function answerHeading({
  kind,
  options,
  prompt,
  settings,
}: LiveQuestion): string[] {
  switch (kind) {
    case "scale":
      return options.length > 0 ? options : [prompt];
    case "ranking":
      return options.map((_, index) => `Position ${index + 1}`);
    case "points":
    case "form":
      return options;
    case "grid":
      return options.flatMap((option) => [
        `${option}: ${settings.xLabel}`,
        `${option}: ${settings.yLabel}`,
      ]);
    case "word_cloud":
      return ["Words"];
    case "pin":
      return ["From left (%)", "From top (%)"];
    default:
      return ["Answer"];
  }
}

function answerCells(question: LiveQuestion, value: LiveResponseValue): Cells {
  const { options } = question;
  if ("option" in value) return [options[value.option] ?? ""];
  if ("words" in value) return [value.words.join(", ")];
  if ("text" in value) return [value.text];
  if ("rating" in value) return [value.rating];
  if ("ratings" in value) {
    return scaleStatements(question).map((_, i) => value.ratings[i] ?? null);
  }
  if ("order" in value) {
    return value.order.map((option) => options[option] ?? "");
  }
  if ("points" in value) return value.points;
  if ("positions" in value)
    return value.positions.flatMap(({ x, y }) => [x, y]);
  if ("number" in value) return [value.number];
  if ("fields" in value) return value.fields;
  return [value.pin.x, value.pin.y];
}

/** Sorted, so row order cannot match one person's answers across sheets. */
function answerRows(
  question: LiveQuestion,
  values: LiveResponseValue[],
): SheetRow[] {
  return values
    .map((value) => row(...answerCells(question, value)))
    .sort((a, b) =>
      a.cells
        .join("\n")
        .localeCompare(b.cells.join("\n"), undefined, { numeric: true }),
    );
}

const QA_STATUS_LABELS: Record<QaItem["status"], string> = {
  visible: "Open",
  pending: "Waiting for approval",
  answered: "Answered",
  hidden: "Hidden",
};

/** A workbook of every question in a room. Answers carry no names. */
export function buildResultSheets({
  leaderboard,
  qa,
  questions,
  responses,
}: {
  leaderboard: { rank: number; name: string; points: number }[];
  qa: Map<string, QaItem[]>;
  questions: LiveQuestion[];
  responses: Map<string, LiveResponseValue[]>;
}): Sheet[] {
  const sheets: Sheet[] = [
    {
      name: "Summary",
      rows: [
        heading("Number", "Type", "Question", "Responses"),
        ...questions.map((question, index) =>
          row(
            index + 1,
            LIVE_KIND_LABELS[question.kind],
            question.prompt,
            question.kind === "qa"
              ? (qa.get(question.id) ?? []).length
              : (responses.get(question.id) ?? []).length,
          ),
        ),
      ],
    },
  ];
  if (leaderboard.length > 0) {
    sheets.push({
      name: "Leaderboard",
      rows: [
        heading("Rank", "Name", "Points"),
        ...leaderboard.map(({ name, points, rank }) => row(rank, name, points)),
      ],
    });
  }
  questions.forEach((question, index) => {
    const label = LIVE_KIND_LABELS[question.kind];
    const values = responses.get(question.id) ?? [];
    const summary = summaryRows(question, values);
    sheets.push({
      name: `${index + 1}. ${label}`,
      rows: [
        heading(question.prompt),
        BLANK,
        ...(question.kind === "qa"
          ? [
              heading("Question", "Votes", "Status"),
              ...(qa.get(question.id) ?? []).map((item) =>
                row(item.body, item.votes, QA_STATUS_LABELS[item.status]),
              ),
            ]
          : [
              ...summary,
              ...(summary.length > 0 ? [BLANK, heading("All answers")] : []),
              heading(...answerHeading(question)),
              ...answerRows(question, values),
            ]),
      ],
    });
  });
  return sheets;
}

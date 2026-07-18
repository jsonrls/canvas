import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  readStudyPack,
  type StudyPack,
  type StudyPackResponse,
} from "@/lib/ai/study-pack";

export const MAX_SAVED_STUDY_GUIDES = 50;
export const MAX_SAVED_GUIDE_PAYLOAD_BYTES = 65_536;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const MIN_SOURCE_CHARACTERS = 80;
const MAX_SOURCE_CHARACTERS = 18_000;

export interface SavedStudyGuideMetadata {
  createdAt: string;
  generatedAt: string;
  id: string;
  sourceCharacters: number;
  title: string;
}

export interface SavedStudyGuide extends SavedStudyGuideMetadata {
  studyPack: StudyPack;
}

export interface SavedStudyGuideRow {
  created_at: string;
  created_by: string;
  generated_at: string;
  id: string;
  room_id: string;
  source_characters: number;
  study_pack: unknown;
  title: string;
}

export class SavedStudyGuideInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavedStudyGuideInputError";
  }
}

export class SavedStudyGuideNotFoundError extends Error {
  constructor() {
    super("That saved study guide could not be found.");
    this.name = "SavedStudyGuideNotFoundError";
  }
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): void {
  const actual = Object.keys(value).sort();
  const target = [...expected].sort();

  if (
    actual.length !== target.length ||
    actual.some((key, index) => key !== target[index])
  ) {
    throw new SavedStudyGuideInputError(
      "The saved study-guide request is invalid.",
    );
  }
}

function assertUuid(value: unknown, label: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new SavedStudyGuideInputError(`${label} is invalid.`);
  }

  return value;
}

function readIsoDate(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new SavedStudyGuideInputError(`${label} is invalid.`);
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new SavedStudyGuideInputError(`${label} is invalid.`);
  }

  return parsed.toISOString();
}

function readSourceCharacters(value: unknown): number {
  if (
    !Number.isInteger(value) ||
    (value as number) < MIN_SOURCE_CHARACTERS ||
    (value as number) > MAX_SOURCE_CHARACTERS
  ) {
    throw new SavedStudyGuideInputError("The source size is invalid.");
  }

  return value as number;
}

function serializedPayloadBytes(studyPack: StudyPack): number {
  return new TextEncoder().encode(JSON.stringify(studyPack)).byteLength;
}

function assertPayloadSize(studyPack: StudyPack): void {
  if (serializedPayloadBytes(studyPack) > MAX_SAVED_GUIDE_PAYLOAD_BYTES) {
    throw new SavedStudyGuideInputError("The saved study guide is too large.");
  }
}

export function readSavedStudyGuideRequest(value: unknown): StudyPackResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SavedStudyGuideInputError(
      "The saved study-guide request is invalid.",
    );
  }

  const body = value as Record<string, unknown>;
  assertExactKeys(body, ["generatedAt", "sourceCharacters", "studyPack"]);
  const generatedAt = readIsoDate(body.generatedAt, "The generation time");
  const sourceCharacters = readSourceCharacters(body.sourceCharacters);
  const studyPack = readStudyPack(body.studyPack);

  assertPayloadSize(studyPack);

  return { generatedAt, sourceCharacters, studyPack };
}

export function readGuideId(value: string | null): string {
  return assertUuid(value, "The saved study-guide id");
}

export function mapSavedStudyGuideMetadata(
  row: Pick<
    SavedStudyGuideRow,
    "created_at" | "generated_at" | "id" | "source_characters" | "title"
  >,
): SavedStudyGuideMetadata {
  return {
    createdAt: readIsoDate(row.created_at, "The saved time"),
    generatedAt: readIsoDate(row.generated_at, "The generation time"),
    id: assertUuid(row.id, "The saved study-guide id"),
    sourceCharacters: readSourceCharacters(row.source_characters),
    title: row.title,
  };
}

export function mapSavedStudyGuide(row: SavedStudyGuideRow): SavedStudyGuide {
  const studyPack = readStudyPack(row.study_pack);
  assertPayloadSize(studyPack);

  return {
    ...mapSavedStudyGuideMetadata(row),
    studyPack,
  };
}

export async function readSavedGuideRow(
  client: SupabaseClient,
  roomId: string,
  userId: string,
  guideId: string,
): Promise<SavedStudyGuideRow> {
  const { data, error } = await client
    .from("saved_study_guides")
    .select(
      "id, room_id, created_by, title, study_pack, generated_at, source_characters, created_at",
    )
    .eq("id", guideId)
    .eq("room_id", roomId)
    .eq("created_by", userId)
    .maybeSingle();

  if (error || !data) throw new SavedStudyGuideNotFoundError();
  return data as SavedStudyGuideRow;
}

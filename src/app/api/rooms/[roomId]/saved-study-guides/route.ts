import { NextResponse } from "next/server";

import {
  mapSavedStudyGuide,
  mapSavedStudyGuideMetadata,
  MAX_SAVED_STUDY_GUIDES,
  readGuideId,
  readSavedGuideRow,
  readSavedStudyGuideRequest,
  SavedStudyGuideInputError,
  SavedStudyGuideNotFoundError,
} from "@/lib/ai/saved-study-guides";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

interface SavedGuidesRouteProps {
  params: Promise<{ roomId: string }>;
}

const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { headers: PRIVATE_HEADERS, status },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new SavedStudyGuideInputError(
      "The saved study-guide request is invalid.",
    );
  }
}

export async function GET(
  request: Request,
  { params }: SavedGuidesRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) return jsonError("Authentication required.", 401);

  try {
    const { roomId } = await params;
    const access = await getRoomMemberAccess(
      context.client,
      roomId,
      context.userId,
    );
    const guideId = new URL(request.url).searchParams.get("guideId");

    if (guideId !== null) {
      const row = await readSavedGuideRow(
        context.client,
        access.id,
        context.userId,
        readGuideId(guideId),
      );
      return NextResponse.json(
        { guide: mapSavedStudyGuide(row) },
        { headers: PRIVATE_HEADERS },
      );
    }

    const { data, error } = await context.client
      .from("saved_study_guides")
      .select("id, title, generated_at, source_characters, created_at")
      .eq("room_id", access.id)
      .eq("created_by", context.userId)
      .order("created_at", { ascending: false })
      .limit(MAX_SAVED_STUDY_GUIDES);

    if (error) throw new Error("SAVED_GUIDES_LIST_FAILED");

    return NextResponse.json(
      {
        guides: (data ?? []).map((row) =>
          mapSavedStudyGuideMetadata(row as never),
        ),
      },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (error instanceof SavedStudyGuideInputError) {
      return jsonError(error.message, 400);
    }
    if (
      error instanceof RoomDomainError ||
      error instanceof SavedStudyGuideNotFoundError
    ) {
      return jsonError("The saved study guide could not be found.", 404);
    }
    return jsonError("Saved study guides are temporarily unavailable.", 502);
  }
}

export async function POST(
  request: Request,
  { params }: SavedGuidesRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) return jsonError("Authentication required.", 401);

  try {
    const { roomId } = await params;
    const [access, body] = await Promise.all([
      getRoomMemberAccess(context.client, roomId, context.userId),
      readJson(request),
    ]);
    const payload = readSavedStudyGuideRequest(body);
    const { count, error: countError } = await context.client
      .from("saved_study_guides")
      .select("id", { count: "exact", head: true })
      .eq("room_id", access.id)
      .eq("created_by", context.userId);

    if (countError) throw new Error("SAVED_GUIDES_COUNT_FAILED");
    if ((count ?? 0) >= MAX_SAVED_STUDY_GUIDES) {
      return jsonError(
        "You have reached the 50-guide limit for this room. Delete an older guide before saving another.",
        409,
      );
    }

    const { data, error } = await context.client
      .from("saved_study_guides")
      .insert({
        created_by: context.userId,
        generated_at: payload.generatedAt,
        room_id: access.id,
        source_characters: payload.sourceCharacters,
        study_pack: payload.studyPack,
        title: payload.studyPack.summary.title,
      })
      .select(
        "id, title, generated_at, source_characters, created_at, study_pack, room_id, created_by",
      )
      .single();

    if (error || !data) {
      if (error?.code === "23505" || error?.code === "P0001") {
        return jsonError(
          "The guide could not be saved because the room limit was reached. Delete an older guide and try again.",
          409,
        );
      }
      throw new Error("SAVED_GUIDE_SAVE_FAILED");
    }

    return NextResponse.json(
      { guide: mapSavedStudyGuide(data as never) },
      { headers: PRIVATE_HEADERS, status: 201 },
    );
  } catch (error) {
    if (error instanceof SavedStudyGuideInputError) {
      return jsonError(error.message, 400);
    }
    if (error instanceof RoomDomainError) {
      return jsonError("The room could not be found.", 404);
    }
    return jsonError("The study guide could not be saved.", 502);
  }
}

export async function DELETE(
  request: Request,
  { params }: SavedGuidesRouteProps,
): Promise<NextResponse> {
  const context = await getAuthenticatedContext();

  if (!context) return jsonError("Authentication required.", 401);

  try {
    const { roomId } = await params;
    const guideId = readGuideId(
      new URL(request.url).searchParams.get("guideId"),
    );
    const access = await getRoomMemberAccess(
      context.client,
      roomId,
      context.userId,
    );
    const { data, error } = await context.client
      .from("saved_study_guides")
      .delete()
      .eq("id", guideId)
      .eq("room_id", access.id)
      .eq("created_by", context.userId)
      .select("id")
      .maybeSingle();

    if (error || !data) throw new SavedStudyGuideNotFoundError();
    return NextResponse.json(
      { deleted: true, id: guideId },
      { headers: PRIVATE_HEADERS },
    );
  } catch (error) {
    if (error instanceof SavedStudyGuideInputError) {
      return jsonError(error.message, 400);
    }
    if (
      error instanceof RoomDomainError ||
      error instanceof SavedStudyGuideNotFoundError
    ) {
      return jsonError("The saved study guide could not be found.", 404);
    }
    return jsonError("The study guide could not be deleted.", 502);
  }
}

import { NextResponse } from "next/server";

import {
  isQaStatus,
  LiveInputError,
  MAX_LIVE_QUESTIONS,
  readQuestionDraft,
} from "@/lib/live/activities";
import {
  jsonError,
  LiveForbiddenError,
  liveErrorResponse,
  loadLiveAccess,
  type LiveRouteProps,
  PRIVATE_HEADERS,
  readLiveId,
} from "@/lib/live/http";
import {
  askLiveQuestion,
  buildLiveSnapshot,
  createLiveQuestion,
  deleteLiveQuestion,
  presentLiveQuestion,
  reorderLiveQuestions,
  resetLiveResults,
  setLiveAccepting,
  setLiveGuestAccess,
  setLiveLayout,
  setLiveQaStatus,
  setLiveResultsVisible,
  submitLiveResponse,
  voteLiveQuestion,
} from "@/lib/live/repository";
import { createServiceRoleClient } from "@/lib/supabase/server";

const HOST_ACTIONS = new Set([
  "create_question",
  "delete_question",
  "reorder_questions",
  "present",
  "set_accepting",
  "set_results",
  "reset_results",
  "set_layout",
  "qa_set_status",
  "set_guest_access",
]);

const MAX_BODY_BYTES = 3 * 1024 * 1024;

function readBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new LiveInputError("The live activity request is invalid.");
  }
  return value;
}

function readIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_LIVE_QUESTIONS) {
    throw new LiveInputError("The live activity request is invalid.");
  }
  return value.map(readLiveId);
}

function asBody(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new LiveInputError("The live activity request is invalid.");
}

/** JSON, or a form with the same JSON in `payload` plus one `image`. */
async function readBody(
  request: Request,
): Promise<{ body: Record<string, unknown>; image: File | null }> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    throw new LiveInputError("Add a JPEG image smaller than 2 MB.");
  }
  const isForm = request.headers
    .get("content-type")
    ?.startsWith("multipart/form-data");
  try {
    if (!isForm) return { body: asBody(await request.json()), image: null };
    const form = await request.formData();
    const image = form.get("image");
    return {
      body: asBody(JSON.parse(String(form.get("payload")))),
      image: image instanceof File ? image : null,
    };
  } catch {
    throw new LiveInputError("The live activity request is invalid.");
  }
}

export async function GET(
  _request: Request,
  { params }: LiveRouteProps,
): Promise<NextResponse> {
  try {
    const access = await loadLiveAccess(params);
    if (!access) return jsonError("Authentication required.", 401);
    const snapshot = await buildLiveSnapshot(createServiceRoleClient(), access);
    return NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return liveErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: LiveRouteProps,
): Promise<NextResponse> {
  try {
    const access = await loadLiveAccess(params);
    if (!access) return jsonError("Authentication required.", 401);
    const { body, image } = await readBody(request);

    const action = body.action;
    if (typeof action !== "string") {
      throw new LiveInputError("The live activity request is invalid.");
    }
    if (HOST_ACTIONS.has(action) && !access.canHost) {
      throw new LiveForbiddenError();
    }

    const admin = createServiceRoleClient();
    const { scope, userId } = access;

    switch (action) {
      case "create_question":
        await createLiveQuestion(
          admin,
          scope,
          userId,
          readQuestionDraft(body.draft),
          image,
        );
        break;
      case "delete_question":
        await deleteLiveQuestion(admin, scope, readLiveId(body.questionId));
        break;
      case "reorder_questions":
        await reorderLiveQuestions(admin, scope, readIds(body.questionIds));
        break;
      case "present":
        await presentLiveQuestion(
          admin,
          scope,
          body.questionId === null ? null : readLiveId(body.questionId),
        );
        break;
      case "set_accepting":
        await setLiveAccepting(admin, scope, readBoolean(body.value));
        break;
      case "set_results":
        await setLiveResultsVisible(admin, scope, readBoolean(body.value));
        break;
      case "reset_results":
        await resetLiveResults(admin, scope);
        break;
      case "set_layout":
        await setLiveLayout(
          admin,
          scope,
          readLiveId(body.questionId),
          body.layout,
        );
        break;
      case "respond":
        await submitLiveResponse(admin, {
          scope,
          userId,
          questionId: readLiveId(body.questionId),
          value: body.value,
        });
        break;
      case "qa_ask":
        await askLiveQuestion(admin, {
          scope,
          userId,
          questionId: readLiveId(body.questionId),
          text: body.text,
        });
        break;
      case "qa_vote":
        await voteLiveQuestion(admin, {
          scope,
          userId,
          itemId: readLiveId(body.itemId),
          value: readBoolean(body.value),
        });
        break;
      case "set_guest_access":
        await setLiveGuestAccess(admin, scope, readBoolean(body.value));
        break;
      case "qa_set_status":
        if (!isQaStatus(body.status)) {
          throw new LiveInputError("The live activity request is invalid.");
        }
        await setLiveQaStatus(
          admin,
          scope,
          readLiveId(body.itemId),
          body.status,
        );
        break;
      default:
        throw new LiveInputError("The live activity request is invalid.");
    }

    const snapshot = await buildLiveSnapshot(admin, access);
    return NextResponse.json(snapshot, { headers: PRIVATE_HEADERS });
  } catch (error) {
    return liveErrorResponse(error);
  }
}

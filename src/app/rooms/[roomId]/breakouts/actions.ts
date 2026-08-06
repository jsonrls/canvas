"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createBreakoutRoom,
  getBreakoutRoomWorkspace,
  normalizeBreakoutRoomCode,
  normalizeBreakoutRoomName,
} from "@/lib/breakout-rooms/repository";
import { getRoomMemberAccess, RoomDomainError } from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

import type { RoomActionState } from "../../action-state";

function actionError(error: unknown, fallback: string): RoomActionState {
  return {
    message: error instanceof RoomDomainError ? error.message : fallback,
    status: "error",
  };
}

export async function createBreakoutRoomAction(
  parentRoomSlug: string,
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  let code: string;

  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      throw new RoomDomainError("Sign in again to create a breakout room.");
    }

    const access = await getRoomMemberAccess(
      context.client,
      parentRoomSlug,
      context.userId,
    );
    const name = normalizeBreakoutRoomName(formData.get("name"));
    const breakout = await createBreakoutRoom(context.client, access.id, name);
    code = breakout.code;
    revalidatePath(`/rooms/${parentRoomSlug}`);
    revalidatePath(`/rooms/${parentRoomSlug}/breakouts`);
  } catch (error) {
    return actionError(error, "The breakout room could not be created.");
  }

  redirect(`/rooms/${parentRoomSlug}/breakouts/${code}`);
}

export async function openBreakoutRoomAction(
  parentRoomSlug: string,
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  let code: string;

  try {
    const context = await getAuthenticatedContext();

    if (!context) {
      throw new RoomDomainError("Sign in again to open a breakout room.");
    }

    code = normalizeBreakoutRoomCode(formData.get("code"));
    await getBreakoutRoomWorkspace(
      context.client,
      parentRoomSlug,
      code,
      context.userId,
    );
  } catch (error) {
    return actionError(error, "That breakout room could not be opened.");
  }

  redirect(`/rooms/${parentRoomSlug}/breakouts/${code}`);
}

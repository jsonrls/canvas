"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  addRoomMember,
  changeRoomMemberRole,
  createRoom,
  deleteRoom,
  getRoomSettings,
  joinPublicRoom,
  leaveRoom,
  normalizeAssignableRole,
  normalizeMemberEmail,
  normalizeRoomName,
  removeRoomMember,
  RoomDomainError,
  updateRoom,
} from "@/lib/rooms/repository";
import { getAuthenticatedContext } from "@/lib/supabase/server";

export interface RoomActionState {
  message: string;
  status: "idle" | "error" | "success";
}

export const INITIAL_ROOM_ACTION_STATE: RoomActionState = {
  message: "",
  status: "idle",
};

function readVisibility(formData: FormData): boolean {
  const visibility = formData.get("visibility");

  if (visibility === "public") return true;
  if (visibility === "private") return false;
  throw new RoomDomainError("Choose whether this room is private or public.");
}

function actionError(error: unknown, fallback: string): RoomActionState {
  return {
    message: error instanceof RoomDomainError ? error.message : fallback,
    status: "error",
  };
}

async function requireContext() {
  const context = await getAuthenticatedContext();

  if (!context) {
    throw new RoomDomainError("Sign in again to manage study rooms.");
  }

  return context;
}

function revalidateRoomPaths(roomSlug: string): void {
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${roomSlug}`);
  revalidatePath(`/rooms/${roomSlug}/settings`);
}

export async function createRoomAction(
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  let roomSlug: string;

  try {
    const context = await requireContext();
    const name = normalizeRoomName(formData.get("name"));
    const isPublic = readVisibility(formData);
    const room = await createRoom(context.client, name, isPublic);
    roomSlug = room.slug;
    revalidateRoomPaths(roomSlug);
  } catch (error) {
    return actionError(error, "The room could not be created. Try again.");
  }

  redirect(`/rooms/${roomSlug}`);
}

export async function joinRoomAction(
  roomSlug: string,
  _state: RoomActionState,
  _formData: FormData,
): Promise<RoomActionState> {
  void _state;
  void _formData;

  try {
    const context = await requireContext();
    await joinPublicRoom(context.client, roomSlug, context.userId);
    revalidateRoomPaths(roomSlug);
  } catch (error) {
    return actionError(error, "You could not join that room.");
  }

  redirect(`/rooms/${roomSlug}`);
}

export async function leaveRoomAction(
  roomSlug: string,
  _state: RoomActionState,
  _formData: FormData,
): Promise<RoomActionState> {
  void _state;
  void _formData;

  try {
    const context = await requireContext();
    await leaveRoom(context.client, roomSlug, context.userId);
    revalidateRoomPaths(roomSlug);
  } catch (error) {
    return actionError(error, "The room could not be left.");
  }

  redirect("/rooms");
}

export async function updateRoomAction(
  roomSlug: string,
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  try {
    const context = await requireContext();
    const name = normalizeRoomName(formData.get("name"));
    const isPublic = readVisibility(formData);
    await updateRoom(context.client, roomSlug, context.userId, name, isPublic);
    revalidateRoomPaths(roomSlug);
    return { message: "Room settings saved.", status: "success" };
  } catch (error) {
    return actionError(error, "Room settings could not be saved.");
  }
}

export async function addRoomMemberAction(
  roomSlug: string,
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  try {
    const context = await requireContext();
    const room = await getRoomSettings(
      context.client,
      roomSlug,
      context.userId,
    );
    const email = normalizeMemberEmail(formData.get("email"));
    const role = normalizeAssignableRole(formData.get("role"));
    const displayName = await addRoomMember(
      context.client,
      room.id,
      email,
      role,
    );
    revalidateRoomPaths(roomSlug);
    return {
      message: `${displayName} was added as ${role}.`,
      status: "success",
    };
  } catch (error) {
    return actionError(error, "That collaborator could not be added.");
  }
}

export async function changeRoomMemberRoleAction(
  roomSlug: string,
  memberUserId: string,
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  try {
    const context = await requireContext();
    const room = await getRoomSettings(
      context.client,
      roomSlug,
      context.userId,
    );
    const role = normalizeAssignableRole(formData.get("role"));
    await changeRoomMemberRole(context.client, room.id, memberUserId, role);
    revalidateRoomPaths(roomSlug);
    return { message: `Role changed to ${role}.`, status: "success" };
  } catch (error) {
    return actionError(error, "That collaborator role could not be changed.");
  }
}

export async function removeRoomMemberAction(
  roomSlug: string,
  memberUserId: string,
  _state: RoomActionState,
  _formData: FormData,
): Promise<RoomActionState> {
  void _state;
  void _formData;

  try {
    const context = await requireContext();
    const room = await getRoomSettings(
      context.client,
      roomSlug,
      context.userId,
    );
    await removeRoomMember(context.client, room.id, memberUserId);
    revalidateRoomPaths(roomSlug);
    return { message: "Collaborator removed.", status: "success" };
  } catch (error) {
    return actionError(error, "That collaborator could not be removed.");
  }
}

export async function deleteRoomAction(
  roomSlug: string,
  _state: RoomActionState,
  formData: FormData,
): Promise<RoomActionState> {
  try {
    const context = await requireContext();
    const room = await getRoomSettings(
      context.client,
      roomSlug,
      context.userId,
    );
    const confirmation = formData.get("confirmation");

    if (confirmation !== room.name) {
      throw new RoomDomainError(`Type “${room.name}” to confirm deletion.`);
    }

    await deleteRoom(context.client, roomSlug, context.userId);
    revalidateRoomPaths(roomSlug);
  } catch (error) {
    return actionError(error, "The room could not be deleted.");
  }

  redirect("/rooms");
}

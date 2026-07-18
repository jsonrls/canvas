export interface RoomActionState {
  message: string;
  status: "idle" | "error" | "success";
}

export const INITIAL_ROOM_ACTION_STATE: RoomActionState = {
  message: "",
  status: "idle",
};

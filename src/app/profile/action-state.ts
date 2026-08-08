export interface ProfileActionState {
  message: string;
  status: "idle" | "error" | "success";
}

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  message: "",
  status: "idle",
};

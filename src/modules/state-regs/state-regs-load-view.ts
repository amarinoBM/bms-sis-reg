import type { StateRegDto } from "./types";

export type StateRegsLoadState = {
  targetState: string;
  status: "idle" | "loading" | "success" | "error";
  data: StateRegDto | null;
  error: string | null;
};

export const EMPTY_STATE_REGS_LOAD: StateRegsLoadState = {
  targetState: "",
  status: "idle",
  data: null,
  error: null,
};

export function resolveStateRegsView(
  homeState: string,
  loadState: StateRegsLoadState,
): {
  isLoading: boolean;
  stateReg: StateRegDto | null;
  error: string | null;
} {
  const trimmedHomeState = homeState.trim();
  if (!trimmedHomeState) {
    return { isLoading: false, stateReg: null, error: null };
  }

  const matchesCurrent = loadState.targetState === trimmedHomeState;

  return {
    isLoading: matchesCurrent && loadState.status === "loading",
    stateReg: matchesCurrent && loadState.status === "success" ? loadState.data : null,
    error: matchesCurrent && loadState.status === "error" ? loadState.error : null,
  };
}

/** Decides how often a tab may call a polled route. Every call is a function run. */

export const IDLE_AFTER_MS = 5 * 60 * 1_000;
const MAX_DELAY_MS = 60_000;

/** Doubles the delay for each failure in a row, up to a minute. */
export function backoffDelay(baseMs: number, failures: number): number {
  return Math.min(MAX_DELAY_MS, baseMs * 2 ** Math.min(failures, 6));
}

export interface LivePollState {
  /** The live tool is the one on screen. */
  isActive: boolean;
  /** A question is being presented. */
  hasQuestion: boolean;
  idleMs: number;
  failures: number;
}

export function livePollDelay({
  isActive,
  hasQuestion,
  idleMs,
  failures,
}: LivePollState): number {
  // A big screen gets no input, so an open question never counts as idle.
  if (idleMs >= IDLE_AFTER_MS && !(isActive && hasQuestion)) {
    return MAX_DELAY_MS;
  }
  if (isActive) return backoffDelay(hasQuestion ? 2_000 : 5_000, failures);
  return backoffDelay(hasQuestion ? 10_000 : 15_000, failures);
}

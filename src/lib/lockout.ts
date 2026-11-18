import { PIN_FREE_ATTEMPTS, PIN_LOCK_STEPS_MS } from '../constants';

/** Wrong-PIN lockout schedule (ADR-003). Pure: the caller stores the state. */
export interface LockoutState {
  failures: number;
  lockedUntil: number | null;
}

export const NO_LOCKOUT: LockoutState = { failures: 0, lockedUntil: null };

export function lockRemainingMs(state: LockoutState, now: number): number {
  return state.lockedUntil !== null && state.lockedUntil > now ? state.lockedUntil - now : 0;
}

export function attemptsLeft(state: LockoutState): number {
  return Math.max(0, PIN_FREE_ATTEMPTS - state.failures);
}

/** 5th consecutive failure locks for 30 s; each further failure escalates (1 min, 5 min, 15 min cap). */
export function registerFailure(state: LockoutState, now: number): LockoutState {
  const failures = state.failures + 1;
  if (failures < PIN_FREE_ATTEMPTS) return { failures, lockedUntil: null };
  const stepIndex = Math.min(failures - PIN_FREE_ATTEMPTS, PIN_LOCK_STEPS_MS.length - 1);
  return { failures, lockedUntil: now + (PIN_LOCK_STEPS_MS[stepIndex] ?? 0) };
}

export function formatWait(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return seconds < 60 ? `${seconds} detik` : `${Math.ceil(seconds / 60)} menit`;
}

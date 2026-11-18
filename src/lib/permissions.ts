import { OWNER_UNLOCK_MS } from '../constants';
import type { Id, PermissionLevel } from '../types';

/**
 * Who currently holds owner powers on this device (ADR-004).
 * - open: the store has no owner PIN — legacy behaviour, everything allowed
 * - unlocked: owner PIN entered on an owner screen and still within the time box
 * - approved: one-time grant from a PIN prompt, for a single action
 * - locked: owner PIN required
 */
export type OwnerAccess =
  | { kind: 'open' }
  | { kind: 'unlocked'; ownerId: Id }
  | { kind: 'approved'; ownerId: Id; grantedAt: number }
  | { kind: 'locked' };

export const OWNER_PIN_REQUIRED = 'Butuh PIN pemilik.';
export const APPROVAL_EXPIRED = 'Persetujuan kedaluwarsa. Minta PIN pemilik lagi.';

const isExpired = (grantedAt: number, now: number): boolean => now - grantedAt > OWNER_UNLOCK_MS;

/**
 * The single rule for privileged actions — used by the UI (to prompt) and by services (to enforce).
 * Stored levels `owner_only` and `cashier_with_pin` both mean "needs the owner PIN".
 */
export function requiresOwnerPin(level: PermissionLevel, access: OwnerAccess, now: number): boolean {
  if (level === 'cashier') return false;
  switch (access.kind) {
    case 'open':
    case 'unlocked':
      return false;
    case 'approved':
      return isExpired(access.grantedAt, now);
    case 'locked':
      return true;
  }
}

/** Owner to record as approver, or null when no owner PIN exists / none was needed. */
export function approverOf(access: OwnerAccess): Id | null {
  return access.kind === 'unlocked' || access.kind === 'approved' ? access.ownerId : null;
}

export const hasOwnerPowers = (access: OwnerAccess): boolean => access.kind === 'open' || access.kind === 'unlocked';

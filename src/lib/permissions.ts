import type { PermissionLevel, Role } from '../types';

export type PermissionResult = 'allowed' | 'needs_owner_pin' | 'denied';

/** Owner can always act; a cashier depends on the store rule for that action (PRD M11, M14). */
export function checkPermission(level: PermissionLevel, role: Role): PermissionResult {
  if (role === 'owner') return 'allowed';
  if (level === 'cashier') return 'allowed';
  if (level === 'cashier_with_pin') return 'needs_owner_pin';
  return 'denied';
}

export const PERMISSION_MESSAGE: Record<Exclude<PermissionResult, 'allowed'>, string> = {
  needs_owner_pin: 'Butuh persetujuan PIN pemilik.',
  denied: 'Hanya pemilik yang dapat melakukan ini.',
};

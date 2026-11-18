import { useEffect, useMemo } from 'react';
import type { OwnerAccess } from '../lib/permissions';
import { useSessionStore } from '../store/useSessionStore';

/** Current owner powers on this device (ADR-004). `approved` grants come from `requestOwnerApproval`, not from here. */
export function useOwnerAccess(): OwnerAccess {
  const ownerId = useSessionStore((s) => s.ownerId);
  const hasOwnerPin = useSessionStore((s) => s.hasOwnerPin);
  const isUnlocked = useSessionStore((s) => s.ownerUnlockedUntil !== null);

  return useMemo<OwnerAccess>(() => {
    if (!hasOwnerPin || !ownerId) return { kind: 'open' };
    return isUnlocked ? { kind: 'unlocked', ownerId } : { kind: 'locked' };
  }, [hasOwnerPin, ownerId, isUnlocked]);
}

/** Mount once (AppShell): locks owner powers when the time box runs out. */
export function useOwnerAutoLock(): void {
  const unlockedUntil = useSessionStore((s) => s.ownerUnlockedUntil);
  const lockOwner = useSessionStore((s) => s.lockOwner);

  useEffect(() => {
    if (unlockedUntil === null) return undefined;
    const timer = window.setTimeout(lockOwner, Math.max(0, unlockedUntil - Date.now()));
    return () => window.clearTimeout(timer);
  }, [unlockedUntil, lockOwner]);
}

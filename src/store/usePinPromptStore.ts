import { create } from 'zustand';
import type { OwnerAccess } from '../lib/permissions';
import type { Id } from '../types';

interface PinPromptRequest {
  reason: string;
  resolve: (ownerId: Id | null) => void;
}

interface PinPromptState {
  request: PinPromptRequest | null;
  open: (request: PinPromptRequest) => void;
  /** Called by the host sheet: owner id on success, null on cancel. */
  settle: (ownerId: Id | null) => void;
}

export const usePinPromptStore = create<PinPromptState>()((set, get) => ({
  request: null,
  open: (request) => {
    get().request?.resolve(null); // a newer prompt cancels an unanswered one
    set({ request });
  },
  settle: (ownerId) => {
    get().request?.resolve(ownerId);
    set({ request: null });
  },
}));

export type OwnerApproval = Extract<OwnerAccess, { kind: 'approved' }>;

/**
 * Asks for the owner PIN from anywhere (rendered by <OwnerPinHost />). Resolves to a one-time approval
 * for a single action, or null when cancelled. It never unlocks owner screens (ADR-004).
 */
export function requestOwnerApproval(reason: string): Promise<OwnerApproval | null> {
  return new Promise((resolve) => {
    usePinPromptStore.getState().open({
      reason,
      resolve: (ownerId) => resolve(ownerId ? { kind: 'approved', ownerId, grantedAt: Date.now() } : null),
    });
  });
}

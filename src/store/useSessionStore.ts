import { create } from 'zustand';
import type { Id, Role } from '../types';

interface ActiveCashier {
  memberId: Id;
  displayName: string;
  role: Role;
}

interface SessionState {
  storeId: Id | null;
  cashier: ActiveCashier | null;
  isOnline: boolean;
  pendingSyncCount: number;
  setStore: (storeId: Id | null) => void;
  signInCashier: (cashier: ActiveCashier) => void;
  signOutCashier: () => void;
  setOnline: (isOnline: boolean) => void;
  setPendingSyncCount: (count: number) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  storeId: null,
  cashier: null,
  isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
  pendingSyncCount: 0,
  setStore: (storeId) => set({ storeId }),
  signInCashier: (cashier) => set({ cashier }),
  signOutCashier: () => set({ cashier: null }),
  setOnline: (isOnline) => set({ isOnline }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
}));

export const selectIsOwner = (state: SessionState): boolean => state.cashier?.role === 'owner';

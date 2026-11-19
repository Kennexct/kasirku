import { create } from 'zustand';
import type { AccessState, PassClaims } from '../lib/accessPass';
import { ApiError, BILLING_ENABLED, hasRefreshToken, loadStoredPass, refreshPass, signOut as apiSignOut, stateOf } from '../services/account';
import { t } from '../i18n';

type Status = 'checking' | 'signedOut' | 'signedIn';
interface AccessStore {
  status: Status;
  claims: PassClaims | null;
  access: AccessState | null;
  /** Load the stored pass, then refresh it in the background when online. */
  init: () => Promise<void>;
  setClaims: (c: PassClaims) => void;
  refresh: () => Promise<void>;
  /** Re-evaluate against the clock (e.g. a long-open tablet crossing the end date). */
  tick: () => void;
  signOut: () => Promise<void>;
}

export const useAccessStore = create<AccessStore>((set, get) => ({
  status: BILLING_ENABLED ? 'checking' : 'signedIn',
  claims: null,
  access: null,
  async init() {
    if (!BILLING_ENABLED) return;
    const stored = await loadStoredPass();
    if (stored) get().setClaims(stored);
    else if (!hasRefreshToken()) set({ status: 'signedOut' });
    await get().refresh();
    if (get().status === 'checking') set({ status: 'signedOut' }); // no pass and could not reach the server
  },
  setClaims(c) {
    set({ status: 'signedIn', claims: c, access: stateOf(c) });
  },
  async refresh() {
    if (!BILLING_ENABLED || !hasRefreshToken()) return;
    try {
      get().setClaims(await refreshPass());
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await apiSignOut();
        set({ status: 'signedOut', claims: null, access: null });
      }
      // offline / server error: keep the stored pass (ADR-013)
    }
  },
  tick() {
    const c = get().claims;
    if (c) set({ access: stateOf(c) });
  },
  async signOut() {
    await apiSignOut();
    set({ status: 'signedOut', claims: null, access: null });
  },
}));

/** True when the device may record new sales. Always true when billing is off. */
export function canSell(): boolean {
  if (!BILLING_ENABLED) return true;
  const { access } = useAccessStore.getState();
  return access !== null && access.kind !== 'expired';
}

/** Service-level guard (ADR-013: read-only on expiry is enforced below the UI). */
export function assertCanSell(): void {
  if (!canSell()) throw new Error(t('Langganan sudah berakhir. Perpanjang di Pengaturan → Langganan untuk mencatat penjualan lagi.'));
}

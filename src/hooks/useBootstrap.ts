import { useEffect, useState } from 'react';
import { ensureLocalStore } from '../services/bootstrap';
import { useSessionStore } from '../store/useSessionStore';

type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

/**
 * Loads (or creates) the local store and signs in the owner on this device.
 * TODO(M15): replace auto sign-in with owner login + cashier PIN pad.
 */
export function useBootstrap(): BootState {
  const setStore = useSessionStore((s) => s.setStore);
  const signInCashier = useSessionStore((s) => s.signInCashier);
  const [state, setState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    let isActive = true;
    ensureLocalStore()
      .then(({ store, owner }) => {
        if (!isActive) return;
        setStore(store.id);
        signInCashier({ memberId: owner.id, displayName: owner.displayName, role: owner.role });
        setState({ status: 'ready' });
      })
      .catch((error: unknown) => {
        if (!isActive) return;
        const message = error instanceof Error ? error.message : 'Gagal memuat data toko.';
        setState({ status: 'error', message });
      });
    return () => {
      isActive = false;
    };
  }, [setStore, signInCashier]);

  return state;
}

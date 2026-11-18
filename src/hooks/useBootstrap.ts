import { useEffect, useState } from 'react';
import { localDb } from '../db/localDb';
import { ensureLocalStore } from '../services/bootstrap';
import { rememberedMemberId, useSessionStore } from '../store/useSessionStore';

type BootState = { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };

/**
 * Loads (or creates) the local store and restores who is selling (ADR-004):
 *  - remembered, still-active member → signed in again (name/role re-read from the DB, never from storage)
 *  - no owner PIN yet → the owner, as before
 *  - otherwise nobody: the app shows the "Siapa yang berjualan?" screen.
 */
export function useBootstrap(): BootState {
  const [state, setState] = useState<BootState>({ status: 'loading' });

  useEffect(() => {
    let isActive = true;
    const session = useSessionStore.getState();

    const boot = async () => {
      const { store, owner } = await ensureLocalStore();
      const hasOwnerPin = owner.pinHash !== '';
      const rememberedId = rememberedMemberId();
      const remembered = rememberedId ? await localDb.storeMembers.get(rememberedId) : undefined;
      const seller = remembered && !remembered.deletedAt && remembered.storeId === store.id ? remembered : hasOwnerPin ? null : owner;
      if (!isActive) return;

      session.setStore(store.id);
      session.setOwnerInfo(owner.id, hasOwnerPin);
      if (seller) session.signInCashier({ memberId: seller.id, displayName: seller.displayName, role: seller.role });
      else session.signOutCashier();
      setState({ status: 'ready' });
    };

    boot().catch((error: unknown) => {
      if (!isActive) return;
      setState({ status: 'error', message: error instanceof Error ? error.message : 'Gagal memuat data toko.' });
    });
    return () => {
      isActive = false;
    };
  }, []);

  return state;
}

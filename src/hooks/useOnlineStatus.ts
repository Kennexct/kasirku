import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { SYNC_INTERVAL_MS } from '../constants';
import { pendingCount, pushOutbox } from '../services/sync';
import { useSessionStore } from '../store/useSessionStore';
import { t } from '../i18n';

/** Tracks connectivity and runs the background outbox push loop. */
export function useOnlineStatus(): void {
  const setOnline = useSessionStore((s) => s.setOnline);
  const setPendingSyncCount = useSessionStore((s) => s.setPendingSyncCount);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => {
      setOnline(false);
      toast(t('Offline — penjualan tetap tersimpan di perangkat'));
    };

    const tick = async () => {
      const result = await pushOutbox();
      if (!result.ok && result.error.startsWith(t('Sync stuck'))) {
        toast.error(t('Sinkronisasi tertunda. Data aman di perangkat.'));
      }
      setPendingSyncCount(await pendingCount());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const timer = window.setInterval(() => void tick(), SYNC_INTERVAL_MS);
    void tick();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(timer);
    };
  }, [setOnline, setPendingSyncCount]);
}

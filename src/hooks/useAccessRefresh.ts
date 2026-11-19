import { useEffect } from 'react';
import { useAccessStore } from '../store/useAccessStore';
import { BILLING_ENABLED } from '../services/account';

const HOUR = 3_600_000;

/** ADR-013: load the pass on start, refresh on reconnect and hourly, re-evaluate every minute. */
export function useAccessRefresh() {
  const status = useAccessStore((s) => s.status);
  useEffect(() => {
    if (!BILLING_ENABLED) return;
    const s = useAccessStore.getState();
    void s.init();
    const onOnline = () => void useAccessStore.getState().refresh();
    window.addEventListener('online', onOnline);
    const hourly = window.setInterval(onOnline, HOUR);
    const minute = window.setInterval(() => useAccessStore.getState().tick(), 60_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(hourly);
      window.clearInterval(minute);
    };
  }, []);
  return status;
}

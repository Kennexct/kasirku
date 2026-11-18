import type { Store } from '../../types';
import { CashierSection } from './staff/CashierSection';
import { OwnerPinSection } from './staff/OwnerPinSection';
import { RulesSection } from './staff/RulesSection';

/** Settings → "Staf & PIN" (spec: .10x/specs/2026-11-18-staff-pin-design.md). */
export function StaffSettings({ store }: { store: Store }) {
  return (
    <>
      <OwnerPinSection storeId={store.id} />
      <CashierSection storeId={store.id} />
      <RulesSection key={JSON.stringify(store.settings)} store={store} />
    </>
  );
}

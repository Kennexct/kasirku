import { useState } from 'react';
import toast from 'react-hot-toast';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { btnPrimary, helperText, inputBase, labelBase } from '../../../components/ui/styles';
import { PERCENT_MAX } from '../../../constants';
import { updateStore } from '../../../services/bootstrap';
import type { PermissionLevel, Store, StoreRules } from '../../../types';
import { SettingsSection } from '../SettingsSection';

type RuleChoice = 'free' | 'pin';
const RULE_OPTIONS = [
  { value: 'free', label: 'Kasir boleh langsung' },
  { value: 'pin', label: 'Perlu PIN pemilik' },
] as const;
const MAX_REFUND_WINDOW_DAYS = 90;

/** `owner_only` and `cashier_with_pin` behave the same (ADR-004), so the UI offers two choices. */
const toChoice = (level: PermissionLevel): RuleChoice => (level === 'cashier' ? 'free' : 'pin');
const toLevel = (choice: RuleChoice): PermissionLevel => (choice === 'free' ? 'cashier' : 'cashier_with_pin');
const clamp = (value: string, max: number): number => Math.min(max, Math.max(0, Math.round(Number(value)) || 0));

/** Rules a cashier works under: void, refund, discount limit, refund window (PRD M11/M14). */
export function RulesSection({ store }: { store: Store }) {
  const [rules, setRules] = useState<StoreRules>(store.settings);
  const update = (patch: Partial<StoreRules>) => setRules((prev) => ({ ...prev, ...patch }));
  const isDirty = JSON.stringify(rules) !== JSON.stringify(store.settings);

  const save = async () => {
    try {
      await updateStore({ ...store, settings: rules });
      toast.success('Aturan kasir disimpan');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan aturan.');
    }
  };

  return (
    <SettingsSection
      title="Aturan kasir"
      description="Berlaku saat mode pemilik terkunci. Tanpa PIN pemilik, semua tindakan terbuka."
      footer={
        <button type="button" disabled={!isDirty} onClick={() => void save()} className={`${btnPrimary} h-11`}>
          Simpan aturan
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className={labelBase}>Void (batalkan transaksi hari ini)</p>
          <SegmentedControl label="Aturan void" options={RULE_OPTIONS} value={toChoice(rules.voidPermission)} onChange={(c) => update({ voidPermission: toLevel(c) })} />
        </div>
        <div>
          <p className={labelBase}>Refund</p>
          <SegmentedControl label="Aturan refund" options={RULE_OPTIONS} value={toChoice(rules.refundPermission)} onChange={(c) => update({ refundPermission: toLevel(c) })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rule-discount" className={labelBase}>Batas diskon kasir (%)</label>
            <input id="rule-discount" type="number" inputMode="numeric" min={0} max={PERCENT_MAX} value={rules.cashierMaxDiscountPct} onChange={(e) => update({ cashierMaxDiscountPct: clamp(e.target.value, PERCENT_MAX) })} className={`${inputBase} num`} />
            <p className={helperText}>Di atas batas ini perlu PIN pemilik.</p>
          </div>
          <div>
            <label htmlFor="rule-refund-window" className={labelBase}>Batas waktu refund (hari)</label>
            <input id="rule-refund-window" type="number" inputMode="numeric" min={0} max={MAX_REFUND_WINDOW_DAYS} value={rules.refundWindowDays} onChange={(e) => update({ refundWindowDays: clamp(e.target.value, MAX_REFUND_WINDOW_DAYS) })} className={`${inputBase} num`} />
            <p className={helperText}>0 = hanya di hari yang sama.</p>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}

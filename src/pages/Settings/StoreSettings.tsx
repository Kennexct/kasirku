import { useState } from 'react';
import toast from 'react-hot-toast';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { btnPrimary, inputBase, labelBase } from '../../components/ui/styles';
import { Switch } from '../../components/ui/Switch';
import { PERCENT_MAX } from '../../constants';
import { updateStore } from '../../services/bootstrap';
import type { Store } from '../../types';
import { SettingsSection } from './SettingsSection';

type TextField = 'name' | 'address' | 'phone' | 'receiptHeader' | 'receiptFooter';

const PROFILE_FIELDS: ReadonlyArray<{ key: TextField; label: string; placeholder: string }> = [
  { key: 'name', label: 'Nama toko', placeholder: 'Bakso Pak Budi' },
  { key: 'phone', label: 'No. HP / WhatsApp', placeholder: '0812xxxx' },
  { key: 'address', label: 'Alamat', placeholder: 'Jl. Melati No. 5, Depok' },
];
const RECEIPT_FIELDS: ReadonlyArray<{ key: TextField; label: string; placeholder: string }> = [
  { key: 'receiptHeader', label: 'Teks atas struk', placeholder: 'Buka 10.00–22.00' },
  { key: 'receiptFooter', label: 'Teks bawah struk', placeholder: 'Terima kasih!' },
];
const PAPER_OPTIONS = [
  { value: '58', label: '58 mm' },
  { value: '80', label: '80 mm' },
] as const;

const clampPercent = (value: string): number => Math.min(PERCENT_MAX, Math.max(0, Number(value) || 0));

/** M14 store profile, receipt text, tax & service. */
export function StoreSettings({ store }: { store: Store }) {
  const [draft, setDraft] = useState<Store>(store);
  const update = (patch: Partial<Store>) => setDraft((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('Nama toko wajib diisi.');
      return;
    }
    try {
      await updateStore({ ...draft, name: draft.name.trim() });
      toast.success('Pengaturan toko disimpan');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan.');
    }
  };

  const textField = ({ key, label, placeholder }: { key: TextField; label: string; placeholder: string }) => (
    <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
      <label htmlFor={`store-${key}`} className={labelBase}>{label}</label>
      <input id={`store-${key}`} value={draft[key]} placeholder={placeholder} onChange={(e) => update({ [key]: e.target.value })} className={inputBase} />
    </div>
  );

  const isDirty = JSON.stringify(draft) !== JSON.stringify(store);

  return (
    <>
      <SettingsSection title="Profil toko" description="Tampil di bagian atas struk.">
        <div className="grid gap-4 sm:grid-cols-2">{PROFILE_FIELDS.map(textField)}</div>
      </SettingsSection>

      <SettingsSection title="Struk" description="Teks tambahan dan ukuran kertas printer thermal.">
        <div className="grid gap-4">
          {RECEIPT_FIELDS.map(textField)}
          <div>
            <p className={labelBase}>Lebar kertas</p>
            <SegmentedControl
              label="Lebar kertas"
              options={PAPER_OPTIONS}
              value={String(draft.receiptPaperMm) as '58' | '80'}
              onChange={(mm) => update({ receiptPaperMm: mm === '80' ? 80 : 58 })}
            />
          </div>
          <Switch
            checked={draft.settings.shouldAutoShowReceipt}
            onChange={(shouldAutoShowReceipt) => update({ settings: { ...draft.settings, shouldAutoShowReceipt } })}
            label="Tampilkan struk setelah bayar"
            description="Matikan jika antrean ramai dan struk jarang diminta."
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Pajak & service" description="Isi 0 jika usaha Anda tidak memungut pajak.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tax-pct" className={labelBase}>Pajak PB1/PPN (%)</label>
            <input id="tax-pct" type="number" inputMode="decimal" min={0} max={100} value={draft.taxPct} onChange={(e) => update({ taxPct: clampPercent(e.target.value) })} className={`${inputBase} num`} />
          </div>
          <div>
            <label htmlFor="service-pct" className={labelBase}>Service (%)</label>
            <input id="service-pct" type="number" inputMode="decimal" min={0} max={100} value={draft.servicePct} onChange={(e) => update({ servicePct: clampPercent(e.target.value) })} className={`${inputBase} num`} />
          </div>
          <div className="sm:col-span-2">
            <Switch checked={draft.isTaxInclusive} onChange={(isTaxInclusive) => update({ isTaxInclusive })} label="Harga sudah termasuk pajak" />
          </div>
        </div>
      </SettingsSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border">
        {isDirty && <span className="text-[13px] text-muted">Ada perubahan yang belum disimpan</span>}
        <button type="button" disabled={!isDirty} onClick={() => void handleSave()} className={`${btnPrimary} h-11`}>
          Simpan perubahan
        </button>
      </div>
    </>
  );
}

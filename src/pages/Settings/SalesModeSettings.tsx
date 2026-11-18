import { Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { badgeBrand, btnGhost, card, helperText, inputBase, labelBase } from '../../components/ui/styles';
import { Switch } from '../../components/ui/Switch';
import { saveSalesMode } from '../../services/catalog';
import type { PriceRule, SalesMode } from '../../types';

const PRICE_RULE_OPTIONS: ReadonlyArray<{ value: PriceRule; label: string }> = [
  { value: 'none', label: 'Harga dasar' },
  { value: 'mode_price', label: 'Per produk' },
  { value: 'markup', label: 'Markup %' },
];

const PRICE_RULE_HELP: Record<PriceRule, string> = {
  none: 'Semua produk memakai harga dasar.',
  mode_price: 'Atur harga khusus di setiap produk (mis. biaya cup takeaway). Kosong = harga dasar.',
  markup: 'Harga dasar dinaikkan otomatis, cocok untuk menutup komisi ojol.',
};

async function persist(mode: SalesMode): Promise<void> {
  try {
    await saveSalesMode(mode);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Gagal menyimpan mode.');
  }
}

/** M4: enable modes, pick the default, and decide how each mode is priced. Changes save instantly. */
export function SalesModeSettings({ modes }: { modes: SalesMode[] }) {
  const setDefault = async (target: SalesMode) => {
    for (const mode of modes) {
      const isDefault = mode.id === target.id;
      if (mode.isDefault !== isDefault) await persist({ ...mode, isDefault, isActive: isDefault || mode.isActive });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[14px] text-muted">Perubahan tersimpan otomatis.</p>
      {modes.map((mode) => (
        <section key={mode.id} className={`${card} overflow-hidden ${mode.isActive ? '' : 'bg-subtle'}`}>
          <div className="flex items-center gap-3 px-5 py-2">
            <div className="flex-1">
              <Switch
                checked={mode.isActive}
                disabled={mode.isDefault}
                onChange={(isActive) => void persist({ ...mode, isActive })}
                label={mode.name}
                description={mode.isDefault ? 'Mode default saat kasir dibuka' : mode.isActive ? 'Tampil di kasir' : 'Disembunyikan'}
              />
            </div>
            {mode.isDefault ? (
              <span className={badgeBrand}>Default</span>
            ) : (
              <button type="button" onClick={() => void setDefault(mode)} className={`${btnGhost} text-[13px]`}>
                <Star aria-hidden size={15} /> Jadikan default
              </button>
            )}
          </div>
          {mode.isActive && (
            <div className="border-t border-line px-5 py-4">
              <p className={labelBase}>Aturan harga</p>
              <SegmentedControl label={`Aturan harga ${mode.name}`} options={PRICE_RULE_OPTIONS} value={mode.priceRule} onChange={(priceRule) => void persist({ ...mode, priceRule })} />
              <p className={helperText}>{PRICE_RULE_HELP[mode.priceRule]}</p>
              {mode.priceRule === 'markup' && (
                <div className="mt-3 max-w-[180px]">
                  <label htmlFor={`markup-${mode.id}`} className={labelBase}>Markup (%)</label>
                  <input
                    id={`markup-${mode.id}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    defaultValue={mode.markupPct}
                    onBlur={(e) => void persist({ ...mode, markupPct: Number(e.target.value) || 0 })}
                    className={`${inputBase} num`}
                  />
                </div>
              )}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

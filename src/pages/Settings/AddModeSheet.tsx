import { useState } from 'react';
import toast from 'react-hot-toast';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Sheet } from '../../components/ui/Sheet';
import { btnPrimary, helperText, inputBase, labelBase } from '../../components/ui/styles';
import { CONFIG_NAME_MAX } from '../../constants';
import { createSalesMode } from '../../services/checkoutConfig';
import type { Id, PriceRule } from '../../types';
import { PRICE_RULE_HELP, PRICE_RULE_OPTIONS } from './priceRules';

const DEFAULT_MARKUP_PCT = 20;

export function AddModeSheet({ storeId, onClose }: { storeId: Id; onClose: () => void }) {
  const [name, setName] = useState('');
  const [priceRule, setPriceRule] = useState<PriceRule>('none');
  const [markupPct, setMarkupPct] = useState(String(DEFAULT_MARKUP_PCT));
  const [isSaving, setIsSaving] = useState(false);

  const submit = async () => {
    setIsSaving(true);
    try {
      const mode = await createSalesMode(storeId, { name, priceRule, markupPct: Number(markupPct) || 0 });
      toast.success(`${mode.name} ditambahkan`);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menambah mode.');
      setIsSaving(false);
    }
  };

  return (
    <Sheet
      title="Tambah mode penjualan"
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={isSaving || name.trim() === ''} onClick={() => void submit()} className={`${btnPrimary} w-full`}>
          Tambah mode
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="mode-name" className={labelBase}>Nama mode</label>
          <input id="mode-name" autoFocus value={name} maxLength={CONFIG_NAME_MAX} placeholder="mis. ShopeeFood, Pesan antar" onChange={(e) => setName(e.target.value)} className={inputBase} />
        </div>
        <div>
          <p className={labelBase}>Aturan harga</p>
          <SegmentedControl label="Aturan harga mode baru" options={PRICE_RULE_OPTIONS} value={priceRule} onChange={setPriceRule} isFullWidth />
          <p className={helperText}>{PRICE_RULE_HELP[priceRule]}</p>
        </div>
        {priceRule === 'markup' && (
          <div className="max-w-[180px]">
            <label htmlFor="mode-markup" className={labelBase}>Markup (%)</label>
            <input id="mode-markup" type="number" inputMode="decimal" min={0} max={100} value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} className={`${inputBase} num`} />
          </div>
        )}
      </div>
    </Sheet>
  );
}

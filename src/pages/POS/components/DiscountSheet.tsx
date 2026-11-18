import { useState } from 'react';
import { RupiahInput } from '../../../components/ui/RupiahInput';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Sheet } from '../../../components/ui/Sheet';
import { btnPrimary, btnSecondary, inputBase, labelBase, option, sectionTitle } from '../../../components/ui/styles';
import { PERCENT_MAX } from '../../../constants';
import { formatRupiah } from '../../../lib/money';
import type { AppliedDiscount, Discount, DiscountType } from '../../../types';

interface DiscountSheetProps {
  presets: Discount[];
  current: AppliedDiscount | null;
  /** Ad-hoc percent limit for this user; null = no limit (owner). */
  maxPercent: number | null;
  baseAmount: number;
  onApply: (discount: AppliedDiscount | null) => void;
  onClose: () => void;
}

const TYPE_OPTIONS = [
  { value: 'percent', label: 'Persen (%)' },
  { value: 'fixed', label: 'Nominal (Rp)' },
] as const;

/** M6 order-level discount: pick a preset or enter an ad-hoc % / Rp amount. */
export function DiscountSheet({ presets, current, maxPercent, baseAmount, onApply, onClose }: DiscountSheetProps) {
  const isCustom = current !== null && current.discountId === null;
  const [type, setType] = useState<DiscountType>(isCustom ? current.type : 'percent');
  const [value, setValue] = useState<number | null>(isCustom ? current.value : null);

  const effectivePercent = type === 'percent' ? (value ?? 0) : baseAmount > 0 ? ((value ?? 0) / baseAmount) * PERCENT_MAX : 0;
  const isOverLimit = maxPercent !== null && effectivePercent > maxPercent;
  const isInvalid = value === null || value <= 0 || (type === 'percent' && value > PERCENT_MAX) || isOverLimit;

  const applyPreset = (preset: Discount) =>
    onApply({ discountId: preset.id, name: preset.name, type: preset.type, value: preset.value });

  const applyCustom = () => {
    if (isInvalid || value === null) return;
    const name = type === 'percent' ? `Diskon ${value}%` : `Diskon ${formatRupiah(value)}`;
    onApply({ discountId: null, name, type, value });
  };

  return (
    <Sheet
      title="Diskon pesanan"
      subtitle={`Dari ${formatRupiah(baseAmount)}`}
      isOpen
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          {current && (
            <button type="button" onClick={() => onApply(null)} className={btnSecondary}>
              Hapus diskon
            </button>
          )}
          <button type="button" disabled={isInvalid} onClick={applyCustom} className={`${btnPrimary} flex-1`}>
            Terapkan
          </button>
        </div>
      }
    >
      {presets.length > 0 && (
        <section className="mb-6">
          <h3 className={`${sectionTitle} mb-2.5`}>Promo tersimpan</h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`${option(current?.discountId === preset.id)} min-h-14 flex-col items-start! gap-0 py-2 text-left`}
              >
                <span className="font-semibold">{preset.name}</span>
                <span className="num text-[13px] opacity-80">{preset.type === 'percent' ? `${preset.value}%` : formatRupiah(preset.value)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className={`${sectionTitle} mb-2.5`}>Diskon manual</h3>
        <SegmentedControl label="Jenis diskon" options={TYPE_OPTIONS} value={type} onChange={setType} isFullWidth />
        <div className="mt-3">
          <label htmlFor="discount-value" className={labelBase}>{type === 'percent' ? 'Besar diskon (%)' : 'Besar diskon'}</label>
          {type === 'percent' ? (
            <input
              id="discount-value"
              inputMode="numeric"
              value={value ?? ''}
              onChange={(event) => {
                const parsed = Number(event.target.value.replace(/[^\d]/g, ''));
                setValue(event.target.value === '' ? null : parsed);
              }}
              placeholder="10"
              className={`${inputBase} num`}
            />
          ) : (
            <RupiahInput id="discount-value" value={value} onChange={setValue} />
          )}
        </div>
        {isOverLimit && (
          <p role="alert" className="mt-2 rounded-md bg-danger-50 px-3 py-2 text-[13px] text-danger-700">
            Melebihi batas diskon kasir ({maxPercent}%). Minta pemilik untuk menerapkan.
          </p>
        )}
      </section>
    </Sheet>
  );
}

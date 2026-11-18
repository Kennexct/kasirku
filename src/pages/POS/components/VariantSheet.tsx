import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Sheet } from '../../../components/ui/Sheet';
import { btnPrimary, option as optionClass } from '../../../components/ui/styles';
import { formatRupiah } from '../../../lib/money';
import { unitPriceWithOptions } from '../../../lib/pricing';
import { defaultSelection, toSelectedOptions, toggleOption, validateSelection, type VariantSelection } from '../../../lib/variants';
import type { Product, SelectedOption, VariantGroup } from '../../../types';

interface VariantSheetProps {
  product: Product;
  groups: VariantGroup[];
  modePrice: number;
  onClose: () => void;
  onConfirm: (options: SelectedOption[], unitPrice: number) => void;
}

export function VariantSheet({ product, groups, modePrice, onClose, onConfirm }: VariantSheetProps) {
  const [selection, setSelection] = useState<VariantSelection>(() => defaultSelection(groups));
  const options = useMemo(() => toSelectedOptions(groups, selection), [groups, selection]);
  const unitPrice = unitPriceWithOptions(modePrice, options);
  const error = validateSelection(groups, selection);

  const handleToggle = (group: VariantGroup, optionId: string) =>
    setSelection((prev) => ({ ...prev, [group.id]: toggleOption(group, prev[group.id] ?? [], optionId) }));

  return (
    <Sheet
      title={product.name}
      subtitle={`Mulai ${formatRupiah(modePrice)}`}
      isOpen
      onClose={onClose}
      footer={
        <button type="button" disabled={error !== null} onClick={() => onConfirm(options, unitPrice)} className={`${btnPrimary} w-full justify-between!`}>
          <span>{error ?? 'Tambah ke pesanan'}</span>
          {error === null && <span className="num">{formatRupiah(unitPrice)}</span>}
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <fieldset key={group.id}>
            <legend className="mb-2.5 flex w-full items-center gap-2">
              <span className="text-[15px] font-semibold">{group.name}</span>
              <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${group.isRequired ? 'bg-ink text-white' : 'bg-subtle text-muted'}`}>
                {group.isRequired ? 'Wajib' : 'Opsional'}
              </span>
              {group.selectType === 'multi' && <span className="text-[13px] text-muted">maks {group.max}</span>}
            </legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.options.map((option) => {
                const isSelected = selection[group.id]?.includes(option.id) ?? false;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleToggle(group, option.id)}
                    className={`${optionClass(isSelected)} min-h-12 justify-between! text-left`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isSelected && <Check aria-hidden size={16} className="shrink-0" />}
                      {option.name}
                    </span>
                    {option.priceDelta !== 0 && (
                      <span className="num text-[12px] font-semibold opacity-80">
                        {option.priceDelta > 0 ? '+' : '−'}
                        {formatRupiah(Math.abs(option.priceDelta)).replace('Rp', '')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </Sheet>
  );
}

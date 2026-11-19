import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { RupiahInput } from '../../components/ui/RupiahInput';
import { btnIcon, btnSecondary, inputBase, labelBase } from '../../components/ui/styles';
import { t } from '../../i18n';
import { uuidv7 } from '../../lib/id';
import { MAX_VARIANTS, VARIANT_NAME_MAX } from '../../lib/productVariants';
import type { Id, ProductVariant, SalesMode } from '../../types';

interface ProductVariantsEditorProps {
  variants: ProductVariant[];
  /** Sales modes priced "per product" (e.g. Takeaway): each variant gets its own optional price for them. */
  priceModes: readonly SalesMode[];
  /** "/kg" etc. when the product is sold by weight. */
  unitSuffix: string;
  onChange: (variants: ProductVariant[]) => void;
}

export const newVariant = (sortOrder: number): ProductVariant => ({ id: uuidv7(), name: '', price: 0, sortOrder });

/** Variants of one product (ADR-012): name, own full price, optional per-mode price and cost price. */
export function ProductVariantsEditor({ variants, priceModes, unitSuffix, onChange }: ProductVariantsEditorProps) {
  const patch = (id: Id, change: Partial<ProductVariant>) => onChange(variants.map((v) => (v.id === id ? { ...v, ...change } : v)));

  const setModePrice = (variant: ProductVariant, modeId: Id, price: number | null) => {
    const { [modeId]: _removed, ...rest } = variant.modePrices ?? {};
    patch(variant.id, { modePrices: price === null ? rest : { ...rest, [modeId]: price } });
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...variants];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(index + direction, 0, moved);
    onChange(next.map((v, sortOrder) => ({ ...v, sortOrder })));
  };

  return (
    <div className="flex flex-col gap-3">
      {variants.map((variant, index) => (
        <div key={variant.id} className="rounded-lg border border-line bg-subtle/60 p-3">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`variant-name-${variant.id}`} className={labelBase}>{t('Nama varian {0}', index + 1)}</label>
              <input
                id={`variant-name-${variant.id}`}
                value={variant.name}
                maxLength={VARIANT_NAME_MAX}
                placeholder={t('mis. Latte')}
                onChange={(e) => patch(variant.id, { name: e.target.value })}
                className={inputBase}
              />
            </div>
            <button type="button" aria-label={t('Naikkan {0}', variant.name || index + 1)} disabled={index === 0} onClick={() => move(index, -1)} className={btnIcon}>
              <ArrowUp aria-hidden size={17} />
            </button>
            <button type="button" aria-label={t('Turunkan {0}', variant.name || index + 1)} disabled={index === variants.length - 1} onClick={() => move(index, 1)} className={btnIcon}>
              <ArrowDown aria-hidden size={17} />
            </button>
            <button type="button" aria-label={t('Hapus varian {0}', variant.name || index + 1)} onClick={() => onChange(variants.filter((v) => v.id !== variant.id))} className={btnIcon}>
              <Trash2 aria-hidden size={17} className="text-danger-600" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`variant-price-${variant.id}`} className={labelBase}>
                {t('Harga')} <span className="num font-normal text-muted">{unitSuffix}</span>
              </label>
              <RupiahInput id={`variant-price-${variant.id}`} value={variant.price} onChange={(v) => patch(variant.id, { price: v ?? 0 })} />
            </div>
            {priceModes.map((mode) => (
              <div key={mode.id}>
                <label htmlFor={`variant-${mode.id}-${variant.id}`} className={labelBase}>{t('Harga')} {mode.name}</label>
                <RupiahInput id={`variant-${mode.id}-${variant.id}`} value={variant.modePrices?.[mode.id] ?? null} onChange={(v) => setModePrice(variant, mode.id, v)} placeholder={t('Ikut harga varian')} />
              </div>
            ))}
            <div>
              <label htmlFor={`variant-cost-${variant.id}`} className={labelBase}>{t('Harga modal')} <span className="font-normal text-muted">{t('(opsional)')}</span></label>
              <RupiahInput id={`variant-cost-${variant.id}`} value={variant.costPrice ?? null} onChange={(v) => patch(variant.id, { costPrice: v ?? undefined })} placeholder={t('Belum diisi')} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" disabled={variants.length >= MAX_VARIANTS} onClick={() => onChange([...variants, newVariant(variants.length)])} className={`${btnSecondary} h-11 self-start text-[14px]`}>
        <Plus aria-hidden size={17} /> {t('Tambah varian')}
      </button>
    </div>
  );
}

import { Layers, SearchX } from 'lucide-react';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProductThumb } from '../../../components/ui/ProductThumb';
import { formatRupiah } from '../../../lib/money';
import { isUsingFallbackPrice, resolveModePrice } from '../../../lib/pricing';
import type { Id, Product, SalesMode } from '../../../types';

interface ProductGridProps {
  products: Product[];
  salesMode: SalesMode;
  qtyByProduct: ReadonlyMap<Id, number>;
  onSelect: (product: Product) => void;
}

export function ProductGrid({ products, salesMode, qtyByProduct, onSelect }: ProductGridProps) {
  if (products.length === 0) {
    return <EmptyState icon={SearchX} title="Produk tidak ditemukan" description="Coba kata kunci lain atau pilih kategori Semua." />;
  }

  return (
    <ul className="grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        const qty = qtyByProduct.get(product.id) ?? 0;
        const isSelected = qty > 0;
        const hasVariants = product.variantGroupIds.length > 0;
        return (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => onSelect(product)}
              className={`relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-surface text-left shadow-xs transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.985] ${
                isSelected ? 'border-brand-600 ring-1 ring-brand-600' : 'border-line hover:border-line-strong'
              }`}
            >
              <ProductThumb name={product.name} photoUrl={product.photoUrl} className="aspect-[3/2] w-full border-b border-line md:aspect-[4/3]" />
              <span className="flex flex-1 flex-col gap-1 p-2.5 md:p-3">
                <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink md:text-[14px]">{product.name}</span>
                <span className="mt-auto flex items-center gap-1.5">
                  <span className="num text-[13px] font-semibold text-ink-soft md:text-[14px]">
                    {formatRupiah(resolveModePrice(product, salesMode))}
                  </span>
                  {hasVariants && <Layers aria-label="Ada varian" size={14} className="text-faint" />}
                  {isUsingFallbackPrice(product, salesMode) && (
                    <span title="Harga mode ini belum diatur — memakai harga dasar" className="h-[18px] rounded bg-warn-50 px-1 text-[10px] font-semibold leading-[18px] text-warn-700">
                      Dasar
                    </span>
                  )}
                </span>
              </span>
              {isSelected && (
                <span className="num absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-md bg-brand-600 px-1.5 text-[13px] font-bold text-white shadow-xs">
                  {qty}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

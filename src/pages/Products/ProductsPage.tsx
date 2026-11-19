import { ChevronRight, PackageOpen, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/Layout/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ProductThumb } from '../../components/ui/ProductThumb';
import { SearchInput } from '../../components/ui/SearchInput';
import { badgeBrand, badgeNeutral, badgeWarn, btnPrimary, card } from '../../components/ui/styles';
import { Tabs } from '../../components/ui/Tabs';
import { useAppData } from '../../hooks/useAppData';
import { formatRupiah } from '../../lib/money';
import type { Product, VariantGroup } from '../../types';
import { ProductForm } from './ProductForm';
import { VariantGroupForm } from './VariantGroupForm';
import { t } from '../../i18n';

type Tab = 'products' | 'variants';
type Editing<T> = { item: T | null } | null;

export function ProductsPage() {
  const { store, catalog } = useAppData();
  const [tab, setTab] = useState<Tab>('products');
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Editing<Product>>(null);
  const [editingGroup, setEditingGroup] = useState<Editing<VariantGroup>>(null);

  const categoryName = useMemo(() => new Map(catalog?.categories.map((c) => [c.id, c.name]) ?? []), [catalog]);
  const groupName = useMemo(() => new Map(catalog?.variantGroups.map((g) => [g.id, g.name]) ?? []), [catalog]);

  if (!store || !catalog) return <LoadingScreen />;

  const query = search.trim().toLowerCase();
  const products = catalog.products.filter((p) => query === '' || p.name.toLowerCase().includes(query));
  const takeawayMode = catalog.salesModes.find((m) => m.priceRule === 'mode_price');

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={t('Produk')}
        helpTopic="produk"
        description={t('Menu, harga per mode penjualan, dan varian.')}
        actions={
          <button
            type="button"
            onClick={() => (tab === 'products' ? setEditingProduct({ item: null }) : setEditingGroup({ item: null }))}
            className={`${btnPrimary} h-11`}
          >
            <Plus aria-hidden size={18} /> {tab === 'products' ? t('Produk') : t('Grup varian')}
          </button>
        }
      >
        <Tabs
          label={t('Jenis data')}
          value={tab}
          onChange={setTab}
          items={[
            { value: 'products', label: t('Produk'), count: catalog.products.length },
            { value: 'variants', label: t('Varian'), count: catalog.variantGroups.length },
          ]}
        />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:px-8 md:py-6">
        {tab === 'products' ? (
          <>
            <div className="mb-3 max-w-md">
              <SearchInput value={search} onChange={setSearch} placeholder={t('Cari produk…')} label={t('Cari produk')} />
            </div>
            <div className={`${card} overflow-hidden`}>
              <div className="hidden grid-cols-[1fr_160px_120px_120px_96px_24px] items-center gap-4 border-b border-line bg-subtle px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.05em] text-muted lg:grid">
                <span>{t('Produk')}</span>
                <span>{t('Varian')}</span>
                <span className="text-right">{'Dine In'}</span>
                <span className="text-right">{takeawayMode?.name ?? 'Takeaway'}</span>
                <span>{t('Status')}</span>
                <span />
              </div>
              <ul className="divide-y divide-line">
                {products.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setEditingProduct({ item: p })}
                      className="grid w-full grid-cols-[1fr_auto_20px] items-center gap-3 px-4 py-3 text-left hover:bg-subtle lg:grid-cols-[1fr_160px_120px_120px_96px_24px] lg:gap-4"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <ProductThumb name={p.name} photoUrl={p.photoUrl} className="h-11 w-11 shrink-0 rounded-md border border-line" />
                        <span className="min-w-0">
                          <span className={`block truncate text-[15px] font-semibold ${p.isActive ? '' : 'text-muted'}`}>{p.name}</span>
                          <span className="block truncate text-[13px] text-muted">
                            {(p.categoryId && categoryName.get(p.categoryId)) || t('Tanpa kategori')}
                            <span className="lg:hidden">
                              {p.variantGroupIds.length > 0 && t(' · {0} varian', p.variantGroupIds.length)}
                              {p.isActive && p.isSoldOut && t(' · Habis')}
                            </span>
                          </span>
                        </span>
                      </span>
                      <span className="hidden truncate text-[13px] text-ink-soft lg:block">
                        {p.variantGroupIds.map((id) => groupName.get(id)).filter(Boolean).join(', ') || '—'}
                      </span>
                      <span className="num text-right text-[15px] font-semibold">{formatRupiah(p.basePrice)}</span>
                      <span className="num hidden text-right text-[14px] text-ink-soft lg:block">
                        {takeawayMode && p.modePrices[takeawayMode.id] !== undefined ? formatRupiah(p.modePrices[takeawayMode.id] ?? 0) : '—'}
                      </span>
                      <span className="hidden lg:block">
                        <span className={!p.isActive ? badgeNeutral : p.isSoldOut ? badgeWarn : badgeBrand}>{!p.isActive ? t('Nonaktif') : p.isSoldOut ? t('Habis') : t('Aktif')}</span>
                      </span>
                      <ChevronRight aria-hidden size={18} className="text-faint" />
                    </button>
                  </li>
                ))}
              </ul>
              {products.length === 0 && <EmptyState icon={PackageOpen} title={t('Belum ada produk')} description={t('Tambahkan menu pertama Anda.')} />}
            </div>
          </>
        ) : (
          <ul className={`${card} divide-y divide-line overflow-hidden`}>
            {catalog.variantGroups.map((g) => (
              <li key={g.id}>
                <button type="button" onClick={() => setEditingGroup({ item: g })} className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-subtle">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold">{g.name}</span>
                      <span className={badgeNeutral}>{g.isRequired ? t('Wajib') : t('Opsional')}</span>
                      <span className={badgeNeutral}>{g.selectType === 'single' ? t('Pilih satu') : t('Maks {0}', g.max)}</span>
                    </span>
                    <span className="num mt-0.5 block truncate text-[13px] text-muted">
                      {g.options.map((o) => (o.priceDelta ? `${o.name} +${formatRupiah(o.priceDelta)}` : o.name)).join(' · ')}
                    </span>
                  </span>
                  <ChevronRight aria-hidden size={18} className="text-faint" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingProduct && <ProductForm product={editingProduct.item} catalog={catalog} storeId={store.id} onClose={() => setEditingProduct(null)} />}
      {editingGroup && <VariantGroupForm group={editingGroup.item} storeId={store.id} onClose={() => setEditingGroup(null)} />}
    </section>
  );
}

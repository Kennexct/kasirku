import { Check, ImagePlus, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ProductThumb } from '../../components/ui/ProductThumb';
import { RupiahInput } from '../../components/ui/RupiahInput';
import { Sheet } from '../../components/ui/Sheet';
import { formatRupiah } from '../../lib/money';
import { btnGhost, btnPrimary, btnSecondary, helperText, inputBase, labelBase, option, sectionTitle } from '../../components/ui/styles';
import { Switch } from '../../components/ui/Switch';
import type { Catalog } from '../../hooks/useCatalog';
import { compressProductPhoto } from '../../lib/image';
import { createCategory, newMeta, saveProduct } from '../../services/catalog';
import type { Id, Product } from '../../types';
import { t } from '../../i18n';

interface ProductFormProps {
  product: Product | null;
  catalog: Catalog;
  storeId: Id;
  onClose: () => void;
}

const newProduct = (storeId: Id, sortOrder: number): Product => ({
  ...newMeta(storeId),
  categoryId: null,
  name: '',
  basePrice: 0,
  isActive: true,
  sortOrder,
  variantGroupIds: [],
  modePrices: {},
});

/** M2 + M3: product with category, base price, per-mode prices, variant groups and photo. */
export function ProductForm({ product, catalog, storeId, onClose }: ProductFormProps) {
  const [draft, setDraft] = useState<Product>(() => product ?? newProduct(storeId, catalog.products.length));
  const [newCategory, setNewCategory] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<Product>) => setDraft((prev) => ({ ...prev, ...patch }));

  const setModePrice = (modeId: Id, price: number | null) =>
    setDraft((prev) => {
      const { [modeId]: _removed, ...rest } = prev.modePrices;
      return { ...prev, modePrices: price === null ? rest : { ...rest, [modeId]: price } };
    });

  const toggleGroup = (groupId: Id) =>
    setDraft((prev) => ({
      ...prev,
      variantGroupIds: prev.variantGroupIds.includes(groupId)
        ? prev.variantGroupIds.filter((id) => id !== groupId)
        : [...prev.variantGroupIds, groupId],
    }));

  const handlePhoto = async (file: File | undefined) => {
    if (!file) return;
    const result = await compressProductPhoto(file);
    if (result.ok) update({ photoUrl: result.value });
    else toast.error(result.error);
  };

  const handleAddCategory = async () => {
    if (newCategory === null) return;
    try {
      const category = await createCategory(newCategory, storeId, catalog.categories.length);
      update({ categoryId: category.id });
      setNewCategory(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Gagal menambah kategori.'));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveProduct(draft);
      toast.success(t('{0} disimpan', draft.name.trim()));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Gagal menyimpan produk.'));
    } finally {
      setIsSaving(false);
    }
  };

  const priceModes = catalog.salesModes.filter((m) => m.priceRule === 'mode_price');
  const markupModes = catalog.salesModes.filter((m) => m.priceRule === 'markup');

  return (
    <Sheet
      title={product ? t('Ubah produk') : t('Produk baru')}
      subtitle={product ? product.name : t('Tambahkan menu ke kasir')}
      isOpen
      isWide
      onClose={onClose}
      footer={
        <button type="button" disabled={isSaving} onClick={() => void handleSave()} className={`${btnPrimary} w-full`}>
          {isSaving ? t('Menyimpan…') : t('Simpan produk')}
        </button>
      }
    >
      <div className="grid gap-6 md:grid-cols-[168px_1fr]">
        <div className="flex flex-row items-center gap-3 md:flex-col md:items-stretch">
          <ProductThumb name={draft.name || '?'} photoUrl={draft.photoUrl} className="h-28 w-28 shrink-0 rounded-lg border border-line md:h-[168px] md:w-full" />
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => void handlePhoto(e.target.files?.[0])} />
          <div className="flex flex-1 flex-col gap-1">
            <button type="button" onClick={() => fileInput.current?.click()} className={`${btnSecondary} h-11 w-full text-[14px]`}>
              <ImagePlus aria-hidden size={18} /> {draft.photoUrl ? t('Ganti foto') : t('Unggah foto')}
            </button>
            {draft.photoUrl ? (
              <button type="button" onClick={() => update({ photoUrl: undefined })} className={`${btnGhost} h-10 text-[13px] text-danger-700!`}>
                {t('Hapus foto')}
              </button>
            ) : (
              <p className="text-center text-[12px] text-muted">{t('JPG/PNG, otomatis dikompres')}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <label htmlFor="product-name" className={labelBase}>{t('Nama produk')}</label>
            <input id="product-name" value={draft.name} maxLength={80} onChange={(e) => update({ name: e.target.value })} placeholder={t('Contoh: Bakso Urat')} className={inputBase} />
          </div>

          <fieldset>
            <legend className={labelBase}>{t('Kategori')}</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => update({ categoryId: null })} className={option(draft.categoryId === null)}>{t('Tanpa kategori')}</button>
              {catalog.categories.map((c) => (
                <button key={c.id} type="button" onClick={() => update({ categoryId: c.id })} className={option(draft.categoryId === c.id)}>{c.name}</button>
              ))}
              {newCategory === null && (
                <button type="button" onClick={() => setNewCategory('')} className={`${option(false)} border-dashed`}>
                  <Plus aria-hidden size={16} /> {t('Kategori baru')}
                </button>
              )}
            </div>
            {newCategory !== null && (
              <div className="mt-2 flex gap-2">
                <input autoFocus aria-label={t('Nama kategori baru')} value={newCategory} placeholder={t('Nama kategori')} onChange={(e) => setNewCategory(e.target.value)} className={inputBase} />
                <button type="button" onClick={() => void handleAddCategory()} className={btnPrimary}>{t('Tambah')}</button>
              </div>
            )}
          </fieldset>

          <fieldset className="rounded-lg border border-line p-4">
            <legend className={`${sectionTitle} px-1`}>{t('Harga')}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="base-price" className={labelBase}>{t('Harga dasar (Dine In)')}</label>
                <RupiahInput id="base-price" value={draft.basePrice} onChange={(v) => update({ basePrice: v ?? 0 })} />
              </div>
              {priceModes.map((mode) => (
                <div key={mode.id}>
                  <label htmlFor={`price-${mode.id}`} className={labelBase}>{t('Harga')} {mode.name}</label>
                  <RupiahInput id={`price-${mode.id}`} value={draft.modePrices[mode.id] ?? null} onChange={(v) => setModePrice(mode.id, v)} placeholder={t('Ikut harga dasar')} />
                </div>
              ))}
              <div>
                <label htmlFor="cost-price" className={labelBase}>{t('Harga modal')} <span className="font-normal text-muted">{t('(opsional)')}</span></label>
                <RupiahInput
                  id="cost-price"
                  value={draft.costPrice ?? null}
                  onChange={(v) => update({ costPrice: v ?? undefined })}
                  placeholder={t('Belum diisi')}
                />
                <p className={helperText}>
                  {draft.costPrice !== undefined && draft.basePrice > 0
                    ? t('Untung per porsi {0} (harga dasar).', formatRupiah(draft.basePrice - draft.costPrice))
                    : t('Biaya membuat satu porsi. Dipakai untuk menghitung laba di Laporan.')}
                </p>
              </div>
            </div>
            {markupModes.length > 0 && (
              <p className={helperText}>{markupModes.map((m) => t('{0}: otomatis +{1}% dari harga dasar', m.name, m.markupPct)).join(' · ')}</p>
            )}
          </fieldset>

          <fieldset>
            <legend className={labelBase}>{t('Varian')}</legend>
            {catalog.variantGroups.length === 0 ? (
              <p className="text-[14px] text-muted">{t('Belum ada grup varian. Buat di tab Varian.')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {catalog.variantGroups.map((g) => {
                  const isOn = draft.variantGroupIds.includes(g.id);
                  return (
                    <button key={g.id} type="button" aria-pressed={isOn} onClick={() => toggleGroup(g.id)} className={option(isOn)}>
                      {isOn && <Check aria-hidden size={16} />} {g.name}
                    </button>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="border-t border-line pt-2">
            <Switch
              checked={draft.isActive}
              onChange={(isActive) => update({ isActive })}
              label={t('Tampilkan di kasir')}
              description={t('Produk nonaktif disembunyikan dari kasir, tetapi tetap ada di riwayat.')}
            />
            {draft.isActive && (
              <Switch
                checked={draft.isSoldOut === true}
                onChange={(isSoldOut) => update({ isSoldOut })}
                label={t('Sedang habis')}
                description={t('Tetap terlihat di kasir dengan tanda Habis, tetapi tidak bisa dijual. Kasir juga bisa mengubahnya.')}
              />
            )}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

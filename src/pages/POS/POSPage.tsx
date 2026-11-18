import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ReceiptSheet } from '../../components/Receipt/ReceiptSheet';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Sheet } from '../../components/ui/Sheet';
import { SearchInput } from '../../components/ui/SearchInput';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Tabs } from '../../components/ui/Tabs';
import { useAppData } from '../../hooks/useAppData';
import { formatRupiah } from '../../lib/money';
import { calculateTotals, resolveModePrice, unitPriceWithOptions } from '../../lib/pricing';
import { uuidv7 } from '../../lib/id';
import { writeAudit } from '../../services/audit';
import { completeOrder, saveOpenOrder, type PaymentInput } from '../../services/orders';
import { requestOwnerApproval } from '../../store/usePinPromptStore';
import { useCartStore } from '../../store/useCartStore';
import type { AppliedDiscount, Id, Order, Product, SalesMode } from '../../types';
import { CartPanel } from './components/CartPanel';
import { DiscountSheet } from './components/DiscountSheet';
import { PaymentSheet } from './components/PaymentSheet';
import { ProductGrid } from './components/ProductGrid';
import { SaveOrderSheet } from './components/SaveOrderSheet';
import { VariantSheet } from './components/VariantSheet';

type Panel = 'none' | 'cart' | 'discount' | 'payment' | 'save';
const ALL_CATEGORIES = 'all';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Terjadi kesalahan.');

export function POSPage() {
  const { store, catalog, cashierId, cashierName, hasOwnerPowers } = useAppData();
  const cart = useCartStore();
  const [panel, setPanel] = useState<Panel>('none');
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [categoryId, setCategoryId] = useState<Id>(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeModes = useMemo(() => catalog?.salesModes.filter((m) => m.isActive) ?? [], [catalog]);
  const mode: SalesMode | undefined =
    activeModes.find((m) => m.id === cart.salesModeId) ?? activeModes.find((m) => m.isDefault) ?? activeModes[0];

  const modeId = mode?.id;
  const { salesModeId, setSalesMode } = cart;
  useEffect(() => {
    if (modeId && salesModeId !== modeId) setSalesMode(modeId);
  }, [modeId, salesModeId, setSalesMode]);

  const productsById = useMemo(() => new Map(catalog?.products.map((p) => [p.id, p]) ?? []), [catalog]);
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (catalog?.products ?? []).filter(
      (p) =>
        p.isActive &&
        (categoryId === ALL_CATEGORIES || p.categoryId === categoryId) &&
        (query === '' || p.name.toLowerCase().includes(query)),
    );
  }, [catalog, categoryId, search]);
  const qtyByProduct = useMemo(() => {
    const map = new Map<Id, number>();
    cart.items.forEach((item) => map.set(item.productId, (map.get(item.productId) ?? 0) + item.qty));
    return map;
  }, [cart.items]);
  const totals = useMemo(
    () => calculateTotals(cart.items, cart.orderDiscount, store ?? { taxPct: 0, servicePct: 0, isTaxInclusive: false }),
    [cart.items, cart.orderDiscount, store],
  );

  if (!store || !catalog) return <LoadingScreen />;
  if (!mode) return <LoadingScreen message="Aktifkan minimal satu mode penjualan di Pengaturan." />;

  const groupsFor = (product: Product) =>
    product.variantGroupIds.flatMap((id) => catalog.variantGroups.filter((g) => g.id === id));

  const handleSelectProduct = (product: Product) => {
    if (groupsFor(product).length > 0) {
      setVariantProduct(product);
      return;
    }
    cart.addItem({ productId: product.id, name: product.name, unitPrice: resolveModePrice(product, mode), options: [] });
  };

  const handleModeChange = (next: SalesMode) => {
    cart.setSalesMode(next.id);
    cart.repriceItems((item) => {
      const product = productsById.get(item.productId);
      return product ? unitPriceWithOptions(resolveModePrice(product, next), item.options) : item.unitPrice;
    });
  };

  const snapshot = () => {
    const { openOrderId, items, orderDiscount, customerId, label } = useCartStore.getState();
    return { openOrderId, items, orderDiscount, customerId, label };
  };
  const ctx = { store, salesMode: mode, cashierId };

  const handlePay = async (payment: PaymentInput) => {
    setIsSubmitting(true);
    try {
      const order = await completeOrder(snapshot(), ctx, payment);
      cart.clear();
      setPanel('none');
      if (store.settings.shouldAutoShowReceipt) setReceiptOrder(order);
      else toast.success(`Lunas • ${order.receiptNo}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async (label: string) => {
    setIsSubmitting(true);
    try {
      const order = await saveOpenOrder({ ...snapshot(), label }, ctx);
      cart.clear();
      setPanel('none');
      toast.success(`Pesanan "${order.label}" disimpan`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  /** An owner-approved over-limit discount is written to the audit log before it is applied. */
  const handleApplyDiscount = async (discount: AppliedDiscount | null) => {
    try {
      if (discount?.approvedById) {
        await writeAudit({
          storeId: store.id,
          actorId: cashierId,
          entity: 'discount',
          entityId: cart.openOrderId ?? uuidv7(),
          action: 'discount_override',
          payload: { approvedById: discount.approvedById, name: discount.name, type: discount.type, value: discount.value, baseAmount: totals.subtotal - totals.itemDiscountTotal },
        });
      }
      cart.setOrderDiscount(discount);
      setPanel('none');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.qty, 0);
  const cartPanel = (
    <CartPanel
      totals={totals}
      modeName={mode.name}
      onOpenDiscount={() => setPanel('discount')}
      onSave={() => setPanel('save')}
      onPay={() => setPanel('payment')}
    />
  );

  return (
    <div className="flex min-h-0 flex-1">
      <section aria-label="Produk" className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 border-b border-line bg-surface px-3 pt-3 md:px-5 md:pt-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Cari menu…" label="Cari produk" />
            <SegmentedControl
              label="Mode penjualan"
              options={activeModes.map((m) => ({ value: m.id, label: m.name }))}
              value={mode.id}
              onChange={(id) => {
                const next = activeModes.find((m) => m.id === id);
                if (next) handleModeChange(next);
              }}
            />
          </div>
          <Tabs
            label="Kategori"
            value={categoryId}
            onChange={setCategoryId}
            items={[{ value: ALL_CATEGORIES, label: 'Semua' }, ...catalog.categories.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 md:p-5">
          <ProductGrid products={visibleProducts} salesMode={mode} qtyByProduct={qtyByProduct} onSelect={handleSelectProduct} />
        </div>
      </section>

      <aside aria-label="Keranjang" className="hidden w-[38%] min-w-[340px] max-w-[420px] border-l border-line md:flex md:flex-col">
        {cartPanel}
      </aside>

      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 px-3 pb-2 md:hidden">
          <button
            type="button"
            onClick={() => setPanel('cart')}
            className="animate-sheet flex h-14 w-full items-center gap-3 rounded-xl bg-ink px-4 text-white shadow-pop active:translate-y-px"
          >
            <span className="num flex h-7 min-w-7 items-center justify-center rounded-md bg-brand-500 px-1.5 text-[13px] font-bold">{itemCount}</span>
            <span className="text-[15px] font-semibold">Lihat pesanan</span>
            <span className="num ml-auto text-[16px] font-bold">{formatRupiah(totals.grandTotal)}</span>
          </button>
        </div>
      )}

      <Sheet title={cart.openOrderId ? cart.label : 'Pesanan baru'} isOpen={panel === 'cart'} onClose={() => setPanel('none')} isFlush>
        <CartPanel
          totals={totals}
          modeName={mode.name}
          hasTitle={false}
          onOpenDiscount={() => setPanel('discount')}
          onSave={() => setPanel('save')}
          onPay={() => setPanel('payment')}
        />
      </Sheet>

      {variantProduct && (
        <VariantSheet
          product={variantProduct}
          groups={groupsFor(variantProduct)}
          modePrice={resolveModePrice(variantProduct, mode)}
          onClose={() => setVariantProduct(null)}
          onConfirm={(options, unitPrice) => {
            cart.addItem({ productId: variantProduct.id, name: variantProduct.name, unitPrice, options });
            setVariantProduct(null);
          }}
        />
      )}
      {panel === 'discount' && (
        <DiscountSheet
          presets={catalog.discounts.filter((d) => d.isActive && d.scope === 'order')}
          current={cart.orderDiscount}
          maxPercent={hasOwnerPowers ? null : store.settings.cashierMaxDiscountPct}
          baseAmount={totals.subtotal - totals.itemDiscountTotal}
          onRequestOverride={async () => (await requestOwnerApproval('Diskon di atas batas kasir'))?.ownerId ?? null}
          onApply={(discount) => void handleApplyDiscount(discount)}
          onClose={() => setPanel('none')}
        />
      )}
      {panel === 'payment' && (
        <PaymentSheet
          total={totals.grandTotal}
          methods={catalog.paymentMethods}
          storeName={store.name}
          isSubmitting={isSubmitting}
          onConfirm={(payment) => void handlePay(payment)}
          onClose={() => setPanel('none')}
        />
      )}
      {panel === 'save' && (
        <SaveOrderSheet initialLabel={cart.label} isSubmitting={isSubmitting} onSave={(label) => void handleSave(label)} onClose={() => setPanel('none')} />
      )}
      {receiptOrder && (
        <ReceiptSheet order={receiptOrder} store={store} cashierName={cashierName} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  );
}

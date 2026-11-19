import { PackageX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ReceiptSheet } from '../../components/Receipt/ReceiptSheet';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { Sheet } from '../../components/ui/Sheet';
import { SearchInput } from '../../components/ui/SearchInput';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { btnIcon } from '../../components/ui/styles';
import { Tabs } from '../../components/ui/Tabs';
import { useAppData } from '../../hooks/useAppData';
import { useCustomer } from '../../hooks/useCustomers';
import { formatRupiah } from '../../lib/money';
import { calculateTotals, resolveModePrice, unitPriceWithOptions } from '../../lib/pricing';
import { uuidv7 } from '../../lib/id';
import { writeAudit } from '../../services/audit';
import { completeOrder, saveOpenOrder, type PaymentInput } from '../../services/orders';
import { requestOwnerApproval } from '../../store/usePinPromptStore';
import { useCartStore } from '../../store/useCartStore';
import type { AppliedDiscount, Id, Order, Product, SalesMode } from '../../types';
import { CartPanel } from './components/CartPanel';
import { CustomerPicker } from './components/CustomerPicker';
import { DiscountSheet } from './components/DiscountSheet';
import { PaymentSheet } from './components/PaymentSheet';
import { ProductGrid } from './components/ProductGrid';
import { SaveOrderSheet } from './components/SaveOrderSheet';
import { SoldOutSheet } from './components/SoldOutSheet';
import { VariantSheet } from './components/VariantSheet';

type Panel = 'none' | 'cart' | 'discount' | 'customer' | 'payment' | 'save' | 'soldOut';
const ALL_CATEGORIES = 'all';

const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : 'Terjadi kesalahan.');

export function POSPage() {
  const { store, catalog, cashierId, cashierName, hasOwnerPowers } = useAppData();
  const cart = useCartStore();
  const [panel, setPanel] = useState<Panel>('none');
  /** Phone: discount/customer sheets opened from the cart sheet return to it when they close. */
  const [isFromCart, setIsFromCart] = useState(false);
  const customer = useCustomer(cart.customerId);
  const customerName = customer && !customer.deletedAt ? customer.name : null;
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [categoryId, setCategoryId] = useState<Id>(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeModes = useMemo(() => catalog?.salesModes.filter((m) => m.isActive) ?? [], [catalog]);
  const mode: SalesMode | undefined =
    activeModes.find((m) => m.id === cart.salesModeId) ?? activeModes.find((m) => m.isDefault) ?? activeModes[0];

  const productsById = useMemo(() => new Map(catalog?.products.map((p) => [p.id, p]) ?? []), [catalog]);

  /**
   * The cart's mode can vanish (hidden or deleted in Settings). Fall back to the default and, for a cart that is
   * not a saved order, re-price it — a saved order keeps the prices the customer was told.
   */
  const { salesModeId, setSalesMode, repriceItems, openOrderId } = cart;
  useEffect(() => {
    if (!mode || salesModeId === mode.id) return;
    setSalesMode(mode.id);
    if (salesModeId === null || openOrderId) return;
    repriceItems((item) => {
      const product = productsById.get(item.productId);
      return product ? unitPriceWithOptions(resolveModePrice(product, mode), item.options) : item.unitPrice;
    });
  }, [mode, salesModeId, setSalesMode, repriceItems, openOrderId, productsById]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (catalog?.products ?? []).filter(
      (p) =>
        p.isActive &&
        (categoryId === ALL_CATEGORIES || p.categoryId === categoryId) &&
        (query === '' || p.name.toLowerCase().includes(query)),
    );
  }, [catalog, categoryId, search]);
  const sellableProducts = useMemo(() => catalog?.products.filter((p) => p.isActive) ?? [], [catalog]);
  const soldOutCount = sellableProducts.filter((p) => p.isSoldOut).length;
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
    if (product.isSoldOut) {
      setPanel('soldOut');
      return;
    }
    if (groupsFor(product).length > 0) {
      setVariantProduct(product);
      return;
    }
    cart.addItem({ productId: product.id, name: product.name, unitPrice: resolveModePrice(product, mode), unitCost: product.costPrice, options: [] });
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
      closeSub();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.qty, 0);
  const openSub = (next: 'discount' | 'customer') => {
    setIsFromCart(panel === 'cart');
    setPanel(next);
  };
  const closeSub = () => setPanel(isFromCart ? 'cart' : 'none');

  const cartPanel = (
    <CartPanel
      totals={totals}
      modeName={mode.name}
      customerName={customerName}
      onOpenCustomer={() => openSub('customer')}
      onOpenDiscount={() => openSub('discount')}
      onSave={() => setPanel('save')}
      onPay={() => setPanel('payment')}
    />
  );

  return (
    <div className="flex min-h-0 flex-1">
      <section aria-label="Produk" className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-col gap-3 border-b border-line bg-surface px-3 pt-3 md:px-5 md:pt-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <div className="flex min-w-0 flex-1 gap-2">
              <SearchInput value={search} onChange={setSearch} placeholder="Cari menu…" label="Cari produk" />
              <button type="button" aria-label="Tandai stok habis" title="Tandai stok habis" onClick={() => setPanel('soldOut')} className={`${btnIcon} relative`}>
                <PackageX aria-hidden size={20} />
                {soldOutCount > 0 && (
                  <span className="num absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-md bg-ink px-1 text-[11px] font-bold text-white">
                    {soldOutCount}
                  </span>
                )}
              </button>
            </div>
            <div className="-mx-3 min-w-0 overflow-x-auto px-3 [scrollbar-width:none] md:mx-0 md:max-w-[55%] md:px-0">
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
          customerName={customerName}
          onOpenCustomer={() => openSub('customer')}
          onOpenDiscount={() => openSub('discount')}
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
            cart.addItem({ productId: variantProduct.id, name: variantProduct.name, unitPrice, unitCost: variantProduct.costPrice, options });
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
          onClose={closeSub}
        />
      )}
      {panel === 'customer' && (
        <CustomerPicker
          storeId={store.id}
          selectedId={customerName ? cart.customerId : null}
          onSelect={(picked) => {
            cart.setCustomer(picked?.id ?? null);
            closeSub();
          }}
          onClose={closeSub}
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
      {panel === 'soldOut' && <SoldOutSheet products={sellableProducts} onClose={() => setPanel('none')} />}
      {panel === 'save' && (
        <SaveOrderSheet initialLabel={cart.label} isSubmitting={isSubmitting} onSave={(label) => void handleSave(label)} onClose={() => setPanel('none')} />
      )}
      {receiptOrder && (
        <ReceiptSheet order={receiptOrder} store={store} cashierName={cashierName} onClose={() => setReceiptOrder(null)} />
      )}
    </div>
  );
}

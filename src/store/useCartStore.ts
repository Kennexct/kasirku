import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { uuidv7 } from '../lib/id';
import type { AppliedDiscount, Id, Order, OrderItem, SelectedOption } from '../types';

interface AddItemInput {
  productId: Id;
  name: string;
  unitPrice: number;
  options: SelectedOption[];
}

interface CartState {
  salesModeId: Id | null;
  customerId: Id | null;
  /** Set when editing a saved open order (bayar nanti). */
  openOrderId: Id | null;
  label: string;
  items: OrderItem[];
  orderDiscount: AppliedDiscount | null;
  addItem: (input: AddItemInput) => void;
  setQty: (itemId: Id, qty: number) => void;
  removeItem: (itemId: Id) => void;
  setItemNote: (itemId: Id, note: string) => void;
  setItemDiscount: (itemId: Id, discount: AppliedDiscount | null) => void;
  setOrderDiscount: (discount: AppliedDiscount | null) => void;
  setSalesMode: (salesModeId: Id) => void;
  setCustomer: (customerId: Id | null) => void;
  setLabel: (label: string) => void;
  /** Re-price every line, e.g. after switching Dine In -> Takeaway. */
  repriceItems: (priceFor: (item: OrderItem) => number) => void;
  /** Resume a saved open order (M8). */
  loadOrder: (order: Order) => void;
  clear: () => void;
}

const sameOptions = (a: readonly SelectedOption[], b: readonly SelectedOption[]): boolean =>
  a.length === b.length && a.every((opt, i) => opt.optionId === b[i]?.optionId);

const EMPTY_CART = {
  customerId: null,
  openOrderId: null,
  label: '',
  items: [],
  orderDiscount: null,
} as const satisfies Partial<CartState>;

/**
 * Cart is persisted to localStorage so a reload or crash mid-order loses nothing (PRD M1 AC).
 * All updates are immutable.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      salesModeId: null,
      ...EMPTY_CART,
      items: [],

      addItem: ({ productId, name, unitPrice, options }) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === productId && sameOptions(item.options, options) && item.note === '',
          );
          if (existing) {
            return {
              items: state.items.map((item) => (item.id === existing.id ? { ...item, qty: item.qty + 1 } : item)),
            };
          }
          const newItem: OrderItem = {
            id: uuidv7(),
            productId,
            nameSnapshot: name,
            unitPrice,
            qty: 1,
            options,
            discount: null,
            note: '',
          };
          return { items: [...state.items, newItem] };
        }),

      setQty: (itemId, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((item) => item.id !== itemId)
              : state.items.map((item) => (item.id === itemId ? { ...item, qty } : item)),
        })),

      removeItem: (itemId) => set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),

      setItemNote: (itemId, note) =>
        set((state) => ({ items: state.items.map((item) => (item.id === itemId ? { ...item, note } : item)) })),

      setItemDiscount: (itemId, discount) =>
        set((state) => ({ items: state.items.map((item) => (item.id === itemId ? { ...item, discount } : item)) })),

      setOrderDiscount: (orderDiscount) => set({ orderDiscount }),
      setSalesMode: (salesModeId) => set({ salesModeId }),
      setCustomer: (customerId) => set({ customerId }),
      setLabel: (label) => set({ label }),
      repriceItems: (priceFor) =>
        set((state) => ({ items: state.items.map((item) => ({ ...item, unitPrice: priceFor(item) })) })),
      loadOrder: (order) =>
        set({
          openOrderId: order.id,
          salesModeId: order.salesModeId,
          customerId: order.customerId,
          label: order.label,
          items: order.items,
          orderDiscount: order.orderDiscount,
        }),
      clear: () => set({ ...EMPTY_CART, items: [] }),
    }),
    { name: 'kasirku-cart', storage: createJSONStorage(() => localStorage) },
  ),
);

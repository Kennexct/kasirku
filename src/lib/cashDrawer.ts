import type { ClosingMethodTotal, DayClosing, Expense, Id, Order, Refund } from '../types';
import { formatRupiah } from './money';
import { isCountedSale, summarize } from './reports';

/**
 * Drawer maths for one business day (ADR-007). Used by the live Kas screen AND stored by "Tutup kasir",
 * so what the seller saw is what gets recorded.
 */
export interface DrawerInput {
  openingCash: number;
  /** Orders whose sale business date is the day (any status except open). */
  sales: readonly Order[];
  /** Refund/void records made on the day. */
  refunds: readonly Refund[];
  /** Must contain the original order of every refund. */
  ordersById: ReadonlyMap<Id, Order>;
  /** Live expenses of the day. */
  expenses: readonly Expense[];
  /** Saved orders nobody has paid yet (any day). */
  openOrders: readonly Order[];
}

export type Drawer = Pick<
  DayClosing,
  | 'openingCash'
  | 'cashSales'
  | 'cashRefunds'
  | 'drawerExpenses'
  | 'expectedCash'
  | 'netSales'
  | 'transactions'
  | 'expensesTotal'
  | 'byMethod'
  | 'openOrderCount'
  | 'openOrderAmount'
>;

export function buildDrawer(input: DrawerInput): Drawer {
  const counted = input.sales.filter(isCountedSale);
  const summary = summarize(input.sales, input.refunds);
  const methods = new Map<Id, ClosingMethodTotal>();
  const addTo = (key: Id, name: string, type: ClosingMethodTotal['type'], amount: number) => {
    const row = methods.get(key) ?? { name, type, amount: 0 };
    methods.set(key, { ...row, amount: row.amount + amount });
  };

  let cashSales = 0;
  for (const order of counted) {
    for (const payment of order.payments) {
      addTo(payment.paymentMethodId, payment.methodNameSnapshot, payment.methodType, payment.amount);
      if (payment.methodType === 'cash') cashSales += payment.amount;
    }
  }

  // A refund goes back the way the sale was paid.
  let cashRefunds = 0;
  for (const refund of input.refunds) {
    if (refund.kind !== 'refund') continue;
    const paidWith = input.ordersById.get(refund.orderId)?.payments[0];
    if (!paidWith) continue;
    addTo(paidWith.paymentMethodId, paidWith.methodNameSnapshot, paidWith.methodType, -refund.amount);
    if (paidWith.methodType === 'cash') cashRefunds += refund.amount;
  }

  const expenses = input.expenses.filter((e) => !e.deletedAt);
  const drawerExpenses = expenses.filter((e) => e.isFromDrawer).reduce((sum, e) => sum + e.amount, 0);

  return {
    openingCash: input.openingCash,
    cashSales,
    cashRefunds,
    drawerExpenses,
    expectedCash: input.openingCash + cashSales - cashRefunds - drawerExpenses,
    netSales: summary.netSales,
    transactions: summary.transactions,
    expensesTotal: expenses.reduce((sum, e) => sum + e.amount, 0),
    byMethod: [...methods.values()].sort((a, b) => b.amount - a.amount),
    openOrderCount: input.openOrders.length,
    openOrderAmount: input.openOrders.reduce((sum, o) => sum + o.totals.grandTotal, 0),
  };
}

/** "pas" / "lebih Rp…" / "kurang Rp…" */
export function describeDifference(difference: number): string {
  if (difference === 0) return 'pas';
  return `${difference > 0 ? 'lebih' : 'kurang'} ${formatRupiah(Math.abs(difference))}`;
}

/** True when the day changed after it was closed (late sale, refund or expense). */
export function isClosingStale(closing: DayClosing, live: Drawer): boolean {
  return (
    closing.cashSales !== live.cashSales ||
    closing.cashRefunds !== live.cashRefunds ||
    closing.drawerExpenses !== live.drawerExpenses ||
    closing.netSales !== live.netSales ||
    closing.expensesTotal !== live.expensesTotal
  );
}

/** Plain-text closing summary for WhatsApp. Pure, so the wording is tested. */
export function buildClosingText(input: { storeName: string; closing: DayClosing; closedByName: string; timeZone: string }): string {
  const { closing } = input;
  const day = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${closing.businessDate}T00:00:00Z`),
  );
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: input.timeZone }).format(new Date(closing.closedAt));
  const minus = (amount: number) => (amount === 0 ? formatRupiah(0) : `-${formatRupiah(amount)}`);

  return [
    `Tutup kasir ${input.storeName}`,
    `${day}, ditutup ${time} oleh ${input.closedByName}`,
    '',
    `Penjualan bersih: ${formatRupiah(closing.netSales)} (${closing.transactions} transaksi)`,
    ...closing.byMethod.map((m) => `- ${m.name}: ${formatRupiah(m.amount)}`),
    `Pengeluaran: ${formatRupiah(closing.expensesTotal)}`,
    '',
    'Kas laci',
    `Modal awal: ${formatRupiah(closing.openingCash)}`,
    `Penjualan tunai: ${formatRupiah(closing.cashSales)}`,
    `Refund tunai: ${minus(closing.cashRefunds)}`,
    `Pengeluaran dari laci: ${minus(closing.drawerExpenses)}`,
    `Seharusnya: ${formatRupiah(closing.expectedCash)}`,
    `Dihitung: ${formatRupiah(closing.countedCash)}`,
    `Selisih: ${describeDifference(closing.difference)}`,
    ...(closing.openOrderCount > 0 ? ['', `Belum dibayar: ${closing.openOrderCount} pesanan (${formatRupiah(closing.openOrderAmount)})`] : []),
    ...(closing.note ? ['', `Catatan: ${closing.note}`] : []),
  ].join('\n');
}

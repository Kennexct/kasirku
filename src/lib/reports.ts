import type { BusinessDate, Id, Order, Refund, SaleUnit, Store } from '../types';
import { datesInRange, type DateRange } from './dateRange';
import { lineTotal } from './pricing';
import { t } from '../i18n';
import { countUnits, roundQuantity } from './quantity';

/**
 * The ONLY place report metrics are defined (spec: .10x/specs/2026-11-18-reports-export-design.md).
 * Cash basis (ADR-002): refunds count on their own business day, attributed to the original order's
 * payment method, sales mode and cashier.
 */
export interface ReportInput {
  store: Pick<Store, 'timezone'>;
  range: DateRange;
  /** Orders whose SALE business date is in range (any status except open). */
  sales: readonly Order[];
  /** Refund/void records whose REFUND business date is in range. */
  refunds: readonly Refund[];
  /** Must contain the original order of every refund. */
  ordersById: ReadonlyMap<Id, Order>;
  memberName: ReadonlyMap<Id, string>;
}

export interface ReportSummary {
  grossSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
  transactions: number;
  averageTicket: number;
  itemsSold: number;
  voidCount: number;
  voidAmount: number;
  serviceTotal: number;
  taxTotal: number;
}

export interface BreakdownRow {
  key: string;
  label: string;
  transactions: number;
  gross: number;
  refunds: number;
  net: number;
}

export interface HourRow { hour: number; transactions: number; gross: number }
export interface DayRow { date: BusinessDate; transactions: number; gross: number; refunds: number; net: number }
/** One row per product, or per product variant (ADR-012): `key` is `productId` or `productId:variantId`. */
export interface ProductRow { key: string; productId: Id; variantId?: Id; name: string; qty: number; revenue: number; unit?: SaleUnit }

export interface Report {
  range: DateRange;
  summary: ReportSummary;
  byPaymentMethod: BreakdownRow[];
  bySalesMode: BreakdownRow[];
  byCashier: BreakdownRow[];
  byHour: HourRow[];
  byDay: DayRow[];
  /** All products, revenue desc — UI shows the top N. */
  products: ProductRow[];
}

const COUNTED: ReadonlySet<Order['status']> = new Set(['paid', 'partial_refund', 'refunded']);
const UNKNOWN = { key: 'unknown', label: t('Tidak diketahui') } as const;
const HOURS_IN_DAY = 24;

export const isCountedSale = (order: Order): boolean => COUNTED.has(order.status);
const cashRefunds = (refunds: readonly Refund[]) => refunds.filter((r) => r.kind === 'refund');

/** KPI block — also used by History so both screens always agree. */
export function summarize(sales: readonly Order[], refunds: readonly Refund[]): ReportSummary {
  const counted = sales.filter(isCountedSale);
  const voids = sales.filter((o) => o.status === 'void');
  const sum = (orders: readonly Order[], pick: (o: Order) => number) => orders.reduce((s, o) => s + pick(o), 0);
  const grossSales = sum(counted, (o) => o.totals.grandTotal);
  const refundTotal = cashRefunds(refunds).reduce((s, r) => s + r.amount, 0);

  return {
    grossSales,
    discounts: sum(counted, (o) => o.totals.itemDiscountTotal + o.totals.orderDiscountTotal),
    refunds: refundTotal,
    netSales: grossSales - refundTotal,
    transactions: counted.length,
    averageTicket: counted.length > 0 ? Math.round(grossSales / counted.length) : 0,
    itemsSold: sum(counted, (o) => countUnits(o.items)),
    voidCount: voids.length,
    voidAmount: sum(voids, (o) => o.totals.grandTotal),
    serviceTotal: sum(counted, (o) => o.totals.serviceTotal),
    taxTotal: sum(counted, (o) => o.totals.taxTotal),
  };
}

type Dimension = (order: Order) => { key: string; label: string };

function breakdown(input: ReportInput, counted: readonly Order[], dimension: Dimension): BreakdownRow[] {
  const rows = new Map<string, BreakdownRow>();
  const row = (dim: { key: string; label: string }) => {
    const existing = rows.get(dim.key);
    if (existing) return existing;
    const created: BreakdownRow = { ...dim, transactions: 0, gross: 0, refunds: 0, net: 0 };
    rows.set(dim.key, created);
    return created;
  };

  for (const order of counted) {
    const r = row(dimension(order));
    r.transactions += 1;
    r.gross += order.totals.grandTotal;
  }
  for (const refund of cashRefunds(input.refunds)) {
    const original = input.ordersById.get(refund.orderId);
    row(original ? dimension(original) : UNKNOWN).refunds += refund.amount;
  }
  return Array.from(rows.values())
    .map((r) => ({ ...r, net: r.gross - r.refunds }))
    .sort((a, b) => b.net - a.net);
}

function hourFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone });
}

function byHour(counted: readonly Order[], timeZone: string): HourRow[] {
  const format = hourFormatter(timeZone);
  const rows: HourRow[] = Array.from({ length: HOURS_IN_DAY }, (_, hour) => ({ hour, transactions: 0, gross: 0 }));
  for (const order of counted) {
    const hour = Number(format.format(new Date(order.paidAt ?? order.openedAt)));
    const row = rows[hour % HOURS_IN_DAY];
    if (!row) continue;
    row.transactions += 1;
    row.gross += order.totals.grandTotal;
  }
  return rows;
}

function byDay(input: ReportInput, counted: readonly Order[]): DayRow[] {
  const rows = new Map(datesInRange(input.range).map((date) => [date, { date, transactions: 0, gross: 0, refunds: 0, net: 0 }]));
  for (const order of counted) {
    const row = rows.get(order.businessDate);
    if (!row) continue;
    row.transactions += 1;
    row.gross += order.totals.grandTotal;
  }
  for (const refund of cashRefunds(input.refunds)) {
    const row = rows.get(refund.businessDate);
    if (row) row.refunds += refund.amount;
  }
  return Array.from(rows.values())
    .map((r) => ({ ...r, net: r.gross - r.refunds }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function products(counted: readonly Order[]): ProductRow[] {
  const rows = new Map<Id, ProductRow>();
  for (const order of counted) {
    for (const item of order.items) {
      const key = item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
      const row: ProductRow = rows.get(key) ?? {
        key,
        productId: item.productId,
        ...(item.variantId ? { variantId: item.variantId } : {}),
        name: item.nameSnapshot,
        qty: 0,
        revenue: 0,
        ...(item.unit ? { unit: item.unit } : {}),
      };
      rows.set(key, { ...row, qty: roundQuantity(row.qty + item.qty), revenue: row.revenue + lineTotal(item) });
    }
  }
  return Array.from(rows.values()).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty);
}

export function buildReport(input: ReportInput): Report {
  const counted = input.sales.filter(isCountedSale);
  const payment: Dimension = (o) => {
    const p = o.payments[0];
    return p ? { key: p.paymentMethodId, label: p.methodNameSnapshot } : UNKNOWN;
  };
  const mode: Dimension = (o) => ({ key: o.salesModeId, label: o.salesModeNameSnapshot });
  const cashier: Dimension = (o) => ({ key: o.cashierId, label: input.memberName.get(o.cashierId) ?? UNKNOWN.label });

  return {
    range: input.range,
    summary: summarize(input.sales, input.refunds),
    byPaymentMethod: breakdown(input, counted, payment),
    bySalesMode: breakdown(input, counted, mode),
    byCashier: breakdown(input, counted, cashier),
    byHour: byHour(counted, input.store.timezone),
    byDay: byDay(input, counted),
    products: products(counted),
  };
}

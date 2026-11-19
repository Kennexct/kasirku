import type { Expense, Order } from '../types';
import { isCountedSale, type ReportSummary } from './reports';
import { t } from '../i18n';
import { countUnits } from './quantity';

/**
 * The ONLY place profit is defined (ADR-007).
 * - Sales basis = net sales − tax collected.
 * - HPP = cost snapshot × qty of every item sold; refunds do not reduce it.
 * - Cost mode (some sold item has a cost): net = sales basis − HPP − operating expenses.
 *   Ingredient purchases are NOT subtracted again — cost prices already contain them.
 * - Simple mode (no cost anywhere): balance = sales basis − all expenses.
 */
export interface ProfitInput {
  /** Orders whose sale business date is in range. */
  sales: readonly Order[];
  summary: Pick<ReportSummary, 'netSales' | 'taxTotal'>;
  /** Live (not deleted) expenses whose business date is in range. */
  expenses: readonly Expense[];
}

interface ProfitBase {
  salesBasis: number;
  taxTotal: number;
  expensesTotal: number;
}

export type Profit =
  | { mode: 'none' }
  | (ProfitBase & { mode: 'simple'; balance: number })
  | (ProfitBase & {
      mode: 'cost';
      cogs: number;
      grossProfit: number;
      /** Percent of the sales basis, one decimal; null when there were no sales. */
      marginPct: number | null;
      ingredientExpenses: number;
      operatingExpenses: number;
      netProfit: number;
      /** Units sold whose product had no cost price — their cost counts as 0. */
      uncostedQty: number;
      uncostedProducts: string[];
    });

const MAX_UNCOSTED_NAMES = 5;
const PCT_PRECISION = 10;

export function buildProfit({ sales, summary, expenses }: ProfitInput): Profit {
  let cogs = 0;
  let costedQty = 0;
  let uncostedQty = 0;
  const uncosted = new Map<string, number>();

  for (const order of sales) {
    if (!isCountedSale(order)) continue;
    for (const item of order.items) {
      const units = countUnits([item]);
      if (item.unitCost === undefined) {
        uncostedQty += units;
        uncosted.set(item.nameSnapshot, (uncosted.get(item.nameSnapshot) ?? 0) + units);
      } else {
        cogs += Math.round(item.unitCost * item.qty); // cost per kg × weight, whole Rupiah per line (ADR-011)
        costedQty += units;
      }
    }
  }

  const live = expenses.filter((e) => !e.deletedAt);
  const expensesTotal = live.reduce((sum, e) => sum + e.amount, 0);
  const salesBasis = summary.netSales - summary.taxTotal;
  const base: ProfitBase = { salesBasis, taxTotal: summary.taxTotal, expensesTotal };

  if (costedQty === 0) {
    return expensesTotal === 0 ? { mode: 'none' } : { ...base, mode: 'simple', balance: salesBasis - expensesTotal };
  }

  const ingredientExpenses = live.filter((e) => e.category === 'ingredients').reduce((sum, e) => sum + e.amount, 0);
  const operatingExpenses = expensesTotal - ingredientExpenses;
  const grossProfit = salesBasis - cogs;
  return {
    ...base,
    mode: 'cost',
    cogs,
    grossProfit,
    marginPct: salesBasis > 0 ? Math.round((grossProfit * 100 * PCT_PRECISION) / salesBasis) / PCT_PRECISION : null,
    ingredientExpenses,
    operatingExpenses,
    netProfit: grossProfit - operatingExpenses,
    uncostedQty,
    uncostedProducts: [...uncosted.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_UNCOSTED_NAMES).map(([name]) => name),
  };
}

export interface ProfitLine {
  label: string;
  /** Signed: costs and expenses are negative. */
  amount: number;
  kind: 'plain' | 'subtotal' | 'total';
}

/** The statement, top to bottom — one wording for the screen, Excel and PDF. */
export function profitLines(profit: Profit): ProfitLine[] {
  if (profit.mode === 'none') return [];
  const sales: ProfitLine = { label: profit.taxTotal > 0 ? t('Penjualan bersih (tanpa pajak)') : t('Penjualan bersih'), amount: profit.salesBasis, kind: 'plain' };
  if (profit.mode === 'simple') {
    return [sales, { label: t('Pengeluaran'), amount: -profit.expensesTotal, kind: 'plain' }, { label: t('Sisa setelah pengeluaran'), amount: profit.balance, kind: 'total' }];
  }
  return [
    sales,
    { label: t('Harga modal (HPP)'), amount: -profit.cogs, kind: 'plain' },
    { label: t('Laba kotor'), amount: profit.grossProfit, kind: 'subtotal' },
    { label: t('Biaya operasional'), amount: -profit.operatingExpenses, kind: 'plain' },
    { label: t('Laba bersih'), amount: profit.netProfit, kind: 'total' },
  ];
}

import { describe, expect, it } from 'vitest';
import type { Expense, Order, OrderItem } from '../types';
import { buildProfit } from './profit';

const item = (name: string, qty: number, unitCost?: number): OrderItem =>
  ({ nameSnapshot: name, qty, ...(unitCost !== undefined ? { unitCost } : {}) } as OrderItem);
const sale = (status: Order['status'], items: OrderItem[]): Order => ({ status, items } as Order);
const expense = (category: Expense['category'], amount: number, deletedAt?: string): Expense =>
  ({ category, amount, ...(deletedAt ? { deletedAt } : {}) } as Expense);

describe('buildProfit', () => {
  it('has nothing to say without cost prices or expenses', () => {
    expect(buildProfit({ sales: [sale('paid', [item('Bakso', 2)])], summary: { netSales: 30_000, taxTotal: 0 }, expenses: [] })).toEqual({ mode: 'none' });
  });

  it('simple mode: sales minus tax minus every expense, ingredients included', () => {
    const profit = buildProfit({
      sales: [sale('paid', [item('Bakso', 2)])],
      summary: { netSales: 110_000, taxTotal: 10_000 },
      expenses: [expense('ingredients', 40_000), expense('utilities', 5_000), expense('other', 9_000, '2026-11-19T00:00:00Z')],
    });
    expect(profit).toEqual({ mode: 'simple', salesBasis: 100_000, taxTotal: 10_000, expensesTotal: 45_000, balance: 55_000 });
  });

  it('cost mode: reconciles sales − HPP − operating expenses, and does not count ingredients twice', () => {
    const profit = buildProfit({
      sales: [
        sale('paid', [item('Bakso', 3, 9_000), item('Es Teh', 2, 1_500)]),
        sale('partial_refund', [item('Bakso', 1, 9_000), item('Kerupuk', 4)]), // refund keeps its cost
        sale('void', [item('Bakso', 10, 9_000)]), // never counted
        sale('open', [item('Bakso', 10, 9_000)]),
      ],
      summary: { netSales: 80_000, taxTotal: 0 },
      expenses: [expense('ingredients', 50_000), expense('wages', 20_000), expense('transport', 5_000)],
    });
    if (profit.mode !== 'cost') throw new Error('expected cost mode');
    expect(profit.cogs).toBe(4 * 9_000 + 2 * 1_500);
    expect(profit.grossProfit).toBe(41_000);
    expect(profit.marginPct).toBe(51.3);
    expect(profit).toMatchObject({ ingredientExpenses: 50_000, operatingExpenses: 25_000, expensesTotal: 75_000, netProfit: 16_000 });
    expect(profit.salesBasis - profit.cogs - profit.operatingExpenses).toBe(profit.netProfit);
    expect(profit).toMatchObject({ uncostedQty: 4, uncostedProducts: ['Kerupuk'] });
  });

  it('cost mode with no sales basis has no margin', () => {
    const profit = buildProfit({ sales: [sale('refunded', [item('Bakso', 1, 9_000)])], summary: { netSales: 0, taxTotal: 0 }, expenses: [] });
    expect(profit).toMatchObject({ mode: 'cost', marginPct: null, netProfit: -9_000 });
  });
});

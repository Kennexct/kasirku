import { EXPENSE_CATEGORIES, EXPENSE_NOTE_MAX, MAX_EXPENSE_AMOUNT } from '../constants';
import { localDb } from '../db/localDb';
import { nowIso } from '../lib/id';
import type { BusinessDate, Expense, ExpenseCategory, Id } from '../types';
import { writeAudit } from './audit';
import { newMeta } from './catalog';
import { saveAndQueue } from './sync';

export interface ExpenseInput {
  businessDate: BusinessDate;
  category: ExpenseCategory;
  /** Null while the amount field is empty. */
  amount: number | null;
  note: string;
  isFromDrawer: boolean;
  actorId: Id;
}

/** Record money that left the business (ADR-007). Any seller may do this. */
export async function addExpense(storeId: Id, input: ExpenseInput): Promise<Expense> {
  const { amount } = input;
  if (amount === null || !Number.isSafeInteger(amount) || amount <= 0) throw new Error('Isi jumlah pengeluaran.');
  if (amount > MAX_EXPENSE_AMOUNT) throw new Error('Jumlah terlalu besar.');
  if (!EXPENSE_CATEGORIES.includes(input.category)) throw new Error('Kategori tidak dikenal.');
  const note = input.note.trim();
  if (note.length > EXPENSE_NOTE_MAX) throw new Error(`Catatan maksimal ${EXPENSE_NOTE_MAX} karakter.`);

  const expense: Expense = {
    ...newMeta(storeId),
    businessDate: input.businessDate,
    category: input.category,
    amount,
    note,
    isFromDrawer: input.isFromDrawer,
    actorId: input.actorId,
  };
  await saveAndQueue('expenses', expense);
  return expense;
}

/** Soft delete, audited. The caller checks owner access first (ADR-004). */
export async function deleteExpense(expenseId: Id, actorId: Id, approvedById: Id | null): Promise<void> {
  const expense = await localDb.expenses.get(expenseId);
  if (!expense || expense.deletedAt) throw new Error('Pengeluaran tidak ditemukan.');
  const now = nowIso();
  await saveAndQueue('expenses', { ...expense, deletedAt: now, updatedAt: now });
  await writeAudit({
    storeId: expense.storeId,
    actorId,
    entity: 'expense',
    entityId: expense.id,
    action: 'expense_deleted',
    payload: { amount: expense.amount, category: expense.category, businessDate: expense.businessDate, approvedById },
  });
}

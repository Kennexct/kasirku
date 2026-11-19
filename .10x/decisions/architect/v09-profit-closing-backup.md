# Architect — v0.9 (profit, expenses, close of day, backup)

ADR-007, ADR-008. Spec: `specs/2026-11-19-v09-profit-closing-backup-design.md`.

## Units
| Unit | Kind | Depends on |
| --- | --- | --- |
| `lib/profit.ts` | pure: `buildProfit(sales, summary, expenses)` → cost / simple / none | `lib/reports.ts` types |
| `lib/cashDrawer.ts` | pure: `buildDrawer(...)`, `buildClosingText(...)` | reports `isCountedSale` |
| `lib/backup.ts` | pure: `parseBackup(text, currentSchema)`, `backupFileName` | — |
| `services/expenses.ts` | add / delete expense (validation, audit on delete) | sync, audit |
| `services/dayClosing.ts` | opening cash (meta), `closeDay`, `reopenDay` | cashDrawer, sync, audit, catalog |
| `services/backup.ts` | `createBackup()`, `restoreBackup(parsed)` | localDb |
| `hooks/useCash.ts` | live queries: day data, expenses in range, closings | localDb |
| `pages/Cash/` | Kas screen: Hari ini · Pengeluaran · Riwayat tutup | above |
| `pages/Reports/ProfitCard.tsx` | profit statement | profit |
| `pages/Settings/BackupSettings.tsx` | Cadangan tab | backup |

## Data
- Dexie v4: `expenses 'id, storeId, [storeId+businessDate]'`, `dayClosings 'id, storeId, [storeId+businessDate]'`. Both added to `SYNC_TABLES`.
- `Product.costPrice?`, `OrderItem.unitCost?` (inside the order JSON — no server column needed).
- Migration `20261119010000_v09_cost_expenses_closings.sql`: `products.cost_price`, `expenses`, `day_closings`, member-write RLS (cashiers record both).

## Failure modes
- Closing twice (double tap / two tabs): service checks for a live closing inside the transaction and refuses.
- Restore fails midway: single transaction → rollback, old data intact.
- Backup of a store with no closings/expenses: empty arrays, still valid.
- Expense on a closed day: allowed; closing shows "out of date" like late sales.

## Permissions
Any seller: record expense, set opening cash, close the day. Owner (or one-time owner PIN): delete expense, reopen a day. Backup/restore: Settings (owner gate).

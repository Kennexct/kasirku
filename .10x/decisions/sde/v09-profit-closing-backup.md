# SDE — v0.9 (profit, expenses, close of day, backup)

Built (T1–T7)
- Data: `Product.costPrice?`, `OrderItem.unitCost?`, `Expense`, `DayClosing`; Dexie v4 (`expenses`, `dayClosings`), both in `SYNC_TABLES`; migration `20261119010000_v09_cost_expenses_closings.sql`.
- Pure logic: `lib/profit.ts` (`buildProfit`, `profitLines`), `lib/cashDrawer.ts` (`buildDrawer`, `isClosingStale`, `describeDifference`, `buildClosingText`), `lib/backup.ts` (`parseBackup`, `backupFileName`).
- Services: `expenses.ts`, `dayClosing.ts` (opening cash, `closeDay`, `reopenDay`, `resetSoldOut`), `backup.ts` (`createBackup`, `readBackupFile`, `restoreBackup`).
- UI: `pages/Cash/` (Kas: Hari ini · Pengeluaran · Riwayat tutup; expense, close, opening-cash, reopen and delete dialogs), nav item "Kas", `pages/Reports/ProfitCard.tsx`, cost price field in the product form, `pages/Settings/BackupSettings.tsx` (tab "Cadangan").
- Export: profit statement rows in the Excel summary and PDF; "Pengeluaran" sheet when the period has expenses.
- `e2e/v09.py` (tablet + phone).

Deviations / decisions made while building
- **Behaviour change:** a saved order paid on a later day now counts on the **payment** day (was: the day it was saved). Needed for the drawer and consistent with the cash basis of ADR-002; the receipt number keeps the opening day. Affects reports/history of bon-style orders from now on; existing records are untouched.
- Restore sets "last backup" to the file's date (the file is the newest copy of what is on the device).
- Backup is download-only (no share sheet): browsers do not reliably accept JSON files for sharing.
- Reports no longer show "no sales" when the period has expenses but no sales.

Tech debt
- Options/add-ons have no cost; refunded tax stays deducted (ADR-007).
- Kas is under "Lainnya" on phones (bottom bar is full).
- Restore does not re-queue records for sync; `meta.restoredAt` marks the need (ADR-008).
- Toasts sit over the header tabs on phones for 2.5 s (app-wide, older than this release).
- No expense edit, no blind count, no bank-deposit record.

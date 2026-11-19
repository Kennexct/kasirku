# v0.9 — profit, expenses, close of day, backup file

**Date:** 2026-11-19 · **Status:** Approved in the feedback-round roadmap ("yes include it all"); detail below decided by the team · **ADRs:** 007, 008

## Why
A seller records sales but still cannot answer two questions at night: "is the money in the drawer right?" and "did I make money today?". And everything lives on one phone or tablet — if it breaks, the business records are gone.

## Scope
| Part | What the merchant gets |
| --- | --- |
| Cost price | Optional "Harga modal" per product. Each sale remembers the cost at that moment. |
| Expenses | "Catat pengeluaran": amount, category, note, paid from the drawer or not. Any seller can record; deleting needs the owner. |
| Profit | Reports show a small profit statement. Two modes, chosen automatically (see below). |
| Close of day | "Tutup kasir": opening cash + cash sales − cash refunds − drawer expenses = expected cash; seller types the counted cash; difference is recorded. Summary can be sent by WhatsApp. Sold-out flags reset. |
| Backup | Settings → Cadangan: save all device data to one file; restore replaces the device's data from a file. |

## Profit rules (single definition: `lib/profit.ts`)
- **Sales basis** = net sales (same number as the report headline) − tax collected.
- **HPP** = Σ cost snapshot × qty of items sold in the period. Options/variants carry no cost. Refunds do not reduce HPP (the food was made).
- **With cost prices** (at least one sold item has a cost): gross profit = sales basis − HPP; net profit = gross profit − operating expenses. "Belanja bahan" expenses are shown but **not** subtracted — they are already counted through cost prices. A warning shows how many sold items have no cost price.
- **Without cost prices:** balance = sales basis − all expenses ("Sisa setelah pengeluaran").
- Neither costs nor expenses → a hint card pointing to Produk and Kas.

## Close of day rules (`lib/cashDrawer.ts`, `services/dayClosing.ts`)
- One closing per business day. Any seller can close; reopening (owner only) removes the closing and is audited.
- Cash sales = cash payments of counted sales of that business day. Cash refunds = refunds made that day for orders paid in cash. Voided sales are not counted.
- Opening cash is typed on the Kas screen, kept on the device, defaults to the last closing's opening cash.
- Unpaid saved orders are shown as a warning; they do not block closing.
- Sales after closing are allowed; the screen says the closing is out of date and the owner can reopen.
- "Kemarin belum ditutup" is offered when yesterday has sales and no closing.

## Backup rules (`lib/backup.ts`, `services/backup.ts`)
- One JSON file, all tables except the sync queue and PIN lockout counters. Contains customer phone numbers and PIN hashes → the screen says to keep it private.
- Restore = replace everything, in one transaction; refuses files from another app, damaged files, and files made by a newer app version. Shows what is in the file before the destructive step and offers to save the current data first.
- Restore is for moving to / repairing a device, not for running two devices.

## Out of scope
Cost per variant option, recipe/ingredient stock, editing an expense (delete and re-add), blind cash count, cash deposits to bank, encrypted or automatic cloud backup, merging a backup into existing data.

## Success criteria
- A closing with 2 cash sales, 1 QRIS sale, 1 cash refund and 1 drawer expense shows the exact expected cash; unit-tested.
- Profit numbers reconcile to the report headline: sales basis − HPP − operating expenses = net profit; unit-tested in both modes.
- Backup → wipe → restore reproduces every table byte-for-byte (except the excluded keys); unit-tested and exercised in the browser.
- All existing browser flows still pass.

# Feedback round — approved scope and delivery plan

**Date:** 2026-11-19 · **Status:** Approved by user ("yes include it all")

| Version | Slug | Scope | Size |
| --- | --- | --- | --- |
| v0.8 | `custom-methods-modes` | Settings: add / rename / reorder / delete payment methods and sales modes; guards (default mode, last active method); POS shows them in the set order | small–medium |
| v0.8 | `sold-out` | Mark products "Habis" from the cashier screen or product form; tile disabled at POS; "tandai semua tersedia" | small |
| v0.8 | `customer-debt` | Customers → "Belum bayar": unpaid orders per customer, total owed, WhatsApp reminder | small |
| v0.9 | `profit-and-closing` | Optional cost price per product → profit in reports; expenses; close of day (opening cash, expected vs counted) | medium–large |
| v0.9 | `backup` | Save / restore a backup file of all device data | medium |
| v0.10 | `onboarding` | First-launch journey: language, store + business template, payments/QRIS, explanation cards, "Langkah awal" checklist | medium |
| v0.10 | `help-center` | Bantuan page (offline topics), contextual "?", replay intro; WhatsApp support only if a number is provided | medium |
| v0.11 | `i18n-english` | Indonesian + English: typed dictionary, per-device language, receipts/exports follow the setting; merchant data not translated | large |

Order rationale: features first, journey/help after (so they describe what exists), English last (one pass over everything).

## v0.8 design (binding)
- **Methods/modes:** names unique among active ones (case-insensitive), 1–40 chars; max 12 methods, 8 modes. Delete = soft delete; past sales keep their snapshot names. Cannot delete the default mode or the last active payment method. Reorder = move up/down; order drives POS.
- **Sold-out:** `Product.isSoldOut`; manual on/off (auto-reset arrives with close of day in v0.9). Any seller can toggle (operational, not owner-only). Items already in a saved order stay.
- **Debt:** derived from open orders that have a customer — no separate ledger, no partial payments. Reminder opens WhatsApp with a prepared message; nothing is sent automatically.

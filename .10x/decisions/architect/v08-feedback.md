# Architect — v0.8 (ADR-006)
- `services/catalog.ts`: create / rename / delete / move for payment methods and sales modes (shared uniqueness + renumber helpers).
- Settings UI: shared `ItemActions`, `NameSheet`, `components/ui/ConfirmSheet`; add-sheets per tab.
- Sold-out: `Product.isSoldOut`, `pages/POS/components/SoldOutSheet`, grid tile state, product form switch; migration `products.is_sold_out`.
- Debt: `CustomerStats.openAmount/oldestOpenAt`, `buildDebtReminder` (pure), Customers page "Belum bayar" tab, detail-sheet section.

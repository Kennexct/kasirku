# SDE — v0.8 (custom methods & modes, sold-out, customer debt)

Built
- `services/checkoutConfig.ts` (+test): create / rename / move / soft-delete for payment methods and sales modes. Names 1–40 chars, unique among live rows (case-insensitive); max 12 methods, 8 modes.
- Settings: `AddMethodSheet`, `AddModeSheet`, shared `ConfigItemSheet` (rename, position, delete with confirm), `priceRules.ts`; `components/ui/paymentIcon.ts` shared with the payment sheet.
- Sold-out: `Product.isSoldOut`, `setProductSoldOut` (+test), `pages/POS/components/SoldOutSheet.tsx`, grid tile state, switch in the product form, badge in the product list; migration `20261119000000_product_sold_out.sql`.
- Debt: `CustomerStats.openAmount / oldestOpenAt`, `buildDebtReminder` (+tests), "Belum bayar" tab (`pages/Customers/DebtList.tsx`), unpaid section + WhatsApp reminder + "Terima bayaran" in the customer sheet.
- `e2e/v08.py` (tablet + phone).

Deviations from the spec / ADR-006
- **Extra delete guard:** a sales mode that unpaid saved orders were priced with cannot be deleted (resuming them would change what the customer owes). Not in the spec; found in review.
- **Live cart follows a vanished mode:** if the cart's mode is hidden or deleted, the cart falls back to the default mode and is re-priced; a resumed saved order keeps its prices.
- **History filters** list removed methods/modes that still appear in the period, marked "(dihapus)".
- The payment type of a method is fixed after creation (delete and re-add to change it).
- The last active payment method cannot be switched off either (was possible before; left the cashier with no way to take payment).

Tech debt
- A saved order whose mode was *hidden* (not deleted) resumes under the default mode's name with its original prices.
- No audit event for sold-out toggles or for method/mode changes.
- Sold-out is manual; automatic reset arrives with close-of-day (v0.9).
- Debt has no partial payments and no due dates (ADR-006).

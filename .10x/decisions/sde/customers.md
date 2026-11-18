# SDE — customers (M7)

Built: `lib/customers.ts` (+test incl. 5 000-customer search guard), `services/customers.ts` (+test), `hooks/useCustomers.ts`, `components/Customers/CustomerFields.tsx`, `pages/Customers/{CustomersPage,CustomerFormSheet,CustomerDetailSheet}.tsx`, `pages/POS/components/CustomerPicker.tsx`; touchpoints in `services/orders.ts`, receipt view/text/sheet, open orders, history list/search, `lib/export/columns.ts` (name only), `App.tsx`; migration `20261118030000_order_customer_name.sql`; `e2e/customers.py`.

Deviations / extras: phone cart sheet now reopens after the discount or customer sheet closes (was: closed everything); `PagePlaceholder` removed (no placeholder routes left); deleting a customer asks for the owner PIN when owner mode is locked.

Tech debt: list capped at 100 rendered rows (no virtualisation); `totalSpend` is gross (refunds visible per order only); only Indonesian mobile numbers accepted; no merge of duplicate customers; foreign numbers and landlines rejected.

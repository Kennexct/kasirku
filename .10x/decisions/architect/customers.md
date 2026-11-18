# Architect — customers (ADR-005)

| Unit | Purpose |
| --- | --- |
| `lib/customers.ts` | phone normalise/format/WhatsApp number, `searchCustomers`, `customerStats` (pure) |
| `services/customers.ts` | `saveCustomer` (validation, unique phone), `deleteCustomer` (soft delete + scrub) |
| `hooks/useCustomers.ts` | live list, stats map, one customer, a customer's orders |
| `components/Customers/CustomerFields.tsx` | shared name/phone/note fields |
| `pages/Customers/*` | list + search, form sheet, detail sheet |
| `pages/POS/components/CustomerPicker.tsx` | pick or quick-add from the cart |
| Touchpoints | `services/orders.ts` (snapshot), receipt view/text/sheet, open orders, history list + search, export columns |

Data: `Order.customerNameSnapshot`; migration adds `orders.customer_name_snapshot text`. No Dexie index change (`customerId`, `phone` already indexed).

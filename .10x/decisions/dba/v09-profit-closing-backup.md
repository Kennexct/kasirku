# DBA — v0.9

- Local (Dexie v4): `expenses` and `dayClosings`, each indexed `[storeId+businessDate]` — every read is by store + day or day range. No upgrade function needed (new tables only).
- Server: `products.cost_price` (nullable, ≥ 0); `expenses` (amount > 0, category check, note ≤ 120); `day_closings` with two arithmetic CHECKs (expected = opening + cash sales − cash refunds − drawer expenses; difference = counted − expected) and a partial unique index — one live closing per store and business day.
- RLS: member-write for both tables (cashiers record expenses and close the day), same pattern as orders.
- Cost on sold items lives inside the order's `items` JSON — no server column, so no change to `order_lines`. A profit view can be added when reports move server-side.
- Not applied anywhere yet (no project). Six migration files parse with pglast.

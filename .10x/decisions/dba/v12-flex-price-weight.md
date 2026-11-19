# DBA — v0.12

- No local schema version change: new fields are optional properties on existing rows (products, order items inside the order JSON, store settings JSON). Absent = pieces / fixed price / setting off, so old data needs no upgrade.
- Server migration: `products.unit` (text, default `pcs`, CHECK on the six units), `products.is_price_editable` (boolean, default false). View `order_lines` recreated: `qty` is `numeric`, `gross = round(unitPrice × qty)`, plus `unit`.
- Quantities are IEEE doubles in JSON. Weights typed by the seller are rounded to 3 decimals; quantities derived from a money amount are stored unrounded so that `round(price × qty)` equals the amount.
- Backups: fields travel inside the existing tables; no change to the backup format version.
- Seven migration files parse with pglast; none applied (no project).

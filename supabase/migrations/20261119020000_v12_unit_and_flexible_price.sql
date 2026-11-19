-- v0.12 (ADR-011): sell by weight/measure and price entered at sale.
alter table public.products
  add column unit text not null default 'pcs' check (unit in ('pcs', 'kg', 'ons', 'g', 'l', 'm')),
  add column is_price_editable boolean not null default false;

-- Quantity can now be a decimal; a line is worth round(price × quantity).
create or replace view public.order_lines with (security_invoker = true) as
select
  o.store_id,
  o.id as order_id,
  o.business_date,
  o.status,
  o.sales_mode_name_snapshot as sales_mode,
  (line ->> 'productId')::uuid as product_id,
  line ->> 'nameSnapshot' as product_name,
  (line ->> 'qty')::numeric as qty,
  round((line ->> 'unitPrice')::numeric * (line ->> 'qty')::numeric)::bigint as gross,
  coalesce(line ->> 'unit', 'pcs') as unit
from public.orders o
cross join lateral jsonb_array_elements(o.items) as line
where o.deleted_at is null;

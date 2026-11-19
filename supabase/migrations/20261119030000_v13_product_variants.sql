-- v0.13 (ADR-012): real variants live inside the product. "Variant groups" are shown as add-ons (name only).
alter table public.products
  add column variants jsonb not null default '[]'::jsonb
  check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) <= 20);

comment on column public.products.variant_group_ids is 'Add-on groups (historical name, ADR-012).';

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
  coalesce(line ->> 'unit', 'pcs') as unit,
  (line ->> 'variantId')::uuid as variant_id,
  line ->> 'variantName' as variant_name
from public.orders o
cross join lateral jsonb_array_elements(o.items) as line
where o.deleted_at is null;

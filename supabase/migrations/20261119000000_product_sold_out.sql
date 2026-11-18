-- v0.8 (ADR-006): manual "Habis" flag on products.
alter table public.products add column is_sold_out boolean not null default false;

-- customers (ADR-005): orders snapshot the customer's name so history survives rename/delete.
alter table public.orders add column customer_name_snapshot text;

-- ADR-002: refunds count on the business day they happen (cash basis).
-- Adds refunds.business_date, backfills from created_at in the store's timezone minus day cut-off,
-- indexes it, and redefines daily_sales to subtract refunds on the refund date.

alter table public.refunds add column business_date date;

update public.refunds r
set business_date = ((r.created_at at time zone s.timezone) - s.day_cutoff)::date
from public.stores s
where s.id = r.store_id and r.business_date is null;

alter table public.refunds alter column business_date set not null;

create index refunds_store_business_date_idx on public.refunds (store_id, business_date);

drop view if exists public.daily_sales;

create view public.daily_sales with (security_invoker = true) as
with sales as (
  select
    o.store_id,
    o.business_date,
    count(*) as transactions,
    sum(o.grand_total) as gross_sales
  from public.orders o
  where o.deleted_at is null
    and o.status in ('paid', 'refunded', 'partial_refund')
  group by o.store_id, o.business_date
),
refunds as (
  select rf.store_id, rf.business_date, sum(rf.amount) as refunds
  from public.refunds rf
  where rf.kind = 'refund' and rf.deleted_at is null
  group by rf.store_id, rf.business_date
)
select
  coalesce(s.store_id, r.store_id) as store_id,
  coalesce(s.business_date, r.business_date) as business_date,
  coalesce(s.transactions, 0) as transactions,
  coalesce(s.gross_sales, 0) as gross_sales,
  coalesce(r.refunds, 0) as refunds,
  coalesce(s.gross_sales, 0) - coalesce(r.refunds, 0) as net_sales
from sales s
full outer join refunds r on r.store_id = s.store_id and r.business_date = s.business_date;

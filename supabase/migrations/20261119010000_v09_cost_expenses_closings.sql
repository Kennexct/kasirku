-- v0.9 (ADR-007): cost price, expenses, day closings.
alter table public.products add column cost_price integer check (cost_price is null or cost_price >= 0);

create table public.expenses (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  business_date date not null,
  category text not null check (category in ('ingredients', 'supplies', 'wages', 'utilities', 'rent', 'transport', 'other')),
  amount integer not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 120),
  is_from_drawer boolean not null default true,
  actor_id uuid not null references public.store_members (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.expenses (store_id, business_date);

create table public.day_closings (
  id uuid primary key,
  store_id uuid not null references public.stores (id) on delete cascade,
  business_date date not null,
  opening_cash integer not null check (opening_cash >= 0),
  cash_sales integer not null,
  cash_refunds integer not null,
  drawer_expenses integer not null,
  expected_cash integer not null,
  counted_cash integer not null check (counted_cash >= 0),
  difference integer not null,
  net_sales integer not null,
  transactions integer not null,
  expenses_total integer not null,
  by_method jsonb not null default '[]'::jsonb,
  open_order_count integer not null default 0,
  open_order_amount integer not null default 0,
  note text not null default '' check (char_length(note) <= 200),
  closed_by_id uuid not null references public.store_members (id),
  closed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (expected_cash = opening_cash + cash_sales - cash_refunds - drawer_expenses),
  check (difference = counted_cash - expected_cash)
);
-- One live closing per store and business day; reopening soft-deletes it.
create unique index day_closings_one_live on public.day_closings (store_id, business_date) where deleted_at is null;

-- Cashiers record expenses and close the day, so any store member may write (same as orders).
do $$
declare t text;
begin
  foreach t in array array['expenses', 'day_closings']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %1$s_select on public.%1$I for select using (public.is_store_member(store_id))', t);
    execute format('create policy %1$s_insert on public.%1$I for insert with check (public.is_store_member(store_id))', t);
    execute format('create policy %1$s_update on public.%1$I for update using (public.is_store_member(store_id))', t);
  end loop;
end $$;

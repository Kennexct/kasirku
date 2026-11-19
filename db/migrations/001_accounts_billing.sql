-- v0.14 accounts, trial and billing (ADR-013). Neon Postgres.
create table if not exists accounts (
  id uuid primary key,
  email text not null unique check (email = lower(email)),
  google_sub text unique,
  created_at timestamptz not null default now(),
  trial_ends_at timestamptz not null,
  paid_until timestamptz
);

create table if not exists login_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  sent_at timestamptz not null
);

create table if not exists refresh_tokens (
  token_hash text primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  expires_at timestamptz not null
);
create index if not exists refresh_tokens_account_idx on refresh_tokens(account_id);

create table if not exists payments (
  order_id text primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  plan text not null check (plan in ('monthly', 'yearly')),
  amount integer not null check (amount > 0),
  status text not null check (status in ('pending', 'paid', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  method text
);
create index if not exists payments_account_idx on payments(account_id, created_at desc);

-- staff-pin (ADR-003): hash of the owner's one-time PIN recovery code.
-- pin_hash now holds `pbkdf2-sha256$<iterations>$<salt>$<hash>` (format change only; column unchanged).
alter table public.store_members add column recovery_hash text;

comment on column public.store_members.pin_hash is 'pbkdf2-sha256$iterations$salt$hash; empty = no PIN. Never a plain PIN.';
comment on column public.store_members.recovery_hash is 'Hash of the owner recovery code (same format as pin_hash). Owner rows only.';

# accounts-billing — senior-engineer
Handlers are pure (Deps injected) so Neon/Resend/Midtrans are swapped for fakes in tests. Billing auth reuses the refresh token as bearer (find, not rotate). Sale guard lives in services/orders.ts, not only UI.

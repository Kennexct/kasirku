# Accounts, 14-day trial and Midtrans billing (v0.14) — approved 2026-11-19

## Decisions from the user
- Access model: **free trial then pay**. Sign up on the landing page → 14 days free → pay to keep selling.
- Payment: **Midtrans Snap** (QRIS, VA, GoPay, ShopeePay). Manual renewal (Snap cannot auto-charge QRIS).
- Hosting/stack: **Cloudflare Pages** (static + Pages Functions), **Neon** Postgres, **Resend** email, **Cloudflare R2** (reserved for cloud backup, not used in v0.14), **GitHub** for source. Supabase is dropped.
- Approved defaults: read-only after expiry, 3-day offline grace, sign in with email code (+ Google when a client ID is configured).

## Flow
1. `/` = landing page (static HTML). CTA "Coba gratis 14 hari" → `/app/`.
2. `/app/` without a session → Sign-in screen: email → 6-digit code by email (Resend) → signed in. Google button shown when `VITE_GOOGLE_CLIENT_ID` is set.
3. First sign-in creates the account and starts the trial (`trial_ends_at = now + 14 days`). Then the existing first-time journey (ADR-009), then the POS.
4. A device that already has local data is asked to sign in; data stays; the trial starts at that sign-in.

## Access pass (offline)
- Server returns an **ES256-signed pass** {sub, email, plan: trial|paid, until} + a long-lived refresh token (random, stored hashed).
- Device verifies the pass with the embedded public key, no network needed. Refreshed on boot, when coming online, and hourly.
- States: `active` (now < until), `grace` (now < until + 3 days AND the pass was issued before `until` — the server never confirmed the expiry), `expired`.
- Clock rollback: "now" = max(device clock, last time seen), stored on device.

## Expired = read-only
- No new sales and no saving open orders (guarded in `completeOrder` / `saveOpenOrder` and in the POS screen).
- Reports, history, export and backup keep working. Data is never deleted or locked.
- Banner from 3 days before the end: "Langganan berakhir dalam X hari — Perpanjang".

## Paying
- Settings → Langganan: status, end date, buttons Bulanan (Rp49.000, placeholder) / Tahunan (Rp490.000, placeholder), payment history.
- `POST /api/billing/checkout` creates a `payments` row (pending) and a Snap transaction; the app opens the Snap redirect URL.
- `POST /api/billing/midtrans` (notification): verify `signature_key = sha512(order_id+status_code+gross_amount+server_key)`, check amount = row amount, `settlement` / `capture`+`accept` → extend `paid_until = max(now, paid_until, trial_end) + 30/365 days`, idempotent per order.
- The app refreshes its pass on return from Snap.

## Landing page
- Pricing: "14 hari gratis, lalu Rp49.000/bulan"; "Gratis selamanya" removed. Cloud backup / multi-device stay "segera".
- CTAs link to `/app/`.

## Out of scope
- Auto-recurring charges, invoices/tax receipts, admin dashboard, cloud backup to R2, sync, multi-device seats.

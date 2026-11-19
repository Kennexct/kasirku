# accounts-billing — SDE (v0.14)
Built
- server/: types, crypto, auth (email code, Google, refresh rotation, sign-out), billing (checkout, notification, status, overview), midtrans (+devMidtrans), mailer (Resend, console), pass (ES256 signer, Google verifier), neonRepo, memoryRepo, router. functions/api/[[path]].ts.
- db/migrations/001_accounts_billing.sql.
- Client: lib/accessPass.ts, services/account.ts, store/useAccessStore.ts (canSell/assertCanSell), hooks/useAccessRefresh.ts, pages/Auth/SignInPage.tsx, components/Access/SubscriptionBanner.tsx, pages/Settings/SubscriptionSettings.tsx (new first tab "Langganan").
- App moved to /app (router basename, PWA scope, vite multi-page, public/_redirects `/app/* /app/ 200`, public/_headers). vercel.json removed.
- Landing: scripts/landing/build.py → index.html (static, /landing/*.png) and the design-canvas copy. Pricing = trial / monthly / yearly.
- 52 new English strings.
Deviations
- `_redirects` must rewrite to `/app/` (not `/app/index.html`): Pages strips index.html and loops.
- Plural source keys use "{0} hari" (i18n test rule).
Tech debt
- Expired state: the POS still opens the payment sheet; the guard rejects at "Selesaikan pembayaran". Disable "Bayar"/"Simpan" up front later.
- Supabase client + supabase/migrations kept dormant; remove when sync is redesigned on Neon.
- Prices live in server/types.ts and are mirrored as a fallback in SubscriptionSettings and the landing page.

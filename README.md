# KasirKu — Project Infrastructure

Offline-first, web-based POS for Indonesian UMKM and street food sellers. Built mobile and tablet first, installable as a PWA.
This repo implements the infrastructure for the PRD *"KasirKu — PRD: Simple POS for UMKM & Street Food Sellers"* (module refs M1–M15).

## 1. Architecture

```
┌──────────────────────── Device (phone / tablet browser, PWA) ────────────────────────┐
│  React UI (pages/)  ──►  Zustand (store/)  ──►  lib/ (pricing, money, dates)          │
│        │                                                                              │
│        ▼                                                                              │
│  Dexie / IndexedDB (db/localDb.ts)  ◄── POS reads & writes ONLY here (works offline)   │
│        │  saveAndQueue(): record + outbox row in ONE transaction                       │
│        ▼                                                                              │
│  Outbox ──► services/sync.ts (every 15 s, on reconnect) ──► idempotent upsert by UUID  │
│  Service worker (Workbox): app shell + product photos + QRIS image cached              │
└───────────────────────────────────────────┬──────────────────────────────────────────┘
                                            │ HTTPS (JWT)
┌───────────────────────────────────────────▼──────────────────────────────────────────┐
│  Supabase (region ap-southeast-1, Singapore)                                          │
│   • Auth: email / phone OTP for owners                                                │
│   • Postgres: RLS per store_id, append-only orders, immutability trigger, views       │
│   • Storage: product-photos, qris (public read, owner write by <store_id>/ prefix)    │
│   • Edge Functions (phase 4): large-range XLSX/PDF export                              │
└──────────────────────────────────────────────────────────────────────────────────────┘
Static hosting: Vercel (SPA rewrites + security headers in vercel.json) · Errors: Sentry
```

### Why this stack

| Decision | Choice | Reason |
| --- | --- | --- |
| App type | PWA (React + Vite) | No Play Store friction, installs from a link, one codebase for phone/tablet/desktop |
| Local data | Dexie (IndexedDB) | Offline checkout is a hard requirement; indexed queries for history and reports |
| State | Zustand | Small, no boilerplate; cart persisted to localStorage to survive reloads |
| Styling | Tailwind CSS v4 | Fast responsive layouts, tiny CSS output |
| Backend | Supabase | Postgres + Auth + Storage + RLS in one; generous free tier fits UMKM cost target |
| Hosting | Vercel | Free tier, global CDN, preview deploys per PR |
| IDs | Client UUIDv7 | Create records offline without collisions; time-sortable |
| Money | Integer Rupiah | No floating-point errors; IDR has no minor unit in practice |

## 2. Folder structure

```
kasirku/
├── .github/workflows/ci.yml     # typecheck → test → build on every PR
├── public/icons/                # PWA icons (placeholder "K" — replace with brand)
├── supabase/migrations/         # SQL schema, RLS, triggers, views, storage buckets
├── src/
│   ├── types/index.ts           # ALL domain types (single source of truth)
│   ├── constants/index.ts       # limits, defaults, routes — no magic numbers
│   ├── lib/                     # pure logic, unit-tested
│   │   ├── pricing.ts           # mode price, variants, discounts, tax/service, change
│   │   ├── money.ts             # Rp format/parse
│   │   ├── businessDate.ts      # day cut-off, receipt numbers
│   │   └── id.ts                # UUIDv7
│   ├── db/localDb.ts            # Dexie schema (offline store + outbox)
│   ├── services/
│   │   ├── supabase.ts          # client (null when env missing → pure offline dev)
│   │   └── sync.ts              # saveAndQueue + pushOutbox
│   ├── store/                   # Zustand: useCartStore, useSessionStore
│   ├── hooks/useOnlineStatus.ts # connectivity + background sync loop
│   ├── components/Layout/       # AppShell (bottom bar phone / side rail tablet), SyncBadge
│   └── pages/                   # one folder per module (POS, More, … placeholders mapped to PRD)
├── vite.config.ts               # React, Tailwind, PWA manifest + Workbox caching, Vitest
└── vercel.json
```

Page folders to add as modules are built: `OpenOrders/`, `History/`, `Reports/`, `Products/`, `Customers/`, `Settings/`, `Auth/`.

## 3. Getting started

```bash
npm install
cp .env.example .env.local     # optional: app runs fully offline without it
npm run dev                    # http://localhost:5173 — open DevTools device mode (iPad / Pixel)
npm test                       # pricing, business date, receipt no., UUIDv7
npm run build                  # typecheck + production build + service worker
```

Database:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push           # applies supabase/migrations
```

## 4. Offline sync design

1. Every write goes through `saveAndQueue(table, record)`: the record and an outbox row are written in one IndexedDB transaction.
2. `pushOutbox()` runs every 15 s and on reconnect; it upserts by client UUID, so retries never duplicate.
3. Transactions (orders, refunds) are append-only → no conflicts. Catalog/settings edits use last-write-wins on `updated_at`.
4. Receipt numbers carry a 2-char device code (`INV-20261118-A10042`) so two offline devices never collide.
5. After 10 failed attempts the cashier sees "Sinkronisasi tertunda" — data stays safe on device.
6. **Next (phase 1):** pull changes since `last_pulled_at` per table into Dexie for multi-device.

## 5. Security model

- Only the public anon key ships to the client; every table has RLS keyed on `store_id` (`is_store_member`, `is_store_owner`).
- Catalog/config tables: owner writes, members read. Operational tables: members insert/update, **no delete policy**.
- `orders_immutability` trigger blocks edits to items/totals/payments once an order is no longer `open`.
- PINs stored as PBKDF2-SHA-256 hashes (WebCrypto, ADR-003); void/refund/discount overrides record the approving owner and write `audit_events`.
- **Known limitation:** PIN checks run on the device. They stop misuse at the counter and make it auditable, but not someone with developer-tools access to the device. Server-side enforcement comes with owner login (M15 part 2).

## 6. Environments and delivery

| Env | Frontend | Supabase project | Deploy trigger |
| --- | --- | --- | --- |
| Local | `npm run dev` | optional (offline mode) | — |
| Preview | Vercel preview URL | `kasirku-staging` | every PR |
| Production | Vercel production | `kasirku-prod` (Singapore) | merge to `main` |

CI (`.github/workflows/ci.yml`): `npm ci` → `typecheck` → `test` → `build`. Migrations are applied to staging on merge, to prod by manual approval.

## 7. Current status (v0.8 — + custom methods & modes, sold-out, unpaid customers)

Design rules, tokens and component inventory: [`design-system/MASTER.md`](design-system/MASTER.md). Browser flow checks: [`e2e/`](e2e/README.md).


| PRD module | Status | Where |
| --- | --- | --- |
| M1 POS checkout | Done: grid, search, categories, cart, qty, line notes, change calculator | `pages/POS/` |
| M2 Products & variants | Done: CRUD, categories, variant groups (single/multi, required, +Rp), per-mode price | `pages/Products/` |
| M3 Product photo | Done on device: compressed to WebP ≤ 200 KB. Upload to Supabase Storage pending | `lib/image.ts` |
| M4 Sales mode | Done: add / rename / reorder / delete own modes (max 8); switch re-prices the cart; base / per-product / markup % rules; default mode | `pages/Settings/SalesModeSettings.tsx` |
| M5 Payment + QRIS | Done: add / rename / reorder / delete own methods (max 12, ADR-006); methods on/off, reference off/optional/required, static QRIS upload + full-screen display. Single method per order (split = v1.1) | `PaymentSheet.tsx`, `QrisDisplay.tsx` |
| M6 Discount | Order-level done (presets + ad-hoc % / Rp, cashier limit). Item-level pending | `DiscountSheet.tsx` |
| M8 Open orders | Done: save with label, nav badge, resume (same receipt no.), cancel with reason + audit | `pages/OpenOrders/` |
| M9 Receipt | Done: preview, browser print (58/80 mm), WhatsApp text share. Share-as-image pending | `components/Receipt/` |
| M14 Settings | Store profile, receipt text, tax/service, auto-receipt, staff & PIN, cashier rules | `pages/Settings/` |
| M10 Sales history | Done: Hari ini / Kemarin / 7 hari / Bulan ini / custom range (≤ 366 days), filters (status, payment, mode), search by receipt no. or label, period summary, list grouped by day (table on tablet), detail with reprint + WhatsApp | `pages/History/` |
| M11 Void & refund | Done: void (whole sale, same business day, no prior refund), refund (per item qty, within refund window, proportional discount/service/tax, last refund absorbs rounding), reason codes, permission rules, atomic write of refund + status + audit event. Cashier "PIN pemilik" approval arrives with M15 | `services/refunds.ts`, `lib/refunds.ts` |
| M12 Reports | Done: KPIs, sales by hour/day, payment method / sales mode / cashier breakdowns, top products; refunds counted on refund day (ADR-002); owner only; lazy route | `pages/Reports/`, `lib/reports.ts` |
| M13 Export | Done: Excel (5 sheets, numeric Rupiah), PDF summary, CSV (Transaksi/Item/Refund); on-device (ADR-001), share or download, formula-injection guard | `lib/export/` |
| M15 part 1 — Staff & PINs | Done: owner PIN + recovery code, cashiers (add / reset PIN / deactivate), switch seller, owner gate on Reports/Products/Settings with 5-minute auto-lock, one-time owner-PIN approval for void / refund / over-limit discount (approver recorded + audit), lockout, rules UI. On-device only (ADR-003, ADR-004) | `services/staff.ts`, `components/Pin/`, `pages/Settings/staff/` |
| M7 Customers | Done: list + search (name / phone), add / edit / delete (delete erases phone + note), pick or quick-add from the cart, name on receipt / history / exports, WhatsApp receipt straight to the customer, visits / spend / last visit (ADR-005) | `pages/Customers/`, `services/customers.ts` |
| Sold-out switch (v0.8) | Done: any seller marks a menu item "Habis" from the cashier; tile stays visible but cannot be sold | `pages/POS/components/SoldOutSheet.tsx` |
| Unpaid customers (v0.8) | Done: "Belum bayar" tab — who owes, how much, since when; WhatsApp reminder; derived from saved orders, no ledger (ADR-006) | `pages/Customers/DebtList.tsx`, `lib/customers.ts` |
| M15 parts 2–3 (owner login, sync) | Not started — needs a Supabase project | — |

First run seeds a "Warung Bakso" starter menu (`services/seedTemplate.ts`) so the seller can sell immediately and edit from there.

Tests: 85 unit/integration tests (incl. a 20k-order performance guard) (`npm test`) cover pricing, variants, receipt numbering, business date, WhatsApp receipt text, and the order service against an in-memory IndexedDB (paid, open → resume → paid, cancel + audit, validation, StrictMode double-seed guard) and void/refund rules (same-day void, refund window, partial → full, permission, reason).

## 8. Build order (maps to PRD release plan)

| Phase | Weeks | Modules | Infra already in place |
| --- | --- | --- | --- |
| Foundation | 1–2 | M15 auth, onboarding, sync pull | Dexie schema, outbox push, RLS, PWA shell |
| Sell | 3–5 | M1, M2, M3, M4, M5, M6, M9 | `lib/pricing.ts` (tested), cart store, storage buckets, print CSS |
| Operate | 6–7 | M7, M8, M10, M11 | `orders.status`, refunds table, audit events, immutability trigger |
| Understand | 8–9 | M12, M13, M14 | `daily_sales` and `order_lines` views; add `exceljs` + `jspdf` for export |
| Harden | 10 | Soak test, perf, security | CI pipeline, bundle budget (POS currently 125 KB gzip of 250 KB) |

## 9. Team process

This repo uses the 10x-Team workflow: decisions, ADRs, specs and reviews live in [`.10x/`](.10x/status.md). Runbooks live in `docs/runbooks/`.

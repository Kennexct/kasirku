# Status

**Phase:** Delivery Complete — v0.9. Next: v0.10 (first-time journey, help centre)
**Branch:** `feat/v0.9-profit-closing-backup` (stacked: reports-export → staff-pin → customers → v0.8-feedback → v0.9)
**Previous:** Delivery Complete (`reports-export`) — ready to merge after 2 manual device checks

| Feature | Phase | Notes |
| --- | --- | --- |
| pos-core | Delivered (v0.2–v0.3) | [DISCOVERED] |
| sales-history-refunds | Delivered (v0.4) | [DISCOVERED] |
| reports-export | **Delivered (v0.5)** | QA PASS · Security PASS · ADR-001, ADR-002 |
| staff-pin (M15 part 1) | **Delivered (v0.6)** on `feat/staff-pin` | 71 unit · 5 e2e · ADR-003, ADR-004 |
| customers (M7) | **Delivered (v0.7)** on `feat/customers` | 80 unit · 6 e2e · ADR-005 |
| v0.8 custom methods/modes · sold-out · unpaid customers | **Delivered (v0.8)** on `feat/v0.8-feedback` | 85 unit · 7 e2e · ADR-006 · review PASS |
| v0.9 cost & profit · expenses · close of day · backup | **Delivered (v0.9)** on `feat/v0.9-profit-closing-backup` | 112 unit · 8 e2e · ADR-007, ADR-008 · review PASS |
| v0.10 first-time journey · help centre | Next | roadmap spec |
| v0.11 English | Planned | roadmap spec |

## v0.9 tasks
- [x] T1 Types, Dexie v4, sync tables, migration
- [x] T2 Cost price on product + cost snapshot on sold item; `lib/profit.ts` + tests
- [x] T3 Expenses service; `lib/cashDrawer.ts`; day closing service + tests
- [x] T4 Kas screen (today, expenses, closing history)
- [x] T5 Profit card in Reports + export summary rows
- [x] T6 Backup file + restore + Settings tab + tests
- [x] T7 e2e `v09.py` + regressions, review, runbook

## reports-export tasks
- [x] T1 Refund businessDate + migrations
- [x] T2 buildReport + tests
- [x] T3 History summary alignment
- [x] T4 Extract DateRangeControl + StatTile
- [x] T5 Export CSV/XLSX/PDF + tests
- [x] T6 Reports page
- [x] T7 e2e + screenshots + bundle check

## Open before GA
- [ ] Manual: Android Chrome share sheet → WhatsApp with .xlsx
- [ ] Manual: iPad Safari (installed PWA) download
- [ ] Manual: PBKDF2 timing and PIN pad on a low-end Android phone
- [ ] Manual: backup download + restore (file picker, reload) on Android Chrome and iPad Safari; backup size with many product photos
- [ ] Apply DB migrations to a live Supabase project (checked 2026-11-18: the account has no KasirKu project; two unrelated projects exist and must not be touched)

## M15 decomposition
| Sub-project | Needs backend | Closes |
| --- | --- | --- |
| `staff-pin` — **done** — staff list, cashier PIN switch, owner PIN approval | No | client-side-only owner guard; PIN approval for void/refund/discount |
| `owner-login` — owner account (Supabase Auth), store linked to account | Yes (new Supabase project) | auto sign-in as owner |
| `sync-pull` — pull to other devices, device registration, photo upload | Yes, after `owner-login` | device-only reports |

## Remaining PRD modules
- M15 part 2 `owner-login`, part 3 `sync-pull` (need a Supabase project — user decision)
- Smaller gaps: item-level discount (M6), share receipt as image (M9), split payment (open question in PRD)

## Feedback round — APPROVED 2026-11-19 (see specs/2026-11-19-feedback-round-roadmap.md)
| Slug | What | Size |
| --- | --- | --- |
| `custom-methods-modes` | Add / rename / reorder / delete payment methods and sales modes in Settings | small–medium |
| `i18n-english` | Indonesian + English UI, typed dictionary, per-device language | large (≈ 500 strings, 70 screens/components) |
| `onboarding` (user request) | First-launch journey: language, store name + business template, payment/QRIS setup, short explanation, "Langkah awal" checklist. Absorbs recommended "setup wizard" | medium |
| `help-center` (user request) | Help button → in-app, offline help topics + contextual "?" on complex screens + replay intro | medium (≈ 12–15 short articles × 2 languages) |
| recommended additions | 1 close-of-day + expenses, 2 cost price → profit, 3 backup file, 5 sold-out toggle, 6 customer debt view | each small–medium; user to choose |

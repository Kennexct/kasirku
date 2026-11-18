# Status

**Phase:** Planning Complete (`staff-pin`) — implementing T1–T8
**Branch:** `feat/staff-pin` (from `feat/reports-export`)
**Previous:** Delivery Complete (`reports-export`) — ready to merge after 2 manual device checks

| Feature | Phase | Notes |
| --- | --- | --- |
| pos-core | Delivered (v0.2–v0.3) | [DISCOVERED] |
| sales-history-refunds | Delivered (v0.4) | [DISCOVERED] |
| reports-export | **Delivered (v0.5)** | QA PASS · Security PASS · ADR-001, ADR-002 |

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
- [ ] Apply DB migration to a live Supabase project (checked 2026-11-18: the account has no KasirKu project; two unrelated projects exist and must not be touched)

## M15 decomposition (proposed, not yet approved)
| Sub-project | Needs backend | Closes |
| --- | --- | --- |
| `staff-pin` — staff list, cashier PIN switch, owner PIN approval | No | client-side-only owner guard; PIN approval for void/refund/discount |
| `owner-login` — owner account (Supabase Auth), store linked to account | Yes (new Supabase project) | auto sign-in as owner |
| `sync-pull` — pull to other devices, device registration, photo upload | Yes, after `owner-login` | device-only reports |

## Other candidates
- M7 Customers

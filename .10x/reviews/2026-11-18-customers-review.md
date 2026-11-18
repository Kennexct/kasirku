# QA + Security Review — customers (M7)

**Date:** 2026-11-18 · **Branch:** `feat/customers` · **Verdict:** PASS for beta

## QA
| Suite | Result |
| --- | --- |
| Unit/integration | **80 / 80** (9 new: phone forms, search incl. 5 000-row guard, stats, service validation, snapshot + erase) |
| e2e `customers.py` tablet + phone | PASS — receipt shows customer; WhatsApp link `wa.me/6281234567890`; stats 1 visit / Rp2.000; history search by name; duplicate phone refused; delete erases phone + note; orders keep name snapshots |
| e2e regressions (flow, manage, history, reports, staff) | PASS |
| Bundle | main 169.1 KB gzip (budget 250) |

Found and fixed: last-visit date truncated in the phone detail tile → short date.
Not covered: 5 000 customers rendered in a real browser (logic guard only; list renders ≤ 100 rows); owner-PIN prompt on delete while locked (rule reused from staff-pin, covered there).

## Security / privacy (first third-party personal data)
| Concern | Assessment |
| --- | --- |
| PII minimisation | Name required; phone and note optional. No other fields. |
| Erasure (UU PDP 27/2022) | Delete erases phone + note and hides the record; name remains on past receipts as a transaction record — stated in the confirm dialog. Erasure reaches the server only when sync pushes the update. |
| Bulk leakage | Exports carry the name only; verified no phone field in `lib/export/*`. |
| Access | Cashiers can view and edit customers (PRD); delete needs the owner PIN when locked. Any seller can read phone numbers on the device — accepted for a shared counter device. |
| Injection | Customer names flow into CSV/XLSX through the existing formula-injection guard; React escapes UI output; `wa.me` URL built from digits only + `encodeURIComponent`. |
| Server | `customers` table already has per-store RLS and a phone format check that matches the client's canonical form. |

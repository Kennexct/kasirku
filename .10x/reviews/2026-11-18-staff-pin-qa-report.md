# QA Report — staff-pin (M15 part 1)

**Date:** 2026-11-18 · **Branch:** `feat/staff-pin` · **Verdict:** PASS for beta

| Suite | Result |
| --- | --- |
| Unit/integration (vitest) | **71 / 71 pass** (13 new: pin, lockout, permission rule, staff service, void approval) |
| e2e `staff.py` tablet + phone | PASS — void actor = cashier, approver = owner; discount approver = owner; audit has `owner_pin_set`, `cashier_added`, `discount_override`, `void`; hashes `pbkdf2-sha256$…`; no plain PIN in members/audit; keys disabled when locked; no page errors |
| e2e regression `flow`, `manage`, `history`, `reports` (no PIN set) | PASS — behaviour unchanged |
| Typecheck | clean |
| Bundle | main 165.6 KB gzip (budget 250) |

## Acceptance criteria
| Criterion | Evidence |
| --- | --- |
| No PIN → no change | 4 existing e2e flows untouched and green |
| Selling never prompts (option A) | `staff.py` step 4: sale by Dika after reload with no PIN prompt |
| Owner screens lock on switch / reload / Kunci | steps 3, 6, 7 |
| Approval is one-time, doesn't unlock screens | step 6: Reports still gated after an approved void |
| Approver recorded + audit | IndexedDB assertions; `refunds.test.ts` |
| 5 wrong PINs → 30 s, escalating, survives reload | `pin.test.ts`, `staff.test.ts` (counters in Dexie), step 8 |
| Recovery code resets PIN and rotates | `staff.test.ts` |
| Deactivated cashier keeps name | `staff.test.ts` |

## Found and fixed
1. Empty PIN fields showed "••••" placeholders that looked filled → "4–6 angka".

## Not covered (manual / later)
- 5-minute auto-lock timer end-to-end (unit-level rule tested; timer verified by code review, not by a 5-minute browser wait).
- Recovery flow through the UI (service-tested only).
- Real low-end Android timing of PBKDF2 (150 000 iterations).

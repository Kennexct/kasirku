# Engineering Manager — staff-pin

| # | Task | Est. | Depends |
| --- | --- | --- | --- |
| T1 | `lib/pin`, `lib/lockout`, `lib/permissions` + tests; constants; types; SQL migration | 1.5 h | — |
| T2 | `services/audit`, `services/staff` + tests | 2 h | T1 |
| T3 | Session store, `useOwnerAccess`, pin prompt store, bootstrap | 1 h | T1 |
| T4 | PinPad, OwnerPinForm, OwnerPinHost, AccountSheet, LockScreen | 2.5 h | T2, T3 |
| T5 | OwnerGate, nav lock badges, Kunci, MorePage | 1 h | T3, T4 |
| T6 | StaffSettings (owner PIN, cashiers, rules) | 2 h | T2, T4 |
| T7 | Void/refund approvals (service + History), discount override (POS) | 2 h | T1, T4 |
| T8 | e2e staff flow, regressions, screenshots | 1.5 h | all |

≈ 13.5 h. Risks: WebCrypto typing in TS; stacked sheets (PIN prompt over another sheet); e2e timing with PBKDF2.

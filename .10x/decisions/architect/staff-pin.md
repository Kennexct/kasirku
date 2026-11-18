# Architect — staff-pin

ADRs: **ADR-003** (on-device PBKDF2 PIN verification), **ADR-004** (seller session + owner access).

| Unit | Purpose | Depends on |
| --- | --- | --- |
| `lib/pin.ts` | hash / verify / format check / recovery code | WebCrypto |
| `lib/lockout.ts` | pure lockout schedule | constants |
| `lib/permissions.ts` | `OwnerAccess`, `requiresOwnerPin`, `approverOf` | types |
| `services/staff.ts` | member CRUD, `verifyMemberPin` (+ lockout in `meta`), recovery, audit | pin, lockout, sync |
| `services/audit.ts` | one helper to write audit events | sync |
| `store/useSessionStore` | active seller (persisted id), owner info, `ownerUnlockedUntil` | — |
| `store/usePinPromptStore` | `requestOwnerApproval()` promise | — |
| `hooks/useOwnerAccess` | derive `OwnerAccess`; auto-lock timer | session store |
| `components/Pin/*` | PinPad, OwnerPinForm (verify + recovery), OwnerPinHost, AccountSheet, LockScreen | staff service |
| `components/Layout/OwnerGate` | wraps owner routes | owner access |
| `pages/Settings/StaffSettings` | owner PIN, cashiers, rules | staff service |

Failure modes: reload ⇒ locked; remembered seller missing/deactivated ⇒ lock screen; hash malformed ⇒ verify false; approval older than 5 min ⇒ service rejects.

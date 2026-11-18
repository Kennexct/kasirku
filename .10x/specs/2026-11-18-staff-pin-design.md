# Staff & PINs — Design (M15, part 1 of 3)

**Date:** 2026-11-18 · **Feature slug:** `staff-pin` · **Status:** Approved by user (PIN behaviour = option A)

## Problem
The app always runs as the owner. Void/refund/discount rules and owner-only screens exist but cannot be enforced on a shared counter device, and sales cannot be attributed to the person who made them.

## Decisions taken with the user
1. M15 is split into `staff-pin` → `owner-login` → `sync-pull`; this spec covers `staff-pin` only (no backend needed).
2. **Option A:** selling never asks for a PIN once a seller is signed in. Owner powers (owner-only screens, approvals) need the owner PIN and re-lock 5 minutes after last use on an owner screen, on "Kunci", on reload, or when the seller is switched.

## Scope
**In**
- Owner PIN (4–6 digits): set, change (needs current PIN), reset with a one-time recovery code shown at setup.
- Cashiers: add (name + PIN), reset PIN, deactivate (kept in history). Adding the first cashier requires an owner PIN.
- Switch seller: pick name → PIN pad. Active seller is remembered across reloads.
- Owner gate on Reports, Products, Settings: PIN pad in place of the page while locked.
- One-time owner approval (PIN prompt) for void, refund and over-limit discount when the rule requires it; approver recorded on the refund / discount and in the audit log.
- Rules UI (Settings → Staf & PIN): void rule, refund rule, cashier discount limit %, refund window days.
- Lockout: 5 wrong PINs → wait 30 s, then 1 min, 5 min, 15 min.
- A store with no owner PIN behaves exactly as before (no lock screen, no gates).

**Out (YAGNI / later):** owner account login and server-verified PINs (`owner-login`), multi-device (`sync-pull`), removing the owner PIN, per-cashier shift or cash-drawer reports, biometrics, a permission matrix beyond the three existing rules.

## Behaviour rules
| Situation | Result |
| --- | --- |
| No owner PIN set | Everything open; seller = owner (today's behaviour) |
| PIN set, owner screen opened while locked | PIN pad; success unlocks owner powers for 5 min (sliding while using owner screens) |
| Rule = "Kasir boleh langsung" | Action allowed for anyone |
| Rule = "Perlu PIN pemilik" and owner powers unlocked | Allowed; approver = owner |
| Rule = "Perlu PIN pemilik" and locked | PIN prompt → one-time approval (valid 5 min, that action only); does NOT unlock owner screens |
| Discount above cashier limit while locked | "Setujui dengan PIN pemilik" → one-time approval stored on the discount |
| Seller switched / page reloaded / "Kunci" | Owner powers locked |

`owner_only` and `cashier_with_pin` (existing stored values) both mean "Perlu PIN pemilik"; the UI offers two choices.

## Architecture
```
lib/pin.ts (PBKDF2 hash/verify, recovery code)   lib/lockout.ts (pure)   lib/permissions.ts (OwnerAccess → needs PIN?)
                \                                   |                         /
                 services/staff.ts  (members CRUD, verifyMemberPin + lockout in Dexie meta, recovery, audit)
                          |
 store/useSessionStore (active seller persisted by id, ownerUnlockedUntil in memory)   store/usePinPromptStore (requestOwnerApproval())
                          |
 components/Pin/{PinPad, OwnerPinForm, OwnerPinHost, AccountSheet, LockScreen}   components/Layout/OwnerGate
                          |
 pages/Settings/StaffSettings · History (void/refund approval) · POS (discount override) · AppShell (lock badges, account, Kunci)
```
- Data: `StoreMember.pinHash` holds `pbkdf2-sha256$<iterations>$<salt>$<hash>` (empty = no PIN); new `StoreMember.recoveryHash`; new optional `AppliedDiscount.approvedById`. One additive SQL migration (`store_members.recovery_hash`).
- Lockout counters live in the device's Dexie `meta` table (not synced).

## Error handling
Wrong PIN → inline message with attempts left; locked → countdown, keys disabled; expired approval → "Persetujuan kedaluwarsa, minta PIN lagi"; duplicate cashier name / invalid PIN → inline form errors; remembered seller deactivated → lock screen.

## Security position (honest limits)
A 4–6 digit PIN deters misuse at the counter and makes it auditable. It does not resist an attacker who can read the device's storage (the PIN space is small enough to brute-force any hash). Tamper-proof enforcement arrives with server-side checks in `owner-login`/`sync-pull`.

## Testing
Unit: pin hash/verify/format, lockout schedule, permission resolution. Service (fake-indexeddb): owner PIN + recovery, cashier CRUD rules, verify + lockout, refund/void with locked/approved/expired access. e2e: set PIN → add cashier → switch → sale → void with wrong then right owner PIN → Reports gate → Kunci → reload persistence; all existing e2e flows unchanged with no PIN.

## Self-review
No placeholders. `owner_only` vs `cashier_with_pin` ambiguity resolved (same behaviour). Scope is one implementation plan. "Last use" defined as last pointer/key interaction inside an owner-gated screen.

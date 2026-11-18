# Senior Engineer — staff-pin

- **T1:** `OwnerAccess = {kind:'open'} | {kind:'unlocked', ownerId} | {kind:'approved', ownerId, grantedAt} | {kind:'locked'}`. `requiresOwnerPin(level, access, now)`: `cashier` level never; `open`/`unlocked` never; `approved` only if expired; `locked` yes.
- **T2:** `verifyMemberPin(memberId, pin, now)` → `{ok:true} | {ok:false, error, lockedMs}`; lock state JSON under `meta['pinlock:<id>']`. `setOwnerPin` returns a recovery code only on first set; `resetOwnerPinWithRecovery` rotates it.
- **T3:** `signInCashier` persists id and locks owner; bootstrap restores the remembered member from DB or leaves `cashier = null` → `LockScreen`.
- **T4:** `PinPad.onSubmit(pin) → Promise<{error, lockedMs?} | null>`; OK key enabled from 4 digits; countdown disables keys.
- **T7:** `Eligibility` gains `needsOwnerPin`; business-rule checks run before the permission check so we never ask for a PIN for an impossible action. `RefundContext.access` replaces `actorRole`. Discount: `AppliedDiscount.approvedById`, audit `discount_override`.
- **Tricky:** approval must be cleared when the action sheet closes; Escape on stacked sheets.

# SDE — staff-pin (what was built)

| Task | Files |
| --- | --- |
| T1 | `lib/pin.ts`, `lib/lockout.ts`, `lib/permissions.ts` (rewritten), `lib/pin.test.ts`; constants; `StoreMember.recoveryHash`, `AppliedDiscount.approvedById`; migration `20261118020000_member_recovery_hash.sql` |
| T2 | `services/audit.ts`, `services/staff.ts`, `services/staff.test.ts` |
| T3 | `store/useSessionStore.ts`, `store/usePinPromptStore.ts`, `hooks/useOwnerAccess.ts`, `hooks/useStaff.ts`, `hooks/useBootstrap.ts`, `hooks/useAppData.ts` |
| T4 | `components/Pin/{PinPad,PinInput,OwnerPinForm,OwnerPinHost,RecoveryCodeNotice,SellerSwitcher,LockScreen,AccountSheet}.tsx` |
| T5 | `components/Layout/{OwnerGate,AppShell,navItems}`, `pages/More/MorePage.tsx`, `App.tsx` |
| T6 | `pages/Settings/StaffSettings.tsx`, `pages/Settings/staff/{OwnerPinSection,CashierSection,RulesSection}.tsx`, Settings tab + `?tab=staff` |
| T7 | `services/refunds.ts` (`access`, `needsOwnerPin`, `approvedById`), History page/detail sheet, `DiscountSheet` override, POS audit `discount_override` |
| T8 | `e2e/staff.py` |

## Deviations
- PBKDF2 (WebCrypto) instead of bcrypt — ADR-003.
- `owner_only` and `cashier_with_pin` collapsed to one behaviour; rules UI has two choices — ADR-004.
- Nav shows owner items to everyone with a lock mark (enforced by `OwnerGate`), instead of hiding them for cashiers.
- `checkPermission`/`isOwner`/`navItemsForRole` removed.

## Tech debt
- Staff-management service calls are protected by the gated Settings screen, not by a service-level access argument.
- No "remove owner PIN" (a solo owner who set one keeps the gates).
- Cancelling an open (unpaid) order is still ungated (reason + audit only).
- Escape closes every stacked sheet at once.
- Store settings (`updateStore`) are still not queued for sync (pre-existing).

# Product Manager — staff-pin

## User stories
1. As a solo seller I never see a PIN screen unless I choose to set one.
2. As an owner I add my cashier with a PIN so sales show who made them.
3. As an owner I approve a void/refund/big discount by typing my PIN on the cashier's device, without handing over my powers.
4. As an owner I open Reports on the shared device with my PIN and it locks itself again.
5. As an owner who forgot my PIN I reset it with the recovery code I wrote down.

## Acceptance criteria
- No owner PIN → zero behaviour change (all existing e2e flows pass untouched).
- Selling by the signed-in seller never prompts for a PIN (option A).
- Owner screens locked after 5 min without use, on Kunci, reload, or seller switch.
- Void/refund/over-limit discount record the approver; audit log has an entry.
- 5 wrong PINs → 30 s lock, escalating; counter survives reload.
- Deactivated cashier keeps their name in History/Reports.

## Out of scope
Owner login, sync, shift reports, biometrics, removing the owner PIN.

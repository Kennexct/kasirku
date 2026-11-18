# Security — index

[DISCOVERED] Only anon key in client; RLS per store_id; append-only operational tables; audit events for cancel/void/refund.
[DISCOVERED] Known limitation: shared device signs in as owner; cashier role enforcement is app-level until M15.

## Features
- reports-export — PASS, formula-injection guard → `reports-export.md`
- staff-pin — PASS with documented limits → `staff-pin.md`

# Staff Engineer — staff-pin

- One rule function (`requiresOwnerPin`) used by UI and services; no role string checks scattered in components (`isOwner` removed from `useAppData`).
- Secrets hygiene: PIN strings live only in component state and function arguments; never in zustand, localStorage, toasts, audit payloads or thrown messages.
- PIN entry uses the custom `PinPad` (big keys) for verification and `PinInput` (masked numeric text field) inside forms.
- Nav shows owner items to everyone with a lock badge; access is enforced by `OwnerGate` on the route, not by hiding links.
- Existing inline audit writes stay; new code uses `services/audit.ts`.
- Tests: fake-indexeddb for services; `crypto.subtle` is available in Node 22 for unit tests.

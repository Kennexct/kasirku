# SDE — v0.11 (English)

Built
- `src/i18n/index.ts` (`t`, `translate`, `lang`, `DATE_LOCALE`, `setLanguage`), `src/i18n/en.ts` (979 entries), tests.
- One-off codemod `scripts/i18n-wrap.mjs` (TypeScript compiler API) wrapped ~970 strings in 110 files: JSX text, whitelisted attributes and object properties, label maps, toasts, thrown errors, sentence-like literals, template literals → positional `{0}` arguments. A second pass by file/line covered text builders, export headers and seed data.
- `scripts/i18n-keys.mjs` (`npm run i18n:check`, in CI): every used key has English, no dead entries. `scripts/i18n-scan.mjs` (`npm run i18n:scan`): literals that still look like interface text.
- Language picker: first step of the journey, Pengaturan → Toko & Struk, and the PIN screen. Switching saves to `localStorage` and reloads.
- Dates use `DATE_LOCALE`; money is unchanged. Receipts, WhatsApp texts (receipt, closing summary, payment reminder), CSV/Excel/PDF follow the language.
- `content/help.en.ts`; starter templates seed category, variant, payment-method and discount names in the chosen language (product names stay Indonesian).
- `e2e/v11.py`: English device end to end + leftover-Indonesian scan on 29 screens + Excel in English + switch back to Indonesian.

Deviations from ADR-010
- Added context hints (`'Kasir::orang'`, `'Kembali::uang'`, `'Pesanan::label'`, `'Pelanggan::satu'`, `'Pembayaran::tab'`, `'Lainnya::menu'`) for six words that need two English words; stripped in Indonesian.
- Count + noun fragments on the main screens became full sentences with plural forms (`'{0} transaksi'` → "1 transaction / 3 transactions").

Tech debt
- Some sentences split around inline elements are translated in fragments (word order fixed to Indonesian structure).
- Developer-facing error strings (sync, money parsing) are identical in both languages.
- Language is per device, not per seller. No automatic detection of other languages.
- English wording was written by the team, not reviewed by a native-speaking merchant.
- Existing stores keep their Indonesian seeded names after switching language (they are merchant data).

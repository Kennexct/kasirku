# SDE — v0.10 (first-time journey, help centre)

Built
- `services/seedTemplate.ts`: five data-defined templates (bakso, kopi, gorengan, warung, kosong) + `buildSeedBundle(setup)`; test over every template.
- `services/bootstrap.ts`: `findLocalStore`, `createLocalStore(setup)` (now one transaction, store row last, sets `meta.onboardedAt`), `ensureLocalStore` kept for tests and "Lewati".
- `hooks/useBootstrap.ts`: state `onboarding` + `completeOnboarding`.
- `pages/Onboarding/OnboardingPage.tsx`: Toko → Pembayaran (QRIS upload optional) → Cara kerja.
- `lib/checklist.ts`, `hooks/useChecklist.ts`, `components/Checklist/{ChecklistBanner,ChecklistCard}`.
- `content/help.ts` (types, search) + `content/help.id.ts` (15 topics, 4 intro cards); `pages/Help/HelpPage.tsx`; `components/Help/{HelpButton,HelpTopicView,IntroCards}`; `PageHeader.helpTopic` on Riwayat, Laporan, Kas, Pelanggan, Produk, Pesanan, Pengaturan (per tab); nav item "Bantuan"; tablet rail now scrolls.
- `e2e/v10.py`; all older flows pass the journey through "Lewati".

Deviations
- No language step yet (arrives with v0.11, as planned in ADR-009).
- Store creation became atomic — found when a navigation right after "Lewati" left half a menu and no store.
- Help page is not lazy-loaded: the contextual "?" needs the content on every screen anyway (+~9 KB gzip).
- No WhatsApp support button (no number provided).

Tech debt
- Help text changes need a release. No screenshots in help.
- "Sesuaikan menu" counts any product change after setup, including marking an item sold out.
- A device restored from an older backup without `onboardedAt` never shows the banner (checklist still on the help page).

# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: June 2026.

## V1 product scope

| In scope | Out of scope (for now) |
|----------|-------------------------|
| Salaried **single** household | Freelancer, student, business modes (removed; migrated to salaried on load) |
| Salaried **family** household (`householdScope: family`) | Full accounting / ERP / banking |
| Local-first commitments + pressure + lending | Mass-market spend tracking (Walnut-style) |

**Subscription tiers** (`constants/subscriptionTiers.js`): `free`, `pro`, `power`. Tiers unlock features via `ProGate` — they are not separate user-facing “modes”.

## Shipped — core product

| Area | Status | Key paths |
|------|--------|-----------|
| Home dashboard (scroll layout) | ✅ Current UI | `ui/features/pages/HomePage.jsx`, `dashboard/*` |
| Commitments / Add / Profile | ✅ | `ui/features/pages/*` |
| Analytics + charts (chip switcher) | ✅ | `AnalyticsPage.jsx`, `analytics/*` |
| Dashboard tools (6 tiles) | ✅ | `planner`, `loan`, `insurance`, `chit`, `bond`, `incomeTax` — `modeExperience.js`, `DashboardTools.jsx` |
| Light / dark / system theme | ✅ | `utils/theme.js`, `app/ThemeSync.jsx`, `ui/styles/theme-light.css` |
| Supabase auth + profile merge save | ✅ | `services/supabase/auth.js` |
| Lending trust + share card | ✅ | `engines/lendingTrust.js`, `utils/lendingShareCard.js` |
| SMS auto-detect modal | ✅ | `ui/features/modals/SmsDetectModal.jsx` |
| Subscription leak + paycheck on Analytics | ✅ | `SubscriptionLeakCard.jsx`, `PaycheckBreakdown.jsx` |
| Stability narrative in Financial pulse | ✅ | `engines/stabilityNarrative.js`, `FinancialPulseCard.jsx` |
| Income tax tool | ✅ | `engines/incomeTaxEstimate.js`, `tools/IncomeTaxPanel.jsx` |
| Annual health report (Pro) | ✅ | `ProfileBackupSection.jsx` |

## Shipped — payments & legal (backend-heavy)

| Area | Status | Key paths |
|------|--------|-----------|
| Razorpay checkout (client) | ✅ Wired | `services/razorpay.js`, `ui/features/profile/PlansModal.jsx` |
| Server payment verify | ⏳ TODO | Comment in `razorpay.js` — Supabase Edge Function before production |
| Promissory note engine (India) | ✅ | `engines/lendingAgreement.js` — `buildPromissoryNoteText()`, `numberToWords()` |
| Legal HTML export | ✅ | `utils/agreementExport.js` — `generateLegalAgreementHtml()` |
| Print agreement button | ✅ Uses new export | `LendingDetailDashboard.jsx` → `downloadLendingAgreementHtml()` |
| Confirmation service (declared, not eSign) | ✅ Ready for UI | `services/otpConfirmation.js` |
| Lending legal fields on record | ✅ Schema-ready | Optional fields on lending object (see below) |
| Aadhaar eSign (Leegality) | ⏳ Future | PROMPT 6 — post-V1 |

### Lending legal fields (optional on lending record)

Collected when legal-details UI is built; engine/export already read them:

`borrowerFullName`, `borrowerAddress`, `borrowerPhone`, `lenderFullName`, `lenderAddress`, `lenderPhone`, `loanPurpose`, `agreementCity`, `witness1Name`, `witness1Phone`, `idProofType`, `idProofLast4`, `penaltyRatePerMonth`, `arbitrationClause`, `esignStatus`, `lenderConfirmedAt`, `borrowerConfirmedAt`, `lenderConfirmationRef`, …

### Settings field (data only, no Profile UI yet)

`salaryCreditDay` — persisted in `migrateStorage.js` for future paycheck-on-salary-day flow.

## Deferred — UI phases (do not re-implement without design sign-off)

| Phase | Description |
|-------|-------------|
| OS launcher home | Status bar (pressure / health / runway) + module tile grid instead of scroll dashboard |
| Paycheck page | `/paycheck` route, salary-day auto-navigate, Profile “salary credit day” field |
| Planning page | `/planning` — tools moved off Home |
| Legal details modal | `LegalDetailsModal` + lender/borrower confirmation screens |
| Lending offer review refresh | Offer page still uses legacy Tailwind shell — migrate to `ct-*` when touched |

Current Home layout is **intentionally kept** until launcher UX is redesigned.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | For cloud auth | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For cloud auth | Supabase anon key |
| `VITE_RAZORPAY_KEY_ID` | For paid upgrades | Razorpay checkout (`rzp_test_*` in dev) |

Copy from `.env.example`. Without Razorpay key, Plans modal shows a configuration error on upgrade.

## Tests & quality

- **102** unit tests (`npm test`) — includes `numberToWords`, `otpConfirmation`, engines/utils
- Gate: `npm run audit` before merge

## Related docs

- [02-project-structure.md](./02-project-structure.md) — where to add code
- [architecture/Architecture.md](./architecture/Architecture.md) — layers & data flow
- [architecture/ModeArchitecture.md](./architecture/ModeArchitecture.md) — salaried / family tools

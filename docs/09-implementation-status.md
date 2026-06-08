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
| Commitments / Add | ✅ | `ui/features/pages/*` |
| Profile hub (control center, journey, widgets) | ✅ | `ui/features/profile/hub/*`, `ProfilePage.jsx` |
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
| i18n — 22 langs + English | ✅ Infrastructure | `src/i18n/` — ~631 keys, audit parity |
| i18n — Home, pulse, commitments, profile | ✅ Partial UI | See [10-i18n.md](./10-i18n.md) for wired vs pending screens |

## Shipped — admin intelligence (internal)

| Area | Status | Key paths |
|------|--------|-----------|
| Product analytics pipeline | ✅ | `services/analytics/*`, `app/AnalyticsBridge.jsx` |
| Supabase `app_events` + admin RPC | ✅ | `supabase/migrations/2026060600*.sql` |
| Admin dashboard `/admin` | ✅ | `ui/features/pages/AdminPage.jsx`, `ui/features/admin/*` |
| Profile entry (admin-only) | ✅ | `ui/features/profile/hub/ProfileAdminEntry.jsx` |
| Route guard + `isAdmin` auth flag | ✅ | `app/RequireAdmin.jsx`, `AuthContext.jsx` |

| Supabase `daily_spends` + RLS | ✅ | `supabase/migrations/20260606030000_daily_spends_table_from_snapshot.sql` (materialized from synced payload) |

**Setup:** apply all three admin migrations in order, then `SELECT grant_committrack_admin('<uuid>');` in Supabase SQL Editor. Full detail: [architecture/AdminAnalytics.md](./architecture/AdminAnalytics.md).

**Not tracked:** bill amounts, PAN, SMS content, or other sensitive financial/identity fields.

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
| Full i18n on all screens | Add/Edit bills, lending, onboarding, auth, analytics charts, tool panels, engine insight text |
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

- **178** unit tests (`npm test`) — engines, utils, services, analytics, i18n
- Gate: `npm run audit` (includes copy tone + i18n key parity)

## Related docs

- [02-project-structure.md](./02-project-structure.md) — where to add code
- [architecture/Architecture.md](./architecture/Architecture.md) — layers & data flow
- [architecture/ModeArchitecture.md](./architecture/ModeArchitecture.md) — salaried / family tools
- [10-i18n.md](./10-i18n.md) — languages, scripts, coverage
- [architecture/AdminAnalytics.md](./architecture/AdminAnalytics.md) — admin dashboard, events, migrations

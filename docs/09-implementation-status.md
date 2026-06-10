# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: 10 June 2026 (full audit pass — pricing, docs, strict gate green).

## V1 product scope

| In scope | Out of scope (for now) |
|----------|-------------------------|
| Salaried **single** household | Freelancer, student, business modes (removed; migrated to salaried on load) |
| Salaried **family** household (`householdScope: family`) | Full accounting / ERP / banking |
| Local-first commitments + pressure + lending | Mass-market spend tracking (Walnut-style) |

**Subscription tiers** (`constants/subscriptionTiers.js`): `free`, `pro`, `power`. Tiers unlock features via `ProGate` / `tierAccess.js` — they are not separate user-facing “modes”. Free caps: 5 lending, 2 chits, 3 goals, 50 spends/mo, 5 splits/mo (3 people), 30-day cashflow; plain-text annual report.

## Shipped — core product

| Area | Status | Key paths |
|------|--------|-----------|
| Home dashboard (scroll layout) | ✅ Current UI | `ui/features/pages/HomePage.jsx`, `dashboard/*`, `home/HomeQuickActions.jsx` (customize: bills, log spend, tools, lending, income, analytics, profile, …) |
| Home month hero card | ✅ | `HeroMonthCard.jsx`, `HomeOverviewCard.jsx` — scheduled/paid/unpaid, free cash + variable spend tiles, salary bar + sparkline |
| Financial Life palette (app-wide) | ✅ | `tokens.css`, `components.css`, `theme-light.css`, `tailwind.config.js` (`--ct-life-*`, `--ct-tw-*` bridge) |
| PWA dev / white-screen guard | ✅ | `vite.config.js` `devOptions.enabled: false`; SW registers in prod only (`main.jsx`) |
| Bills — variable spend logging | ✅ | `CommitmentsPage` spend tab, `DailySpendPanel.jsx`, `LogSpendModal.jsx` (nav long-press **+** or Bills FAB; no charts — charts on Analytics) |
| Commitments / Add | ✅ | `ui/features/pages/*` |
| Profile hub (financial identity + net worth) | ✅ | `ProfileFinancialHero` (3 hero chips + circle + → `/profile/scores`), `ProfileNetWorthSection`, `ProfileScoresDetailPage`, `ProfilePage.jsx` |
| Privacy eye toggle (amounts + scores) | ✅ | `NetWorthContext.privacyMode` — Home hero, Profile hero, Lending profile card |
| Cloud account backup (local-first) | ✅ | `services/sync/*`, `CloudSyncBridge`, `ProfileCloudSyncSection` (restore modal inline) — manual restore, empty-remote guard |
| Profile security panel | ✅ | `ProfileSecuritySection` — sign-in email, device, last backup/restore |
| Lending profile share card | ✅ | `LendingProfileCard.jsx`, `utils/lendingProfileShare.js` — financial-life hero palette |
| Analytics — pulse + monthly spend + wealth | ✅ | `AnalyticsPage.jsx`, `MonthlySpendAnalyticsSection.jsx`, `WealthAnalyticsSection.jsx`, `BillInsightsCards.jsx` |
| Dashboard tools (10 tiles) | ✅ | `planner`, `advisor`, `loan`, `insurance`, `chit`, `bond`, `incomeTax`, `retirement`, `safety`, `invest` — `modeExperience.js`, `DashboardTools.jsx` |
| Money planner (3 tabs) | ✅ | Afford · Scenarios · Goals — `MoneyPlannerPanel.jsx`, `UnifiedScenariosPanel.jsx` |
| Loan helpers + payoff order | ✅ | `LoanToolsPanel.jsx` — Extra EMI · Timing · Payoff order |
| Unified scenarios (data-gated) | ✅ | `UnifiedScenariosPanel.jsx`, `engines/scenarioCatalog.js` |
| Profile milestones (wins) | ✅ | `ProfileMilestonesPanel.jsx`, `engines/profileAchievements.js` |
| Bill-derived assets / liabilities | ✅ | `engines/netWorth/commitmentWealth.js`, net worth tabs |
| Light / dark / system theme | ✅ | `utils/theme.js`, `app/ThemeSync.jsx`, `ui/styles/theme-light.css` |
| Supabase auth + profile merge save | ✅ | `services/supabase/auth.js` |
| Auth gate (sign-in / sign-up / forgot / reset) | ✅ | `ui/features/auth/AuthGatePage.jsx` — animated brand hero, password reset via Supabase |
| Dynamic loading UX (boot + route skeletons) | ✅ | `ui/patterns/Loading.jsx`, `loadingSkeletons.jsx` — `PageLoader`, `RouteFallback`, shimmer skeletons per route |
| Lending trust + share card | ✅ | `engines/lendingTrust.js`, `utils/lendingShareCard.js` |
| SMS auto-detect modal | ✅ | `ui/features/modals/SmsDetectModal.jsx` |
| Subscription leak + paycheck on Analytics | ✅ | `SubscriptionLeakCard.jsx`, `PaycheckBreakdown.jsx` |
| Stability narrative in Financial pulse | ✅ | `engines/stabilityNarrative.js`, `FinancialPulseCard.jsx` |
| Income tax tool | ✅ | `engines/incomeTaxEstimate.js`, `tools/IncomeTaxPanel.jsx` — HRA, 80CCD(1B), prof tax, advance tax schedule + one-click bills |
| Retirement planner (EPF·PPF·NPS·gratuity) | ✅ | `RetirementPlannerPanel.jsx`, engines `epfTracker`, `ppfTracker`, `npsPlanner`, `gratuityEstimate` |
| Safety & emergency | ✅ | `SafetyPlannerPanel.jsx` — liquid reserve target only |
| Invest & save (SIP · FD/RD) | ✅ | `InvestSavingsPanel.jsx` — SIP moved from Safety; FD/RD moved from Retirement |
| AI financial advisor (Pro) | ✅ | `FinancialAdvisorTool.jsx`, `services/financialAdvisor.js` |
| Tax & HRA tool | ✅ | `IncomeTaxPanel.jsx` — tax + HRA tabs (inlined) |
| Bank statement PDF/CSV import | ✅ | Position-aware PDF extract, Dr/Cr parsing, CSV columns, recurring → bills — `BankStatementImportModal.jsx` |
| Bill split + share card | ✅ | `engines/billSplit.js`, `BillSplitModal.jsx` — Lending page |
| Household entity metrics | ✅ | `engines/householdEntity.js` — Family dashboard + Profile member editor |
| Life score share cards | ✅ | `utils/lifeShareCards.js` — Financial pulse snapshot tab |
| Engine depth (pressure, health, survival, lending trust, chit IRR) | ✅ | Phase A–F engines — see `engines/*` |
| 90-day cashflow calendar | ✅ | `engines/cashflowCalendar.js`, `CashflowCalendarStrip.jsx` on Analytics |
| Smart pressure notifications | ✅ | `notifications.js` — pressure spike, salary-day, low-buffer, lending overdue |
| Tier limit enforcement (UI) | ✅ | `tierLimits.js`, `tierAccess.js`, `TierLimitBanner.jsx` — lending, chits, goals, spend, splits, cashflow |
| FD/RD maturity tracker | ✅ | `InvestSavingsPanel.jsx` (FD/RD tab); net worth FD/RD categories |
| Money outlook chart window | ✅ | ±3 months (`MONEY_OUTLOOK_WINDOW` in `forecastSeries.js`) |
| App version 1.0.0 | ✅ | `package.json` |
| Semantic badge tokens (Phase B) | ✅ | `ui/tokens/semanticBadge.js` — engines return `tone` only |
| Intel memoization | ✅ | `utils/intelMemo.js` in `useCommitIntel.js` |
| Annual health report (Pro) | ✅ | `ProfileBackupSection.jsx` |
| i18n — 22 langs + English | ✅ Infrastructure | `src/i18n/` — audit parity via `npm run sync:i18n` |
| i18n — Home, pulse, commitments, profile | ✅ Partial UI | See [10-i18n.md](./10-i18n.md) for wired vs pending screens |

## Shipped — admin intelligence (internal)

| Area | Status | Key paths |
|------|--------|-----------|
| Product analytics pipeline | ✅ | `services/analytics/*`, `app/AnalyticsBridge.jsx` |
| Supabase `app_events` + admin RPC | ✅ | `supabase/migrations/2026060600*.sql` |
| Admin dashboard `/admin` | ✅ | `ui/features/pages/AdminPage.jsx`, `ui/features/admin/*` — analytics + **user management** (verify PAN, grant admin, edit, delete) |
| Admin user RPCs | ✅ | `supabase/migrations/20260610020000_admin_user_management.sql`, `services/adminUsers.js` |
| Profile entry (admin-only) | ✅ | `ui/features/profile/hub/ProfileAdminEntry.jsx` |
| Route guard + `isAdmin` auth flag | ✅ | `app/RequireAdmin.jsx`, `AuthContext.jsx` |

| Supabase `daily_spends` + RLS | ✅ | `supabase/migrations/20260606030000_daily_spends_table_from_snapshot.sql` (materialized from synced payload) |

**Setup:** apply admin migrations in order (`2026060600*` + `20260610020000_admin_user_management.sql`), then grant the first admin via SQL Editor (`grant_committrack_admin`) or promote from an existing admin in **User management**. Full detail: [architecture/AdminAnalytics.md](./architecture/AdminAnalytics.md).

**Not tracked:** bill amounts, PAN, SMS content, or other sensitive financial/identity fields.

## Shipped — payments & legal (backend-heavy)

| Area | Status | Key paths |
|------|--------|-----------|
| Razorpay checkout (client) | ✅ Wired | `services/razorpaySubscription.js`, `PlansModal.jsx` — **monthly** or **yearly** billing toggle; yearly ~29% off monthly×12 |
| Subscription pricing (source of truth) | ✅ | `subscriptionTiers.js` — Pro ₹99/mo or ₹843/yr; Power ₹199/mo or ₹1,695/yr (`yearlyInrAfterSave`) |
| Razorpay test keys in dev | ✅ Wired | Set `VITE_RAZORPAY_KEY_ID=rzp_test_…` — disables simulation; UPI `success@razorpay` for test pay |
| Server payment verify | ✅ Edge Function | `supabase/functions/razorpay-checkout` — deploy + `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` secrets |
| Tools discovery toast | ✅ | `ToolsDiscoveryPrompt.jsx` — Home/Analytics nudge to calculators |
| Supabase URL normalization | ✅ | `normalizeSupabaseUrl()` in `auth.js` — accepts project ref or full URL |
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
| Full i18n on all screens | Add/Edit bills, lending, analytics charts, tool panels, engine insight text (auth gate wired; other locales use English fallback for new auth/loading keys until translated) |
| OS launcher home | Status bar (pressure / health / runway) + module tile grid instead of scroll dashboard |
| Paycheck page | `/paycheck` route, salary-day auto-navigate, Profile “salary credit day” field |
| Planning page | `/planning` — tools moved off Home |
| Legal details modal | `LegalDetailsModal` + lender/borrower confirmation screens |
| Lending offer review refresh | Offer page uses Tailwind shell mapped to Financial Life tokens — full `ct-*` migration when touched |

Current Home layout is **intentionally kept** until launcher UX is redesigned.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | For cloud auth | Full URL `https://<ref>.supabase.co` (bare project ref also works) |
| `VITE_SUPABASE_ANON_KEY` | For cloud auth | Supabase anon key |
| `VITE_RAZORPAY_KEY_ID` | For paid upgrades | Razorpay checkout (`rzp_test_*` in dev) |

Copy from `.env.example`. Restart `npm run dev` after editing `.env`. GitHub Pages: set the same three as repository secrets; deploy workflow passes them at build time.

Edge Function secrets (Supabase Dashboard, not `.env`): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

## Tests & quality

- **264** unit tests in **85** files (`npm test`) — engines, utils, storage/snapshot, sync meta, subscription pricing, lending share, analytics, i18n
- Focused: `npm run test:sync`, `npm run test:engines`, `npm run test:utils`
- Gate: `npm run audit` — env, deps, CSS, UI, copy tone, i18n, code+depth, tests, types, build
- Strict: `npm run audit -- --strict` — **ALL CHECKS PASSED** (merge suggestions advisory only)
- Governance: `npm run audit:governance:quick` (0 errors) · cloud: `npm run audit:sync` · merge: `npm run audit:merge` (0)

## Related docs

- [02-project-structure.md](./02-project-structure.md) — where to add code
- [architecture/Architecture.md](./architecture/Architecture.md) — layers & data flow
- [architecture/ModeArchitecture.md](./architecture/ModeArchitecture.md) — salaried / family tools
- [10-i18n.md](./10-i18n.md) — languages, scripts, coverage
- [architecture/AdminAnalytics.md](./architecture/AdminAnalytics.md) — admin dashboard, events, migrations
- [src/ui/ARCHITECTURE.md](../src/ui/ARCHITECTURE.md) — profile hub, analytics sections, tools layout

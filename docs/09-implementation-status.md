# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: 14 June 2026 (Family Financial OS Phase 1, 373 tests / 86 engines).

## V1 product scope

| In scope | Out of scope (for now) |
|----------|-------------------------|
| Salaried **single** household | Freelancer, student, business modes (removed; migrated to salaried on load) |
| Salaried **family** household (`householdScope: family`) | Full accounting / ERP / banking |
| **Household rooms** (invite code, local-first + optional Supabase) | Live multi-device join without migration |
| Local-first commitments + pressure + lending | Mass-market spend tracking (Walnut-style) |

**Subscription tiers** (`constants/subscriptionTiers.js`): `free`, `pro`, `power`. Tiers unlock features via `ProGate` / `tierAccess.js` — they are not separate user-facing “modes”. Free caps: 5 lending, 2 chits, 3 goals, 50 spends/mo, 5 splits/mo (3 people), 30-day cashflow; plain-text annual report.

## Shipped — core product

| Area | Status | Key paths |
|------|--------|-----------|
| Home dashboard (scroll layout) | ✅ Current UI | `ui/features/pages/HomePage.jsx`, `dashboard/*`, `home/HomeQuickActions.jsx` |
| Family household UX (combined data + copy) | ✅ | `resolveDataProfileScope()` in `modeExperience.js`; Home, Profile, Analytics |
| Household command panel (Analytics full house) | ✅ Phase 1 | `HouseholdCommandPanel.jsx`, `familyCommandCenter.js`, `useFamilyCommandIntel.js` |
| Household dependents badge + editor | ✅ | `HouseholdFamilyBadge.jsx`, `HouseholdDependentsEditorModal.jsx` — Home + Analytics |
| Family stability score (unified) | ✅ | `familyStabilityScore.js` — one household index |
| Contribution memory (payment history) | ✅ Local | `familyContribution.js` — payer-tag ledger insights |
| Dependency analysis | ✅ | `familyDependency.js` — income concentration, overload |
| Pressure forecast (family) | ✅ | `familyPressureForecast.js` + `familyCalendar.js` |
| Household rooms (create/join, invite code) | ✅ Local-first | `householdRoom*.js`, `HouseholdSetupModal.jsx`, `HouseholdRoomBridge.jsx` |
| Room seat limit (2–20 at create) | ✅ | `settings.householdMemberLimit`; owner can edit in dependents modal |
| Dependents count (0–99) | ✅ | `settings.dependents`; pencil edit on Home/Analytics badge |
| Home safe-to-spend widget | ✅ | `SafeToSpendCard.jsx` on Home when `salaryCreditDay` set |
| Paycheck page `/paycheck` | ✅ | `PaycheckPage.jsx`, `PaycheckTimelinePanel.jsx`, `SafeToSpendCard.jsx` |
| Salary-day bridge | ✅ | `SalaryDayBridge.jsx` — auto-navigate + goal auto-save on credit day |
| Bill health (per-bill + portfolio) | ✅ | `engines/billHealth.js`, `BillCard.jsx`, portfolio score on `CommitmentsBillsTab.jsx` |
| Goals ↔ SIP advisory + linking | ✅ | `sipAdvisor.js`, `GoalsToolPanel.jsx`; SIP payment → `savedAmount` via `goalId` on bill |
| Goal salary-day auto-save | ✅ | `goalAutoSave.js`, checkbox in `GoalsToolPanel.jsx`, `settings.goalAutoSaveRules` |
| Lending recovery UI | ✅ | `LendingOverduePanel.jsx` on `/lending` — overdue installments, mark paid, share notice |
| Recurring spend detection | ✅ | `recurringSpendDetect.js`, inline banner in `DailySpendPanel.jsx` |
| Net worth benchmark engine | ✅ | `netWorthBenchmark.js` (engine + tests; UI card removed — wealth analytics on Profile) |
| Bond advisor v2 | ✅ | `bondAnalyzer.js` — YTM, credit rating, SGB/tax, compare alternatives |
| CA export (Power) | ✅ | `caExport.js` — `.txt` + structured `.json` in `ProfileBackupSection.jsx` |
| Multiple profiles gate | ✅ | `ProfileManager.jsx` gated with `multiple_profiles`; **single mode only** — family uses household rooms |
| AI financial advisor (Pro) | ✅ | `financialAdvisor.js` → `supabase/functions/financial-advisor` (deploy + `ANTHROPIC_API_KEY` on you) |
| Financial pulse + forecast i18n | ✅ | `forecast.js`, `subscriptionLeak.js` return `{ id, tone, params }` |
| Smart pressure notifications | ✅ | `notifications.js` — `{ titleKey, messageKey, params }`; UI via `notificationLabels.js` |
| Engine tests (intelligence, forecast, notifications, pressure) | ✅ | `src/engines/__tests__/*.test.js` |
| Tier gates enforced | ✅ | `audit:tier` in main gate |
| i18n — 22 langs + English | ✅ Infrastructure | `src/i18n/` — `npm run sync:i18n` |

## Shipped — admin intelligence (internal)

| Area | Status | Key paths |
|------|--------|-----------|
| Product analytics pipeline | ✅ | `services/analytics/*`, `app/AnalyticsBridge.jsx` |
| Admin dashboard `/admin` | ✅ | `ui/features/pages/AdminPage.jsx` |

## Shipped — payments & legal (backend-heavy)

| Area | Status | Key paths |
|------|--------|-----------|
| Razorpay checkout (client) | ✅ Wired | `services/razorpaySubscription.js`, `PlansModal.jsx` |
| Server payment verify | ✅ Edge Function | `supabase/functions/razorpay-checkout` — deploy + secrets |
| Promissory note engine (India) | ✅ | `engines/lendingAgreement.js` |

### Settings fields (profile)

| Field | Purpose |
|-------|---------|
| `salaryCreditDay` | Day of month (1–31) — paycheck timeline, safe-to-spend, salary-day bridge |
| `goalAutoSaveRules` | `[{ goalId, amount }]` — auto credit goals on salary day |
| `goalAutoSaveLastRun` | `yyyy-MM-dd` — once-per-day guard |

## Deferred — UI phases

| Phase | Description |
|-------|-------------|
| Full i18n on all screens | ~1,400+ locale slots still English fallback; run `npm run i18n:translate:all` before release |
| OS launcher home | Status bar + module tile grid instead of scroll dashboard |
| Legal details modal | `LegalDetailsModal` + lender/borrower confirmation screens |
| Account Aggregator bank sync | Competitive gap — manual import only today |
| Live CIBIL / MF CAS import | Not started |

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | For cloud auth | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For cloud auth | Supabase anon key |
| `VITE_RAZORPAY_KEY_ID` | For paid upgrades | Razorpay checkout |

Edge Function secrets (Supabase Dashboard): `ANTHROPIC_API_KEY` (advisor), `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.

**Pre-deploy checklist:** deploy `financial-advisor` + `razorpay-checkout`; apply migrations; set edge secrets.

## Tests & quality

- **373** unit tests (`npm test`) — **86/86** engine modules have dedicated tests (`npm run audit:engine-tests`)
- Focused: `npm run test:sync`, `npm run test:engines`, `npm run test:utils`
- Gate: `npm run audit` — env, deps, CSS, UI, copy tone, i18n, tier gates, insight i18n, code+depth, tests, types, build
- Pre-release bundle: `npm run audit:pre-release` — full gate + governance + docs-sync + engine-test count
- Strict: `npm run audit -- --strict` — also fails on i18n hardcoded + English fallback threshold
- Family/household: `npm run audit:household` — mode isolation + profile-scope wiring
- Advisory audits: `audit:notification-i18n`, `audit:docs-sync`, `audit:profile-scope`, `audit:edge-functions`, `audit:pro-features-built`, `audit:insight-registry`
- Engine coverage: `npm run audit:engine-tests` (86/86) · depth: `npm run audit:complexity` · purity: `npm run audit:engines`

## Related docs

- [02-project-structure.md](./02-project-structure.md)
- [10-i18n.md](./10-i18n.md)
- [src/ui/ARCHITECTURE.md](../src/ui/ARCHITECTURE.md)

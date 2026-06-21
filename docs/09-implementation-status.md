# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: **21 June 2026** (OTA v1.0.3 live, Money Wealth tab, dedup kills 3–6, Plan wealth sim).

Planning docs: [`docs/planning/perovo-gap-analysis.md`](./planning/perovo-gap-analysis.md) · [`docs/planning/perovo-QA-framework.md`](./planning/perovo-QA-framework.md) · [`docs/qa-findings.md`](./qa-findings.md)

## V1 product scope

| In scope | Out of scope (for now) |
|----------|-------------------------|
| Salaried **single** household | Freelancer, student, business modes (removed; migrated to salaried on load) |
| Salaried **family** household (`householdScope: family`) | Full accounting / ERP / banking |
| **Household rooms** (invite code, local-first + optional Supabase) | Live multi-device join without migration |
| Local-first commitments + pressure + lending | Mass-market spend tracking (Walnut-style) |

**Subscription tiers** (`constants/subscriptionTiers.js`): `free`, `pro`, `power`. Tiers unlock features via `ProGate` / `tierAccess.js`. Free caps: 5 lending, 2 chits, 3 goals, 50 spends/mo, 5 splits/mo (3 people), 30-day cashflow.

## Shipped — navigation & IA (redesign)

| Area | Status | Key paths |
|------|--------|-----------|
| Bottom nav Home · Money · + · Plan · **You** | ✅ | `constants/userModes.js` — route `/profile`, label `nav.you` |
| Money tab shell (Bills / Spends / Lending / Insights / **Wealth**) | ✅ | `MoneyShellPage.jsx`, `/money/*` in `App.jsx` |
| Plan tab `/plan` | ✅ | `PlanPage.jsx` |
| You hub + 11 sub-pages `/you/*` | ✅ | `ProfilePage.jsx`, `profile/pages/You*.jsx` |
| Analytics deep-link | ✅ | `/analytics` → `/money/insights` |
| Paycheck deep-link | ✅ | `/paycheck` → `/money/insights` |
| Net worth deep-links | ✅ | `/net-worth`, `/profile/analytics` → `/money/wealth` |
| Legacy redirects | ✅ | `/commitments`, `/lending`, `/tools` → Money or Plan |

## Shipped — Home (H1–H6 partial)

| Area | Status | Key paths |
|------|--------|-----------|
| Conic pressure hero + Perovo Score | ✅ | `home/HomePressureHero.jsx`, `PressureRing.jsx` |
| Safe-to-spend in hero caption | ✅ | `HomePressureHero.jsx` (no duplicate SafeToSpendCard on Home) |
| Needs Attention (single overdue block) | ✅ | `home/HomeNeedsAttention.jsx` |
| Four quick actions | ✅ | `home/HomeQuickActions.jsx` |
| Tools entry row → Plan | ✅ | `home/HomeToolsEntry.jsx` |
| Design tokens (partial) | ✅ | `tokens.css`, `components.css` — `ct-hero-card`, `ct-stat-tile`, gradients |

## Shipped — Money (M1–M5 + analytics partial)

| Area | Status | Key paths |
|------|--------|-----------|
| Bills / Spends / Lending shells | ✅ | `CommitmentsPage`, `SpendsPage`, `LendingPage` under Money |
| Insights (4th pill) | ✅ | `AnalyticsPage.jsx` embedded at `/money/insights` |
| **Wealth (5th pill)** | ✅ | `MoneyWealthPage.jsx` — `WealthAnalyticsSection` + `ProfileNetWorthSection` |
| Asset/liability ledger | ✅ | `ProfileNetWorthSection.jsx`, `WealthEntryCard` / `WealthEntryModal` |

## Shipped — Plan (S2–S6 partial)

| Area | Status | Key paths |
|------|--------|-----------|
| Goals hero + tool grid | ✅ | `PlanGoalsSection.jsx`, `PlanCalculatorsSection.jsx`, `PlanGrowthSection.jsx` |
| Tools as bottom sheets | ✅ | `PlanToolSheet.jsx`, `planToolPanels.jsx` |
| **Wealth simulation (10-yr)** | ✅ | Plan Growth → `PlanWealthSimulationPanel` → `SimulationPanel` |
| Scenarios (quick what-if) | ✅ | Plan Growth → `UnifiedScenariosPanel` (separate from wealth sim) |

## Shipped — You tab (Y1–Y4)

| Area | Status | Key paths |
|------|--------|-----------|
| Identity hero (net worth, score, goals) | ✅ | `profile/hub/ProfileFinancialHero.jsx` — NW → `/money/wealth` |
| Inline settings groups (no sheet) | ✅ | `ProfileSettingsGroups.jsx` |
| Admin entry (admin-only) | ✅ | `ProfileAdminEntry.jsx` |
| Sub-page push navigation | ✅ | `/you/personal` … `/you/plans` |
| Metric dedup links | ✅ | `MetricOwnerLink.jsx`, slim `ProfileQuickStatsStrip.jsx` |

## Shipped — Admin (A1–A2)

| Area | Status | Key paths |
|------|--------|-----------|
| Command bar + KPI strip | ✅ | `AdminPage.jsx`, `AdminMetricCard.jsx` |
| Revenue / adoption / health sections | ✅ | `AdminPage.jsx`, `adminExport.js` |
| User detail drawer | ✅ | `AdminUserDetailDrawer.jsx` |

## Shipped — OTA updates (Capacitor)

| Area | Status | Key paths |
|------|--------|-----------|
| Capgo notify-first boot | ✅ | `capgo-notify-only.js`, Vite plugin |
| Relative OTA asset paths | ✅ | `build-ota-bundle.mjs` (`VITE_BASE_PATH=./`) |
| I18n boot crash fix | ✅ | `useTranslation` fallback; `I18nProvider` in `renderApp.jsx`; `BootShell` |
| OTA reset on test shell | ✅ | `resetNativeOtaBundle`, Update test Reset button |
| **Live deploy** | ✅ | **v1.0.3** on GitHub Pages + `app-bundle.zip` |

## Shipped — duplication kills (partial)

| Kill | Status | Notes |
|------|--------|-------|
| KILL 1–2 Home money + attention | ✅ | Safe-to-spend in hero; single Needs Attention |
| KILL 3 Pressure on secondary screens | ✅ | Insights: score tiles only (no `FinancialPulseCard`); scores detail links Home; wealth tab links Home for pressure |
| KILL 4 Net worth fragmentation | ✅ | Primary: `/money/wealth`; You hero links there; `/net-worth` redirects |
| KILL 5 Overdue duplication | ✅ | Removed `SchoolFeeCard` from Insights; pulse card removed from Insights |
| KILL 6 Survival duplication | ✅ | Money planner what-if → link to Insights |

## Shipped — core product (unchanged highlights)

| Area | Status | Key paths |
|------|--------|-----------|
| Household rooms | ✅ | `householdRoom*.js`, `HouseholdRoomBridge.jsx` |
| Bill OCR + permissions | ✅ | `BillScannerTool.jsx`, `nativePermissions.js` |
| Lending + legal agreements | ✅ | `lendingAgreement.js`, `LendingPage.jsx` |
| Razorpay + server verify | ✅ | `razorpaySubscription.js`, edge `razorpay-checkout` |
| i18n — 22 langs + English | ✅ | `src/i18n/` |

## Deferred / in progress

| Phase | Description |
|-------|-------------|
| UI completion sweep | Apply modern tokens to remaining feature files (~145-file pass) — tools/forms with legacy Tailwind |
| Full i18n translate pass | Run `npm run i18n:translate:all` before non-English launch |
| Account Aggregator bank sync | Not started |
| Live Razorpay sandbox QA | QA-10 — manual payment test |

## Tests & quality

- **386+** unit tests (`npm test`); engine tests: `npm run test:engines`
- Gate: `npm run audit`
- QA framework: `docs/planning/perovo-QA-framework.md` (26 prompts)
- Latest audit notes: `docs/qa-findings.md`

## Related docs

- [02-project-structure.md](./02-project-structure.md)
- [10-i18n.md](./10-i18n.md)
- [src/ui/ARCHITECTURE.md](../src/ui/ARCHITECTURE.md)

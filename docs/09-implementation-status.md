# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: **21 June 2026** (OTA I18n boot fix v1.0.2, Money Insights tab, You nav).

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
| Money tab shell (Bills / Spends / Lending / **Insights**) | ✅ | `MoneyShellPage.jsx`, `/money/*` in `App.jsx` |
| Plan tab `/plan` | ✅ | `PlanPage.jsx` |
| You hub + 11 sub-pages `/you/*` | ✅ | `ProfilePage.jsx`, `profile/pages/You*.jsx` |
| Analytics deep-link | ✅ | `/analytics` → `/money/insights` |
| Paycheck deep-link | ✅ | `/paycheck` → `/money/insights` |
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

## Shipped — You tab (Y1–Y4)

| Area | Status | Key paths |
|------|--------|-----------|
| Identity hero (net worth, score, goals) | ✅ | `profile/hub/ProfileFinancialHero.jsx` |
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
| I18n boot crash fix (OTA) | ✅ | `I18nProvider` wraps app root; `useTranslationOptional` on loaders |
| Update test shell | ✅ | `apk:update-test`, `UpdateTestShell.jsx` |
| **Deploy required** | ⚠️ | Ship **v1.0.2** OTA + rebuild `apk:update-test` |

## Shipped — core product (unchanged highlights)

| Area | Status | Key paths |
|------|--------|-----------|
| Household rooms | ✅ | `householdRoom*.js`, `HouseholdRoomBridge.jsx` |
| Bill OCR + permissions | ✅ | `BillScannerTool.jsx`, `nativePermissions.js` |
| Lending + legal agreements | ✅ | `lendingAgreement.js`, `LendingPage.jsx` |
| Net worth engines + wealth page | ✅ | `engines/netWorth/*`, `/net-worth` |
| Razorpay + server verify | ✅ | `razorpaySubscription.js`, edge `razorpay-checkout` |
| i18n — 22 langs + English | ✅ | `src/i18n/` |

## Deferred / in progress

| Phase | Description |
|-------|-------------|
| UI completion sweep | Apply modern tokens to remaining feature files (~145-file pass) |
| Duplication kills 3–6 | Further trim pressure/net worth/survival on secondary screens |
| Net worth section inside Money tab | Wealth still primary at `/net-worth`; optional Money subsection |
| Wealth simulation entry in Plan Growth | Engine exists; Plan UI entry TBD |
| Full i18n translate pass | Run `npm run i18n:translate:all` before non-English launch |
| Account Aggregator bank sync | Not started |

## Tests & quality

- **386+** unit tests (`npm test`); engine tests: `npm run test:engines`
- Gate: `npm run audit`
- QA framework: `docs/planning/perovo-QA-framework.md` (26 prompts)
- Latest audit notes: `docs/qa-findings.md`

## Related docs

- [02-project-structure.md](./02-project-structure.md)
- [10-i18n.md](./10-i18n.md)
- [src/ui/ARCHITECTURE.md](../src/ui/ARCHITECTURE.md)

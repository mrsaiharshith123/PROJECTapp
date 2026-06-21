# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: **21 June 2026** (v1.0.5 — chaos-first QA suite replaces 140 legacy tests).

Planning docs: [`docs/planning/perovo-gap-analysis.md`](./planning/perovo-gap-analysis.md) · [`docs/planning/perovo-QA-framework.md`](./planning/perovo-QA-framework.md) · [`docs/planning/perovo-qa-system-prompt.md`](./planning/perovo-qa-system-prompt.md) · [`docs/qa-findings.md`](./qa-findings.md)

## V1 product scope

| In scope | Out of scope (for now) |
|----------|-------------------------|
| Salaried **single** household | Freelancer, student, business modes (removed; migrated to salaried on load) |
| Salaried **family** household (`householdScope: family`) | Full accounting / ERP / banking |
| **Household rooms** (invite code, local-first + optional Supabase) | Live multi-device join without migration |
| Local-first commitments + pressure + lending | Mass-market spend tracking (Walnut-style) |
| **Account Aggregator bank sync** | Deferred to post-V1 (no schema/UI yet) |

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

## Shipped — Home (H1–H6)

| Area | Status | Key paths |
|------|--------|-----------|
| Conic pressure hero + Perovo Score | ✅ | `home/HomePressureHero.jsx`, `PressureRing.jsx` |
| Safe-to-spend in hero caption | ✅ | `HomePressureHero.jsx` |
| Needs Attention (single overdue block) | ✅ | `home/HomeNeedsAttention.jsx` |
| Four quick actions | ✅ | `home/HomeQuickActions.jsx` |
| Tools entry row → Plan | ✅ | `home/HomeToolsEntry.jsx` |
| Design tokens | ✅ | `tokens.css`, `components.css` |

## Shipped — Money + Add (M1–M5)

| Area | Status | Key paths |
|------|--------|-----------|
| Bills / Spends / Lending shells | ✅ | Under Money shell |
| Insights (4th pill) | ✅ | `AnalyticsPage.jsx` at `/money/insights` |
| Wealth (5th pill) | ✅ | `MoneyWealthPage.jsx` |
| Add 2-step flow + scan tile | ✅ | `AddPage.jsx`, `AddTypePicker.jsx` |
| Bills hero + filter chips | ✅ | `BillsHeroSummary.jsx`, `CommitmentsBillsTab.jsx` |

## Shipped — Plan (S2–S6)

| Area | Status | Key paths |
|------|--------|-----------|
| Goals hero + tool grid | ✅ | `PlanGoalsSection.jsx`, `PlanCalculatorsSection.jsx`, `PlanGrowthSection.jsx` |
| Tools as bottom sheets | ✅ | `PlanToolSheet.jsx` |
| Wealth simulation (10-yr) | ✅ | `PlanWealthSimulationPanel` → `SimulationPanel` |
| Scenarios (quick what-if) | ✅ | `UnifiedScenariosPanel` |

## Shipped — You tab (Y1–Y4)

| Area | Status | Key paths |
|------|--------|-----------|
| Identity hero + vital stats | ✅ | `ProfileFinancialHero.jsx` |
| Settings colored rows | ✅ | `ProfileSettingsGroups.jsx` |
| Admin entry | ✅ | `ProfileAdminEntry.jsx` |
| Sub-page push navigation | ✅ | `/you/*` |

## Shipped — Admin (A1–A2)

| Area | Status | Key paths |
|------|--------|-----------|
| Command bar + KPI strip | ✅ | `AdminPage.jsx` |
| Revenue / adoption / health | ✅ | Admin sections + export |
| User detail drawer | ✅ | `AdminUserDetailDrawer.jsx` |

## Shipped — OTA (Capacitor)

| Area | Status | Key paths |
|------|--------|-----------|
| Capgo notify-first + relative paths | ✅ | `capgo-notify-only.js`, `build-ota-bundle.mjs` |
| I18n boot fix + BootShell | ✅ | `renderApp.jsx`, `I18nProvider.jsx` |
| Live **v1.0.5** | ✅ | GitHub Pages + `app-bundle.zip` |

## Shipped — duplication kills (KILL 1–6)

| Kill | Status |
|------|--------|
| Home money + attention duplicates | ✅ |
| Pressure on secondary screens | ✅ MetricOwnerLink pattern |
| Net worth fragmentation | ✅ `/money/wealth` primary |
| Overdue duplication | ✅ Single owners on Home + Bills |
| Survival duplication | ✅ Insights owner; planner links |
| Family dashboard outlook | ✅ Links to Home / Insights |

## Shipped — UI completion sweep (Phase 8)

| Area | Status |
|------|--------|
| Tools (Chit, Bond, Loan payoff) | ✅ `ct-*` tokens |
| Forms + modals legacy Tailwind | ✅ Migrated |
| Charts | ✅ `ct-chart-shell` |
| Patterns (ToneSurface, CategoryChip) | ✅ Token classes |
| FinancialPulseCard trim | ✅ MetricOwnerLink for survival |

## Shipped — QA system (v1.0.5)

| Area | Status | Key paths |
|------|--------|-----------|
| Chaos-first test suites (8) | ✅ | `tests/suites/*.test.mjs` |
| Terminal QA reporter | ✅ | `tests/qa-runner.mjs` — `npm run qa` |
| Shared fixtures | ✅ | `tests/fixtures.mjs` |
| Legacy `src/**/__tests__` removed | ✅ | 0 files under `src/` |
| Engine null-safety guards | ✅ | `burden.js`, `pressureScore.js` |

## Shipped — QA fixes (automated pass)

| Area | Status |
|------|--------|
| Razorpay order failure toast | ✅ `plans.orderFailed` |
| Chaos QA suite | ✅ `npm test` · `npm run qa` |
| i18n key parity | ✅ `npm run sync:i18n` + translate pass |

## Explicitly deferred (post-V1)

| Item | Reason |
|------|--------|
| Account Aggregator bank sync | No product schema; not in V1 scope |
| Live Razorpay sandbox payment | Requires manual test with real sandbox keys on device |
| Full WCAG audit (QA-15) | Run before public store launch |

## Tests & quality

- **105** chaos-first tests (`npm test`) across 8 suites under `tests/suites/`
- **QA reporter:** `npm run qa` (P0/P1 severity, CI exit codes)
- Gate: `npm run audit`
- QA system spec: `docs/planning/perovo-qa-system-prompt.md`

## Related docs

- [02-project-structure.md](./02-project-structure.md)
- [10-i18n.md](./10-i18n.md)
- [src/ui/ARCHITECTURE.md](../src/ui/ARCHITECTURE.md)

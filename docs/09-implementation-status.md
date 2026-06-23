# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update this when you land a major feature or defer UI work.

Last reviewed: **23 June 2026** (governance pass — dead code, lint, i18n sync, lending→Agreements cleanup).

Planning docs: [`docs/planning/perovo-gap-analysis.md`](./planning/perovo-gap-analysis.md) · [`docs/planning/perovo-QA-framework.md`](./planning/perovo-QA-framework.md) · [`docs/planning/perovo-qa-system-prompt.md`](./planning/perovo-qa-system-prompt.md) · [`docs/qa-findings.md`](./qa-findings.md)

## Shipped — score / analytics / settings (June 2026)

| Area | Status | Key paths |
|------|--------|-----------|
| Focused score page | ✅ | `/score-detail` · `ScoreDetailPage.jsx` |
| Profile scores accordion | ✅ | `ProfileScoresDetailPage.jsx` |
| Analytics 3-section layout | ✅ | `AnalyticsPage.jsx` — pulse · spending · household |
| Net worth overflow guards | ✅ | `components.css`, `MoneyWealthPage.jsx` |
| Settings colored icon tiles | ✅ | `ProfileSettingsGroups.jsx`, `SettingsGroup.jsx` |
| Household warm invitation | ✅ | `HouseholdModeSection.jsx`, `ProfileSettingsGroups.jsx` |

## Shipped — feature cleanup (removed from UI)

| Removed from screen | Kept in repo (engine/UI file) | Replacement |
|---------------------|-------------------------------|-------------|
| Bill split modal entry | `BillSplitModal.jsx` | — (Splitwise-style flows deferred) |
| Bond advisor tool grid | `BondAdvisor.jsx` | — |
| Festival planner card | *(file deleted — unused)* | Smart notifications when relevant |
| Family calendar widget | *(file deleted — unused)* | `CashflowCalendarStrip` on Insights |
| Loan tools menu tile | `LoanToolsPanel.jsx` | Contextual link on EMI `BillCard` |
| Income sensitivity panel | engine kept | — |
| Setu AA / BBPS / Stream chat | removed | Deferred post-V1 |

## Shipped — Personal Asset OS

| Area | Status | Key paths |
|------|--------|-----------|
| Physical asset fields in wealth modal | ✅ | `WealthEntryModal.jsx`, `wealthStorage.js` |
| Physical assets section | ✅ | `PhysicalAssetsSection.jsx` |
| CAGR + AI insight per asset | ✅ | `WealthEntryCard.jsx`, `assetInsight.js` |
| Gold auto-price suggestion | ✅ | `physicalAssetHelpers.js`, `goldPrice.js` |
| Vehicle depreciation estimate | ✅ | `vehicleDepreciation.js` |
| Debt pillar from net worth | ✅ | `ScoreDetailPage.jsx` |

## Removed — unreachable UI (audit cleanup)

These files had no route/import chain from `App.jsx` and were deleted:

- `AnalyticsScoreTiles.jsx` (scores live on `/score-detail` + profile scores)
- `FamilyCalendarWidget.jsx`, `FestivalPlannerCard.jsx` (feature cleanup)
- `PaycheckPage.jsx`, `PaycheckTimelinePanel.jsx`, `SafeToSpendCard.jsx` (paycheck → `/money/insights`)
- `ProfileWealthAnalyticsPage.jsx` (wealth → `/money/wealth` · `MoneyWealthPage.jsx`)
- `PlanPage.jsx`, `PlanAISection.jsx` (plan → `/you/tools` · `YouToolsPage.jsx`)
- `HomeGoalNudge.jsx`, `HomePressureHero.jsx`, `HomeToolsEntry.jsx` (replaced by `HomeNetPositionHero`, `HomeQuickActions`, `HomeToolsPreview`)
- `LendingPage.jsx`, `LendingEntryCard.jsx`, `LendingHeroSummary.jsx` (lending → **Agreements** tab · `AgreementsPage.jsx`)
- `appRouter.jsx`, `app/layouts/*`, `ModeRoute.jsx`, `ToolsRedirect.jsx` (unused router scaffold; live routes in `App.jsx`)
- `engines/paycheckTimeline.js` (paycheck UI removed; salary flow in `salaryBreakdown.js` + Analytics)

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
| Top nav Home · Ledger · Agreements · **You** + Add | ✅ | `constants/userModes.js`, `Navbar.jsx` |
| Money routes (Bills / Spends only in shell) | ✅ | `MoneyShellPage.jsx` — `/money/bills`, `/money/spends` |
| Standalone analytics & wealth | ✅ | `/money/insights` · `AnalyticsPage.jsx`; `/money/wealth` · `MoneyWealthPage.jsx` |
| Tools & calculators | ✅ | `/you/tools` · `YouToolsPage.jsx` (legacy `/plan`, `/tools` redirect here) |
| You hub + sub-pages `/you/*` | ✅ | `ProfilePage.jsx`, `profile/pages/You*.jsx` |
| Ledger insights → net worth | ✅ | `LedgerPage.jsx` → `/money/wealth` |
| Analytics deep-link | ✅ | `/analytics` → `/money/insights` |
| Legacy redirects | ✅ | `/commitments`, `/lending`, `/money/lending` → Agreements or Money |

## Shipped — Home (H1–H6)

| Area | Status | Key paths |
|------|--------|-----------|
| Net position hero + score ring | ✅ | `home/HomeNetPositionHero.jsx` |
| Category tiles (assets / liabilities / agreements) | ✅ | `home/HomeCategoryTiles.jsx` |
| Quick actions above needs-attention | ✅ | `home/HomeQuickActions.jsx` |
| Needs Attention (overdue + due bills) | ✅ | `home/HomeNeedsAttention.jsx` |
| Tools preview + See all → You/tools | ✅ | `home/HomeToolsPreview.jsx` |
| Design tokens | ✅ | `tokens.css`, `components.css` |

## Shipped — Money + Add (M1–M5)

| Area | Status | Key paths |
|------|--------|-----------|
| Bills / Spends shells | ✅ | Under Money shell (`/money/bills`, `/money/spends`) |
| Informal lending | ✅ | **Agreements** tab — `AgreementsPage.jsx` (not Money shell) |
| Monthly analytics | ✅ | `AnalyticsPage.jsx` at `/money/insights` |
| Net worth / ledger insights | ✅ | `MoneyWealthPage.jsx` at `/money/wealth` |
| Add 2-step flow + scan tile | ✅ | `AddPage.jsx`, `AddTypePicker.jsx` |
| Bills hero + filter chips | ✅ | `BillsHeroSummary.jsx`, `CommitmentsBillsTab.jsx` |

## Shipped — Tools (You → Tools)

| Area | Status | Key paths |
|------|--------|-----------|
| Goals + calculator grid | ✅ | `PlanGoalsSection.jsx`, `PlanCalculatorsSection.jsx`, `PlanGrowthSection.jsx` on `YouToolsPage.jsx` |
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
| Chaos-first test suites (8) | ✅ | `tests/suites/*.test.mjs` — **105** tests |
| Colocated unit tests | ✅ | `src/**/__tests__/` — engine/utils/service coverage |
| Terminal QA reporter | ✅ | `tests/qa-runner.mjs` — `npm run qa` |
| Shared fixtures | ✅ | `tests/fixtures.mjs` |
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

## Shipped — lending, bill health & exports

| Area | Status | Key paths |
|------|--------|-----------|
| Per-bill health scores | ✅ | `engines/billHealth.js`, `BillCard.jsx`, profile scores |
| CA-ready summary export | ✅ | `engines/caExport.js`, `ProfileBackupSection.jsx` |
| Lending profile share (deal) | ✅ | `lendingShareCard.js`, `LendingDetailDashboard.jsx` |

## Shipped — household data scope

| Area | Status | Key paths |
|------|--------|-----------|
| Family combined data scope | ✅ | `resolveDataProfileScope()` in `modeExperience.js` |
| Household command panel | ✅ | `HouseholdCommandPanel.jsx` on Insights |
| Dependents editor + badge | ✅ | `HouseholdDependentsEditorModal.jsx`, `HouseholdFamilyBadge.jsx` |
| Household room (invite code) | ✅ | `HouseholdSetupModal.jsx`, `/family-room` |

## Tests & quality

- **105** chaos-first tests (`npm test`) across 8 suites under `tests/suites/`
- Colocated engine/utils tests under `src/**/__tests__/` (not in default `npm test` include — run via Vitest path if needed)
- **QA reporter:** `npm run qa` (P0/P1 severity, CI exit codes)
- **Gate:** `npm run audit` (lint, Knip, UI depth, governance tree, types, build)
- QA system spec: `docs/planning/perovo-qa-system-prompt.md`

## Related docs

- [02-project-structure.md](./02-project-structure.md)
- [10-i18n.md](./10-i18n.md)
- [src/ui/ARCHITECTURE.md](../src/ui/ARCHITECTURE.md)

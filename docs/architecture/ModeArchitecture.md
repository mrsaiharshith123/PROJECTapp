# User mode architecture

Modes are configured in `constants/userModes.js` and `constants/modeExperience.js`.

Registry: `src/governance/registries/modes.js`

## Selectable modes (Profile / onboarding)

| Pick | Experience | Dashboard |
|------|------------|-----------|
| Salaried | Personal salary & bills | `ModeIntelligenceSection.jsx` (survival panel) |
| Salaried + household scope **family** | Household | `FamilyModeDashboard.jsx` |

## Legacy saves (migrated on load)

- **family** → `userMode: salaried`, `householdScope: family`
- **power** → `userMode: salaried`, `subscriptionTier: power`
- **freelancer** / **student** (removed) → `userMode: salaried`

## Shared across modes

- Burden, forecast, pressure scoring
- Commitments & payments model
- Dashboard primitives: `ui/features/dashboard/shared/*`

## Home composition

1. `HomeOverviewCard` → `HeroMonthCard` — month hero (Financial Life palette): scheduled / paid / unpaid chips, **free cash** + stress copy + **variable spend** tile, salary progress bar (green→red), cumulative spend sparkline → `/analytics`
2. KPI row — `getHomeKpiTiles()` in `config/modeDashboardMetrics.js`
3. `ModeIntelligenceSection` — one mode dashboard
4. `FinancialPulseCard` — shared pulse

## Isolation rules

- Mode-specific engines should only be imported from hooks, dashboard panels, or `modeExperience.js`.
- Audit: `npm run audit:modes`.

## Tools per mode

`MODE_TOOL_IDS` in `modeExperience.js` drives calculator tiles on Home.

**Current tool ids (all salaried experiences):**

| Id | Panel / modal |
|----|----------------|
| `planner` | `MoneyPlannerPanel` — Afford · Scenarios · Goals (`UnifiedScenariosPanel` on Scenarios tab) |
| `loan` | `LoanToolsPanel` — Extra EMI · Timing · Payoff order |
| `insurance` | `InsuranceCalculatorModal` |
| `chit` | `ChitFundAdvisor` |
| `bond` | `BondAdvisor` (Power tier) |
| `incomeTax` | `IncomeTaxPanel` |

Reorder per mode via `settings.dashboardToolOrderByMode` (persisted in `migrateStorage.js`).

## Subscription vs mode

- **User mode** = salaried + `householdScope` (`single` | `family`).
- **Subscription tier** = `free` | `pro` | `power` — unlocks backup, reports, `ProGate` features.
- Legacy save `userMode: power` migrates to `subscriptionTier: power`, `userMode: salaried`.

See [../09-implementation-status.md](../09-implementation-status.md) for V1 scope.

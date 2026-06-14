# User mode architecture

Modes are configured in `constants/userModes.js` and `constants/modeExperience.js`.

Registry: `src/governance/registries/modes.js`

## Selectable modes (Profile / onboarding)

| Pick | Experience | Dashboard |
|------|------------|-----------|
| Salaried | Personal salary & bills | `ModeIntelligenceSection.jsx` (survival panel) |
| Salaried + household scope **family** | Household (combined income, shared bills, household net worth) | `FamilyModeDashboard.jsx`, `HouseholdHubSection.jsx` |

## Family data scope

When `isSalariedFamily(settings)`:

- **`resolveDataProfileScope(settings)`** returns `null` — month summaries, analytics, and net worth include **all profiles** (household combined).
- **`combinedMonthlyIncome(settings)`** — primary + spouse income fields.
- **`householdMemberLimit(settings)`** — you + partner + dependents, capped at 6.
- **Household rooms** — local-first registry (`householdRoomLocal.js`) with cloud fallback (`householdRoomService.js`); migration `supabase/migrations/20260614000000_household_rooms.sql`.

Copy rules: `.cursor/rules/family-mode-copy.mdc`. Audit: `npm run audit:household`.

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
| `planner` | `MoneyPlannerPanel` — Afford · Scenarios · Goals |
| `advisor` | `FinancialAdvisorTool` — AI on your numbers (Pro) |
| `loan` | `LoanToolsPanel` — Extra EMI · Timing · Payoff order |
| `insurance` | `InsuranceCalculatorModal` |
| `chit` | `ChitFundAdvisor` |
| `bond` | `BondAdvisor` (Power tier) |
| `incomeTax` | `IncomeTaxPanel` — Tax + HRA |
| `retirement` | `RetirementPlannerPanel` — EPF · PPF · NPS · gratuity |
| `safety` | `SafetyPlannerPanel` — emergency fund only |
| `invest` | `InvestSavingsPanel` — SIP · FD/RD (misplaced subs from Safety/Retirement) |

Reorder per mode via `settings.dashboardToolOrderByMode` (persisted in `migrateStorage.js`).

## Subscription vs mode

- **User mode** = salaried + `householdScope` (`single` | `family`).
- **Subscription tier** = `free` | `pro` | `power` — unlocks backup, reports, `ProGate` features.
- Legacy save `userMode: power` migrates to `subscriptionTier: power`, `userMode: salaried`.

See [../09-implementation-status.md](../09-implementation-status.md) for V1 scope.

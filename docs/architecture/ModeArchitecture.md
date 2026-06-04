# User mode architecture

Modes are configured in `constants/userModes.js` and `constants/modeExperience.js`.

Registry: `src/governance/registries/modes.js`

## Selectable modes (Profile / onboarding)

| Pick | Experience | Dashboard |
|------|------------|-----------|
| Salaried | Personal salary & bills | `ModeIntelligenceSection.jsx` (survival panel) |
| Salaried + household scope **family** | Household | `FamilyModeDashboard.jsx` |
| Business | Operating cashflow | `BusinessModeDashboard.jsx` |

## Legacy saves (migrated on load)

- **family** → `userMode: salaried`, `householdScope: family`
- **power** → `userMode: salaried`, `subscriptionTier: power`
- **freelancer** / **student** (removed) → `userMode: salaried`

## Shared across modes

- Burden, forecast, pressure scoring
- Commitments & payments model
- Dashboard primitives: `ui/features/dashboard/shared/*`

## Home composition

1. `HomeOverviewCard` — month hero
2. KPI row — `getHomeKpiTiles()` in `config/modeDashboardMetrics.js`
3. `ModeIntelligenceSection` — one mode dashboard
4. `FinancialPulseCard` — shared pulse

## Isolation rules

- Mode-specific engines should only be imported from hooks, dashboard panels, or `modeExperience.js`.
- Audit: `npm run audit:modes`.

## Tools per mode

`MODE_TOOL_IDS` in `modeExperience.js` drives calculator tiles on Home.

# Feature registry

Source of truth: `src/governance/registries/features.js`

| ID | Name | UI | Engines |
|----|------|-----|---------|
| `home-dashboard` | Home dashboard | `HomePage`, `dashboard/*` | stability, survival, burden, forecast |
| `commitments` | Bills | `CommitmentsPage`, bill modals | reminders, forecastSeries |
| `lending` | Money / lending | `LendingPage`, `lending/*` | lendingTrust, lendingAgreement |
| `analytics` | Analytics | `AnalyticsPage`, `analytics/*` | analyticsSeries, salaryBreakdown |
| `calculators` | Dashboard tools | `DashboardTools`, `tools/*` | affordability, loanPayoff, chit, bond, … |
| `profile` | Profile | `ProfilePage`, `profile/*` | (services: auth, backup) |
| `notifications` | Bell / reminders | `NotificationPanel` | notifications, reminders |
| `onboarding` | First-run | `OnboardingPage` | — |

## Adding a feature

1. Add row to `features.js` registry.
2. Implement under `ui/features/<area>/`.
3. Add engine logic in `engines/` + tests in `engines/__tests__/`.
4. Wire route in `App.jsx`.
5. Run `npm run audit:features`.

## Dependency rules

- Features should not import sibling feature folders — use `primitives/`, `patterns/`, or shared hooks.
- Hooks must not import `ui/features/` directly.

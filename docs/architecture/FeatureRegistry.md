# Feature registry

Source of truth: `src/governance/registries/features.js`

| ID | Name | UI | Engines |
|----|------|-----|---------|
| `home-dashboard` | Home dashboard | `HomePage`, `dashboard/*` | stability, survival, burden, forecast |
| `commitments` | Bills | `CommitmentsPage` (recurring + variable spend tabs), bill modals, `DailySpendPanel` | reminders, forecastSeries, `dailySpends` utils |
| `lending` | Money / lending | `LendingPage`, `LendingProfileCard`, `lending/*` | lendingTrust, lendingAgreement, lendingProfileShare |
| `analytics` | Analytics | `AnalyticsPage`, `analytics/*` | analyticsSeries, salaryBreakdown, subscriptionLeak |
| `net-worth` | Financial life / net worth | `ProfileFinancialHero`, `netWorth/*` | netWorth engines, `useNetWorthIntel` |
| `calculators` | Dashboard tools | `DashboardTools`, `tools/*` | affordability, loanPayoff, chit, bond, incomeTax, … |
| `profile` | Profile | `ProfilePage`, `ProfileScoresDetailPage`, `profile/*` | `useProfileScoreGuide`; cloud via `services/sync`; `PlansModal` for upgrades |
| `subscriptions` | Pro / Power gates | `ProGate`, `PlansButton`, `PlansModal` | `subscriptionTiers.js` |
| `notifications` | Bell / reminders | `NotificationPanel` | notifications, reminders |
| `onboarding` | First-run | `OnboardingPage` | — |
| `admin-intelligence` | Product intelligence (internal) | `AdminPage`, `admin/AdminFloatingButton` | `analytics/*`, `admin_product_overview` RPC |

## Adding a feature

1. Add row to `features.js` registry.
2. Implement under `ui/features/<area>/`.
3. Add engine logic in `engines/` + tests in `engines/__tests__/`.
4. Wire route in `App.jsx`.
5. Run `npm run audit:features`.

## Dependency rules

- Features should not import sibling feature folders — use `primitives/`, `patterns/`, or shared hooks.
- Hooks must not import `ui/features/` directly.

# CommitTrack

Local-first PWA for **commitments, pressure, and household/salary cashflow** — not a full expense tracker. Data stays in the browser (`localStorage`).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build + PWA service worker |
| `npm run test` | Vitest unit tests |
| `npm run lint` | ESLint |
| `npm run knip` | Unused exports / files (see `knip.json`) |
| `npm run deploy` | Build and publish `dist/` to GitHub Pages |

## Build outputs (do not commit)

These are **generated** or **installed** and are listed in **`.gitignore`**:

| Path | Purpose |
|------|---------|
| `dist/` | Production build from `npm run build` — deploy this folder only, never commit it |
| `dist-ssr/` | SSR build artifact (if used later) |
| `dev-dist/` | PWA dev precache folder (Vite PWA plugin) |
| `node_modules/` | Dependencies |

If `dist/` appears in git history locally, run `git rm -r --cached dist` once (only if it was accidentally tracked). The repo should only track **source** (`src/`, `public/`, config).

## Project layout

```
PROJECTapp/
├── public/
│   └── notification-handler.js   # PWA service worker helper (imported by vite-plugin-pwa)
├── scripts/                        # Build / PDF audit utilities
└── src/
    ├── main.jsx, App.jsx             # Entry + routing shell
    ├── pages/                        # Route screens
    │   ├── Home.jsx                  # Dashboard (pulse, tools, goals)
    │   ├── Commitments.jsx, Add.jsx
    │   ├── Analytics.jsx, Profile.jsx
    │   ├── Lending.jsx, Onboarding.jsx
    │   └── Tools.jsx                 # Redirects to Home#dashboard-tools
    ├── context/
    │   └── CommitTrackContext.jsx    # State, persistence, profile scope
    ├── hooks/
    │   ├── useCommitIntel.js         # Pressure, notifications, insights
    │   └── useStabilityIntel.js      # Mode intelligence + ahead plan
    ├── engines/                      # Pure finance logic (no React)
    │   ├── stabilityPlan.js          # Unified forecast / due weeks / share text
    │   ├── contextualReminders.js    # In-app + OS reminder copy
    │   ├── chitFund.js, pressureScore.js, …
    │   └── __tests__/                # Engine unit tests
    ├── components/
    │   ├── dashboard/                # Home widgets (FinancialPulseCard, DashboardTools, SurvivalCard, …)
    │   ├── tools/                    # Calculator modals (afford, chit, scenarios, …)
    │   ├── lending/                  # Lending UI
    │   └── profile/                  # Profile sections
    ├── constants/                    # Modes, categories, tool defs, help copy
    ├── services/notifications/       # Browser + background sync notifications
    └── utils/                        # Storage migration, dates, combined income, tool order
```

## Where features live

| Feature | Primary files |
|---------|----------------|
| Bills / commitments | `pages/Add.jsx`, `pages/Commitments.jsx`, `utils/migrateStorage.js` |
| Financial pulse (Summary / Ahead / Pressure / Tips) | `components/dashboard/FinancialPulseCard.jsx`, `engines/stabilityPlan.js` |
| Dashboard calculators + **reorder** | `components/dashboard/DashboardTools.jsx`, `utils/dashboardToolOrder.js` |
| Dual income + take-home vs gross | `utils/combinedIncome.js`, Profile money setup |
| Household payer tags | `engines/householdPayer.js`, Add / edit bill forms |
| What-if stress test | `engines/quickScenarios.js`, `components/tools/QuickScenariosPanel.jsx` |
| Notifications | `engines/contextualReminders.js`, `services/notifications/` |
| Chit fund | `engines/chitFund.js`, `components/ChitFundFields.jsx` |

## Modes

Configured in `constants/modeExperience.js` and `constants/userModes.js`: **salaried**, **family**, **freelancer**, **business**, **student**, **power**. Tool tiles and categories vary by mode.

## Auditing unused code

```bash
npx knip
```

`knip.json` ignores tests and the SW notification handler entry. Many `engines/*` exports are public API for future UI — not all are wired to a button yet.

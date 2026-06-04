# Project structure

```
PROJECTapp/
├── docs/                    ← You are here (developer handbook)
├── public/                  PWA assets, notification-handler.js, icons
├── scripts/                 Build & audit tooling (Node, not app runtime)
├── src/
│   ├── main.jsx, App.jsx    App entry + routing
│   ├── app/                 App glue (ThemeSync, NotificationSync, ModeRoute, ToolsRedirect)
│   ├── context/             React providers (CommitTrack, Auth)
│   ├── hooks/               React hooks (intel, PWA install, …)
│   ├── engines/             Pure finance logic + __tests__/
│   ├── constants/           Modes, categories, copy, symbols (no React)
│   ├── services/            Supabase auth, cloud sync, notifications
│   ├── utils/               Storage, dates, lending, repayment, migration
│   ├── types/               TypeScript types (context, global augmentations)
│   └── ui/                  ★ ALL visual UI (see below)
├── tsconfig.json            TypeScript (checkJs on src/)
├── eslint.config.js
├── package.json
└── README.md                Short GitHub intro → links to docs/
```

## Routing pattern

Routes are declared in `src/App.jsx` and lazy-load screens from `ui/features/pages/*` directly.

| Route | Screen |
|-------|--------|
| `/` | `ui/features/pages/HomePage.jsx` |
| `/commitments` | `ui/features/pages/CommitmentsPage.jsx` |
| `/add` | `ui/features/pages/AddPage.jsx` |
| `/lending` | `ui/features/pages/LendingPage.jsx` |
| `/analytics` | `ui/features/pages/AnalyticsPage.jsx` |
| `/tools` | `app/ToolsRedirect.jsx` → Home dashboard |
| `/profile` | `ui/features/pages/ProfilePage.jsx` |
| `/onboarding` | `ui/features/pages/OnboardingPage.jsx` |
| `/lend/offer` | `ui/features/pages/LendingOfferReviewPage.jsx` |

**Add a new screen:** implement `ui/features/pages/MyPage.jsx`, add a lazy `<Route>` in `App.jsx`, and nav link via `constants/userModes.js` / `Navbar.jsx`.

## `src/ui/` — design system & screens

```
src/ui/
├── index.js              Barrel export — import { Card, Button, … } from "../ui"
├── ARCHITECTURE.md       Pointer → docs/03-rules.md
├── primitives/           Card, Button, Input, Text, Modal, Badge, Stack, …
├── patterns/             PageHeader, ListRow, MetricTile, FormField, …
├── features/             Product screens & widgets
│   ├── pages/            Full-page screens (used by src/pages/)
│   ├── dashboard/        Home dashboard sections
│   ├── modals/           Bill/lending/insurance modals
│   ├── tools/            Calculator forms & advisors
│   ├── lending/          Lending-specific UI
│   ├── profile/          Profile sections
│   ├── analytics/        Charts & breakdowns
│   └── auth/             Account panel
├── layout/               Screen shell, Navbar, ErrorBoundary
├── styles/               tokens.css, components.css (all ct-* rules)
└── tokens/               severity, category chips, bill status mapping
```

### Where to add what

| You are building… | Put it in… |
|-------------------|------------|
| New button, card, modal style | `ui/primitives/` or `ui/patterns/` + styles in `ui/styles/components.css` |
| New home widget | `ui/features/dashboard/` |
| New full page | `ui/features/pages/` + `src/pages/` shell + route |
| New calculator / tool modal | `ui/features/tools/` + wire tool id in `DashboardTools.jsx` and `constants/modeExperience.js` |
| Affordability / forecast math | `engines/` + test in `engines/__tests__/` |
| New bill field / storage | `utils/migrateStorage.js`, `utils/commitmentStatus.js`, Add/Edit UI |
| Mode-specific tool list | `constants/modeExperience.js` (`MODE_TOOL_IDS`, `MODE_TOOL_DEFS`) |
| User-facing strings | `constants/copy.js` or feature-local copy |

### What NOT to create

- `src/components/` — **removed**; do not recreate Card/Button shims.
- Tailwind utility classes in non-UI files — **banned** (see [03-rules.md](./03-rules.md)).
- Duplicate exports from `ui` in random folders.

## `src/engines/` — business logic

No React imports. Examples:

| Engine | Purpose |
|--------|---------|
| `pressureScore.js`, `burden.js` | Income vs obligations |
| `stabilityPlan.js`, `survival.js` | Runway, ahead plan |
| `chitFund.js` | Chit installments |
| `quickScenarios.js` | What-if stress |
| `notifications.js` | In-app feed + contextual reminder copy |
| `forecastSeries.js` | Cashflow months |

Wire engines from hooks (`useCommitIntel`, `useStabilityIntel`) or directly from UI event handlers — never duplicate formulas in JSX.

## `scripts/` — tooling only

| Script | Purpose |
|--------|---------|
| `audit-all.mjs` | Full project audit (`npm run audit`) |
| `audit-ui.mjs` | UI location / class rules |
| `audit-ui-depth.mjs` | Dead screens, unused barrel exports, orphan tool tiles |
| `audit-tree` (`governance/tree.mjs`) | Folder layout, JSX placement, unreachable UI (`--tree`) |
| `audit-code.mjs` | ESLint, Knip, imports, hygiene |
| `audit-styles.mjs` | CSS compat (e.g. Safari prefixes) |
| `generate-pwa-icons.mjs` | Called by `npm run build` |
| `copy-404.mjs` | SPA 404 for GitHub Pages |

Not imported by the app at runtime.

## Tests

- `src/engines/__tests__/` — logic tests (preferred for math).
- `src/utils/__tests__/` — util tests.
- Run: `npm test` or `npm run test:watch`.

## Generated / gitignored

`dist/`, `node_modules/`, `dev-dist/` — never commit. See root README deploy section.

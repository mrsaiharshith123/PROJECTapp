# Project structure

```
PROJECTapp/                  ← repo root (Vite + React mobile web shell)
├── docs/                    Developer handbook
├── public/                  App icons, notification-handler.js (legacy)
├── scripts/                 Build & audit tooling
├── src/                     App source (see below)
├── supabase/                Migrations + edge functions
├── twa/                     Android TWA (Bubblewrap) for Play Store
├── capacitor.config.ts      iOS Capacitor shell config
├── .cursor/rules/           Cursor rules
└── package.json
```

**Mobile:** No separate native UI codebase. Android = TWA ([`twa/README.md`](./twa/README.md)). iOS = Capacitor ([`docs/MOBILE.md`](./MOBILE.md)).

## App layout

```
PROJECTapp/
├── docs/                    ← You are here (developer handbook)
├── public/                  App icons, notification-handler.js (legacy)
├── tailwind.config.js       Color bridge (`--ct-tw-*`) for legacy Tailwind utilities in ui/
├── scripts/                 Build & audit tooling (Node, not app runtime)
├── src/
│   ├── main.jsx, App.jsx    App entry + routing + I18nProvider
│   ├── app/                 App glue (ThemeSync, AnalyticsBridge, RequireAdmin, ModeRoute, ToolsRedirect)
│   ├── context/             React providers (Perovo, Auth)
│   ├── hooks/               React hooks (intel, …)
│   ├── i18n/                Translations — 22 langs + en (see docs/10-i18n.md)
│   ├── engines/             Pure finance logic + __tests__/
│   ├── constants/           Modes, categories, copy keys, symbols (no React)
│   ├── guidance/            Education registries + explain helpers (not UI)
│   ├── governance/          Audit registries (not in production bundle)
│   ├── services/            Supabase auth, sync, analytics, notifications, Razorpay, OTP confirmation
│   ├── storage/             App snapshot export shape (`appSnapshot.js`) for cloud sync
│   ├── utils/               Storage, dates, lending, repayment, migration, spend series (`monthSpendSeries.js`, `salarySpendBar.js`)
│   ├── types/               TypeScript types (context, global augmentations)
│   └── ui/                  ★ ALL visual UI — includes `ui/dev/` phone shell for localhost
├── supabase/                Migrations + schema snapshot (see supabase/README.md)
├── tsconfig.json            TypeScript (checkJs on src/)
├── eslint.config.js
├── package.json
└── README.md                Short intro → links to docs/
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
| `/admin` | `ui/features/pages/AdminPage.jsx` — `RequireAdmin` guard; not in bottom nav |
| `/onboarding` | `ui/features/pages/OnboardingPage.jsx` |
| `/lend/offer` | `ui/features/pages/LendingOfferReviewPage.jsx` |

**Add a new screen:** implement `ui/features/pages/MyPage.jsx`, add a lazy `<Route>` in `App.jsx`, and nav link via `constants/userModes.js` / `Navbar.jsx`.

## `src/ui/` — design system & screens

```
src/ui/
├── index.js              Barrel export — import { Card, Button, … } from "../ui"
├── ARCHITECTURE.md       Pointer → docs/03-rules.md
├── primitives/           Card, Button, Input, Text, Modal, Badge, Stack, …
├── patterns/             PageHeader, ListRow, MetricTile, FormField, Loading, …
├── features/             Product screens & widgets
│   ├── pages/            Full-page screens (lazy-loaded from App.jsx)
│   ├── dashboard/        Home dashboard sections
│   ├── modals/           Bill/lending/insurance modals
│   ├── tools/            Calculator forms & advisors
│   ├── lending/          Lending-specific UI
│   ├── profile/          Profile sections + `hub/` (control center, admin entry)
│   ├── admin/            Internal product intelligence widgets
│   ├── analytics/        Charts & breakdowns
│   └── auth/             Auth gate (`AuthGatePage.jsx` — sign-in, sign-up, forgot/reset password)
├── layout/               Screen shell (`Screen.jsx` — `max-w-lg` column), Navbar, ErrorBoundary
├── styles/               tokens.css, components.css, theme-light.css, net-worth.css
└── tokens/               chartTheme.js, severity, category chips, bill status mapping
```

### Where to add what

| You are building… | Put it in… |
|-------------------|------------|
| New button, card, modal style | `ui/primitives/` or `ui/patterns/` + styles in `ui/styles/components.css` |
| New home widget | `ui/features/dashboard/` |
| New full page | `ui/features/pages/` + lazy `<Route>` in `App.jsx` |
| New calculator / tool modal | `ui/features/tools/` + wire tool id in `DashboardTools.jsx` and `constants/modeExperience.js` |
| Affordability / forecast math | `engines/` + test in `engines/__tests__/` |
| New bill field / storage | `utils/migrateStorage.js`, `utils/commitmentStatus.js`, Add/Edit UI |
| Mode-specific tool list | `constants/modeExperience.js` (`MODE_TOOL_IDS`, `MODE_TOOL_DEFS`) |
| User-facing strings | `src/i18n/messages/en.js` + `useTranslation()` — see [10-i18n.md](./10-i18n.md) |
| Legacy COPY paths | `constants/copy.js` + `useCopy()` — migrate to `t()` when touching a file |

### What NOT to create

- `src/components/` — **removed**; do not recreate Card/Button shims.
- Tailwind utility classes in non-UI files — **banned** (see [03-rules.md](./03-rules.md)).
- Duplicate exports from `ui` in random folders.

## `src/engines/` — business logic

No React imports. Examples:

| Engine | Purpose |
|--------|---------|
| `pressureScore.js`, `burden.js` | Income vs obligations |
| `stabilityPlan.js`, `survival.js`, `stabilityNarrative.js` | Runway, ahead plan, pulse copy |
| `salaryBreakdown.js`, `incomeTaxEstimate.js` | Paycheck flow, tax estimator |
| `subscriptionLeak.js` | Subscription audit insights |
| `lendingAgreement.js`, `lendingTrust.js` | Promissory note text, trust scores |
| `chitFund.js` | Chit installments |
| `quickScenarios.js`, `scenarioCatalog.js` | What-if stress + unified scenario tiles |
| `profileAchievements.js` | Profile milestones / wins |
| `netWorth/commitmentWealth.js` | Bill-derived assets & liabilities |
| `notifications.js` | In-app feed + contextual reminder copy |
| `forecastSeries.js` | Cashflow months |
| `financialHealth.js` | Health score tile |

## `src/services/` — integrations (no React)

| Service | Purpose |
|---------|---------|
| `supabase/auth.js` | Sign-in, profile upsert (merge-safe onboarding flag) |
| `sync/syncEngine.js` | Cloud backup bridge |
| `notifications/*` | PWA reminders, delivery |
| `razorpaySubscription.js` | Checkout modal, monthly/yearly billing, server verify |
| `razorpayConfig.js` | `getTierPaise()`, test-key detection, simulation vs live |
| `otpConfirmation.js` | Declared lender/borrower confirmation refs (not Aadhaar eSign) |
| `smsAutoDetect.js` | SMS parse helpers for commitment detect modal |
| `analytics/trackEvent.js` | Public product-event API — fan-out via `analyticsHub.js` |
| `analytics/adminIntel.js` | Admin check + `admin_product_overview()` RPC |
| `analytics/providers/supabaseProvider.js` | Writes `app_events` when Supabase configured |

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
| `audit-copy-tone.mjs` | Formal user-facing language scan |
| `audit-i18n.mjs` | Locale key parity vs `en.js` |
| `sync-i18n-keys.mjs` | Add missing keys to locale files |
| `i18n-repair-corruption.mjs` | Fix corrupted translation artifacts |
| `i18n-auto-translate.mjs` | MyMemory batch translate |
| `translate-fallback-locales.mjs` | Google batch translate (all locales) |
| `generate-pwa-icons.mjs` | Called by `npm run build` |
| `copy-404.mjs` | SPA 404 for GitHub Pages |

Not imported by the app at runtime.

## Tests

- `src/engines/__tests__/` — logic tests (preferred for math).
- `src/utils/__tests__/` — util tests.
- Run: `npm test` or `npm run test:watch`.

## Generated / gitignored

`dist/`, `node_modules/`, `dev-dist/` — never commit. See root README deploy section.

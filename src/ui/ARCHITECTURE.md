# UI architecture

All visual UI lives under `src/ui/`. Pages and features import from `src/ui` or `src/ui/index.js` only.

## Design system (Financial Life / Cyber Glass)

- **Tokens:** `src/ui/styles/tokens.css` — Financial Life palette (`--ct-life-*`): violet `#5B4DFF` + emerald `#10B981` on Obsidian `#07070A` / Midnight Indigo `#121225`
- **Components:** `src/ui/styles/components.css` — life glass cards, inset metrics, frost filters, floating neon dock, life-gradient buttons
- **Light theme:** `theme-light.css` — softer washes; same token names
- **Tailwind bridge:** `tailwind.config.js` maps `gray` / `slate` / `indigo` / `violet` / `emerald` → `--ct-tw-*` vars (legacy tool/form screens inherit palette automatically)
- **Primitives:** `Card`, `Button`, `Input`, `Text` in `src/ui/primitives/`
- **Patterns:** `ListRow`, `StatCard`, `PageHeader`, `FilterChips`, `SalarySpendBar`, `MonthlySpendSparkline`, etc.
- **Icons:** Phosphor via `CtIcon` — no emojis as UI icons
- **Charts:** `getChartTheme()` in `src/ui/tokens/chartTheme.js` — life violet + emerald Recharts styling

Outside `src/ui/`, use only `ct-*` layout classes from `components.css` (e.g. `ct-page`, `ct-stack`).

Full token reference: `docs/architecture/DesignSystem.md`.

## Layout shell

`layout/Screen.jsx` → `MainContent` uses `max-w-lg` (~512px) centered column — mobile-first PWA width. Auth/onboarding use `ct-screen-narrow` (28rem).

## Navigation

Bottom bar (mobile): **Home · Bills · Add (FAB) · Lending · Profile** — see `NAV_ITEMS` in `constants/userModes.js` and `layout/Navbar.jsx`.

Analytics opens from the Home month hero card (`/analytics`). Lending is the full borrow/lend flow at `/lending`.

## Home month hero

`HomeOverviewCard.jsx` feeds `HeroMonthCard.jsx` (financial-life palette):

| Block | Content |
|-------|---------|
| Header | Mode label + month + icon |
| Chips | Scheduled · Paid · Unpaid (amounts only, no subtitles) |
| Cash row | Equal **Free cash** + **Variable spend** tiles (50/50 grid) |
| Status strip | Full-width stress + bills + daily spend copy below cash row |
| Salary bar | Overall spend (bills paid + variable) vs profile salary — `SalarySpendBar.jsx` |
| Sparkline | Cumulative spend through month — `MonthlySpendSparkline.jsx`, `utils/monthSpendSeries.js` |

Tap anywhere on the card → Analytics.

## Home quick actions

`HomeQuickActions.jsx` — horizontal scroll row below the hero. Calendar and Add stay pinned; reorderable actions: **Lending**, **Add income**, **Calculators** (scroll to tools), **Analytics**. Order persisted in `settings.homeQuickActionOrder` via `utils/homeQuickActionOrder.js`.

## Bills (commitments)

`CommitmentsPage.jsx` — **Recurring** tab (bill list) and **Variable spend** tab (`DailySpendPanel.jsx`):

- Log spend via tab FAB or long-press **+** on the nav bar (`LogSpendModal.jsx`).
- Variable tab: totals, period filter, spend history — **no donut/bar charts** (those live under Analytics → Monthly spending).

Charts live on **Analytics only** — one chart at a time with `FilterChips` to switch views. Theme: `data-theme="light"|"dark"` on `<html>` (Profile → Appearance); charts follow via `getChartTheme()`.

**Language:** Profile → Language picker (`I18nProvider`). See `docs/10-i18n.md`.

## Profile hub (financial identity)

`ProfilePage.jsx` composes the profile as a **financial hub** — identity, net worth, wealth ledger, milestones, and settings.

| Piece | File | Notes |
|-------|------|-------|
| Financial hero | `hub/ProfileFinancialHero.jsx` | Net worth headline + emergency %, pressure, bills-due chips |
| Net worth section | `ProfileNetWorthSection.jsx` | Tabs: Overview · Milestones · Assets · Liabilities; bill-derived read-only rows |
| Financial life overview | `hub/FinancialLifeOverviewPanel.jsx` | Overview tab — journey snippets and stability context |
| Milestones panel | `hub/ProfileMilestonesPanel.jsx` | Milestones tab — wins: goals, cleared bills/loans, wealth milestones, payment streaks |
| Admin entry | `hub/ProfileAdminEntry.jsx` | **Admin only** — Product intelligence → `/admin` |
| Settings / backup | `ProfileBackupSection.jsx`, `ProfileSettingsSheet.jsx` | Appearance, language, income, backup, history |

## Analytics layout

`AnalyticsPage.jsx` stacks three sections:

1. **Financial pulse** — stability narrative, pressure, runway
2. **Monthly spending** — `MonthlySpendAnalyticsSection.jsx` (paycheck breakdown, spend charts, lending, debt trend)
3. **Wealth & balance sheet** — `WealthAnalyticsSection.jsx` (liquidity, life score, allocation)

Bill insight cards (`BillInsightsCards.jsx`) live on Analytics (moved from Home).

## Tools (Home dashboard)

`DashboardTools.jsx` embeds tool panels on Home:

| Panel | Tabs / notes |
|-------|----------------|
| Money planner | Afford · Scenarios · Goals — `MoneyPlannerPanel.jsx` (`UnifiedScenariosPanel` on Scenarios) |
| Loan helpers | Extra EMI · Timing · Payoff order — `LoanToolsPanel.jsx` |
| Unified scenarios | Gated tile grid — `UnifiedScenariosPanel.jsx`, `engines/scenarioCatalog.js` |

Scenarios only appear when the user has the underlying data (e.g. no loan payoff tile without debt).

## Product UI map (current)

| Screen | Path |
|--------|------|
| Home (scroll dashboard) | `features/pages/HomePage.jsx` |
| Analytics | `features/pages/AnalyticsPage.jsx` |
| Tools | embedded on Home via `dashboard/DashboardTools.jsx` |
| Plans / upgrades | `profile/PlansModal.jsx` |
| Admin intelligence (internal) | `features/pages/AdminPage.jsx` — `/admin`; entry via Profile for admins only |

Deferred UX (see `docs/09-implementation-status.md`): OS launcher home, `/paycheck` page, legal-details modal.

Admin setup and analytics rules: `docs/architecture/AdminAnalytics.md`.

See `docs/03-rules.md` and `docs/README.md` for full project rules.

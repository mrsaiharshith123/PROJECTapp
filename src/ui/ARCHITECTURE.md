# UI architecture

All visual UI lives under `src/ui/`. Pages and features import from `src/ui` or `src/ui/index.js` only.

## Design system (Cyber Glass Fintech OS)

- **Tokens:** `src/ui/styles/tokens.css` — Obsidian `#07070A`, Midnight Indigo `#121225`, Electric Violet `#7C4DFF`, Neon Lavender `#9B6DFF`
- **Components:** `src/ui/styles/components.css` — Aurora glass cards, pulse panels, frost filters, floating neon dock, neon pill buttons
- **Primitives:** `Card`, `Button`, `Input`, `Text` in `src/ui/primitives/`
- **Patterns:** `ListRow`, `StatCard`, `PageHeader`, `FilterChips`, etc.
- **Icons:** Phosphor via `CtIcon` — no emojis as UI icons
- **Charts:** `getChartTheme()` in `src/ui/tokens/chartTheme.js` — neon minimal Recharts styling

Outside `src/ui/`, use only `ct-*` layout classes from `components.css` (e.g. `ct-page`, `ct-stack`).

## Navigation

Bottom bar (mobile): **Home · Bills · Add (FAB) · Lending · Profile** — see `NAV_ITEMS` in `constants/userModes.js` and `layout/Navbar.jsx`.

Analytics opens from the Home month hero card (`/analytics`). Lending is the full borrow/lend flow at `/lending`.

Charts live on **Analytics only** — one chart at a time with `FilterChips` to switch views. Theme: `data-theme="light"|"dark"` on `<html>` (Profile → Appearance); charts follow via `getChartTheme()`.

**Language:** Profile → Language picker (`I18nProvider`). See `docs/10-i18n.md`.

## Profile hub

`ProfilePage.jsx` composes hub widgets from `features/profile/hub/`:

| Piece | File | Notes |
|-------|------|-------|
| Identity hero + stability chips | `ProfileIdentityHero.jsx` | Stability / flex / backup on hero |
| Status widgets | `ProfileStatusWidgets.jsx` | Four financial status cards |
| Journey strip | `ProfileJourneyStrip.jsx` | Above control center |
| Control center | `ProfileControlCenterGrid.jsx` | 3-column tiles → settings panels |
| Admin entry | `ProfileAdminEntry.jsx` | **Admin only** — Product intelligence → `/admin` |
| Settings panels | `ProfileSettingsHub.jsx` | Expandable sections from tile groups |

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

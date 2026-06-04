# UI architecture

All visual UI lives under `src/ui/`. Pages and features import from `src/ui` or `src/ui/index.js` only.

## Design system (reference mockup)

- **Tokens:** `src/ui/styles/tokens.css` — `#0D0D17` background, `#1A1A2E` cards, `#7C5CFF` accent
- **Components:** `src/ui/styles/components.css` — layout, nav, cards, chips, lists
- **Primitives:** `Card`, `Button`, `Input`, `Text` in `src/ui/primitives/`
- **Patterns:** `ListRow`, `StatCard`, `SettingsRow`, `PageHeader`, `FilterChips`, `BillCard`, `MoneyMonthPanel`, etc.
- **Legacy Tailwind:** stray `text-gray-*` / `bg-indigo-*` inside the app shell are remapped in `components.css` while screens migrate.

Outside `src/ui/`, use only `ct-*` layout classes from `components.css` (e.g. `ct-page`, `ct-stack`).

## Navigation

Bottom bar (mobile): **Home · Lending · Add (FAB) · Bills · Profile** — see `NAV_ITEMS` in `constants/userModes.js` and `layout/Navbar.jsx`.

Analytics opens from the Home month hero card (`/analytics`). Lending is the full borrow/lend flow at `/lending`.

Charts live on **Analytics only** — one chart at a time with `FilterChips` to switch views. Theme: `data-theme="light"|"dark"` on `<html>` (Profile → Appearance); charts follow via `getChartTheme()`.

See `docs/03-rules.md` for full project rules.

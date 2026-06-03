# CommitTrack UI architecture

## Rule (non-negotiable)

**All visual UI code lives only under `src/ui/`.**

Outside `src/ui/` you may:

- Import from `src/ui` (or `src/ui/index.js`)
- Use layout hooks: `className` values that start with `ct-` only (e.g. `ct-page`)
- Business logic, engines, hooks, data — no colors, spacing, or component styling

Outside `src/ui/` you must **not**:

- Use Tailwind color/spacing utilities (`bg-indigo-*`, `text-gray-*`, `rounded-xl`, `border-*`, etc.)
- Define `fos-*` or duplicate input/button/card styles
- Keep presentation components (chips, banners, modals, panels with markup)

## Enforcement

```bash
npm run audit:ui
```

Fails the build if UI leaks outside `src/ui/`.

## Structure

- `primitives/` — Card, Button, Input, Text, Modal, Badge
- `patterns/` — MetricTile, ListRow, PageHeader, FilterChips
- `features/` — HeroMonthCard, ToolTile, InstallAppBanner, dashboard panels
- `layout/` — Screen, Navbar
- `styles/` — `tokens.css`, `components.css` (reference palette)
- `tokens/` — severity tones, category chip mapping

## Import convention

```js
import { Card, Button, PageHeader, MetricTile } from "../ui";
```

Do not re-export UI through `src/components/Card.jsx` — import from `ui` directly.

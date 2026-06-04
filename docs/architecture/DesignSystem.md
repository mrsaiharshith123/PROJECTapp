# Design system

## Philosophy

- **One visual home**: `src/ui/` owns all presentation.
- **Tokens first**: colors, spacing, radii in `ui/styles/tokens.css` and `components.css`.
- **Primitives → patterns → features** — do not skip layers for one-off screens.

## Typography & text

Use `Heading`, `Body`, `Caption` from `ui/primitives/Text.jsx` — not ad-hoc `text-sm text-gray-*`.

## Severity & status

- Bill status chips: `ui/tokens/billStatus.js`
- Priority badges: `ui/tokens/priorityBadges.js`
- UI classes: `ct-badge--*`, `ct-pill--*` (see `governance/registries/severityRegistry.js`)

## Color palette (product)

| Role | Hex |
|------|-----|
| Background | `#0B1020` / `#121A2F` |
| Card | `#1B233D` |
| Accent | `#7C5CFF` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Text | `#F5F7FA` / `#A8B2C7` / `#6E7B91` |

## Outside `src/ui/`

Only **`ct-*` layout** classes on wrappers (`ct-page`, `ct-stack`, `ct-row`).

Forbidden outside UI: Tailwind `bg-*`, `text-gray-*`, `rounded-xl`, `shadow-*`, local `inputClass` blobs.

## Audits

```bash
npm run audit:design
npm run audit:ui
npm run audit:styles
```

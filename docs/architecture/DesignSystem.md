# Design system — Cyber Glass Fintech OS

## Identity

**Cyber Glassmorphism + Neon Fintech Minimalism** — premium futuristic finance OS with dark neon aesthetics, soft glass surfaces, floating depth, and selective violet glow. Not playful, not flat Material, not heavy enterprise dashboards.

## Philosophy

- **One visual home**: `src/ui/` owns all presentation.
- **Tokens first**: `ui/styles/tokens.css`, `components.css`, `theme-light.css`.
- **Themes**: `data-theme="light" | "dark"` on `<html>`; Profile → Appearance.
- **Icons**: Phosphor via `CtIcon` only — no emojis as UI icons.
- **Typography**: Inter (with regional Noto stacks for Indic scripts).

## Color palette (dark)

| Role | Token | Hex |
|------|-------|-----|
| Background | `--ct-bg` | `#07070A` Obsidian |
| Surface / card | `--ct-surface` | `#121225` Midnight Indigo |
| Primary | `--ct-accent` | `#7C4DFF` Electric Violet |
| Glow accent | `--ct-accent-muted` | `#9B6DFF` Neon Lavender |
| Success | `--ct-success` | `#3BE58F` Neon Mint |
| Warning | `--ct-warning` | `#FFB020` Soft Gold |
| Text primary | `--ct-text` | `#F2F2F7` |
| Text secondary | `--ct-text-secondary` | `#9A9AAF` |

## Surface system

| Class / component | Style | Use |
|-------------------|-------|-----|
| `.ct-card`, `.ct-card-hero`, `.ct-card-glow` | **Aurora glass** — 24–32px radius, blur, inner gradient, neon border | Dashboards, analytics, identity, charts |
| `.ct-metric`, `.ct-stat-cell`, `.ct-tool-tile`, `.ct-profile-widget` | **Pulse panels** — compact translucent dark tiles | Metrics, lending, health, dues |
| `.ct-segmented`, `.ct-chip`, filter rows | **Frost containers** — soft floating glass | Filters, segmented controls, search |

## Controls

| Class | Style |
|-------|-------|
| `.ct-btn-primary`, `.ct-btn-outline` | **Neon pills** — capsule, violet glow, luminous border |
| `.ct-nav-fab`, `.ct-fab` | **Quantum FAB** — circular, strong neon glow |
| `.ct-btn-ghost` | **Ghost pills** — transparent outline, secondary actions |

## Navigation

**Floating neon dock** — `.ct-bottom-nav` is a glass pill floating above the safe area with blur, violet border glow, active tab indicator, and elevated center FAB.

## Charts

Neon minimal analytics via `getChartTheme()` + `.ct-chart-plot` — thin glowing lines/bars, soft dashed grid, minimal labels.

## Outside `src/ui/`

Only **`ct-*` layout** classes on wrappers (`ct-page`, `ct-stack`, `ct-row`).

## Audits

```bash
npm run audit:design
npm run audit:ui
npm run audit:styles
```

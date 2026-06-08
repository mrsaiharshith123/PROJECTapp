# Design system — Cyber Glass Fintech OS

## Identity

**Cyber Glassmorphism + Neon Fintech Minimalism** — premium futuristic finance OS with dark neon aesthetics, soft glass surfaces, floating depth, and selective violet glow. Not playful, not flat Material, not heavy enterprise dashboards.

## Philosophy

- **One visual home**: `src/ui/` owns all presentation.
- **Tokens first**: `ui/styles/tokens.css`, `components.css`, `theme-light.css`.
- **Themes**: `data-theme="light" | "dark"` on `<html>`; Profile → Appearance.
- **Icons**: Phosphor via `CtIcon` only — no emojis as UI icons.
- **Typography**: Inter (with regional Noto stacks for Indic scripts).

## Financial Life palette (app-wide)

Home and Profile financial hero cards define the global look. Semantic tokens in `tokens.css`:

| Token | Role |
|-------|------|
| `--ct-life-grad` | Violet → emerald hero gradient (month card, net worth, profile) |
| `--ct-life-grad-surface` | Card / modal glass surface |
| `--ct-life-grad-panel` | Metric panels and inset blocks |
| `--ct-life-inset-bg` / `--ct-life-inset-border` | Chips, metrics, tool tiles, hero insets |
| `--ct-life-glow` | Top-right radial violet glow on hero cards |
| `--ct-life-shadow` | Card depth + soft violet halo |
| `--ct-life-footer-wash` | Sparkline / chart footer fade |

Dark base: violet `#5B4DFF` at ~14–22% opacity over midnight indigo, with emerald `#10B981` at ~4–8% for balance. Light theme mirrors the same structure with softer washes.

**App-wide propagation:** core tokens (`--ct-accent`, `--ct-text`, `--ct-success`), all `.ct-btn` / `.ct-chip` / `.ct-input` classes, and Tailwind `gray` / `slate` / `indigo` / `violet` / `emerald` utilities (via `tailwind.config.js` → `--ct-tw-*` bridge vars) resolve to the Financial Life palette — including legacy forms, lending, and tools that still use Tailwind color classes.

## Color palette (dark)

| Role | Token | Hex |
|------|-------|-----|
| Background | `--ct-bg` | `#07070A` Obsidian |
| Surface / card | `--ct-surface` | `#121225` Midnight Indigo |
| Primary | `--ct-accent` | `#7C4DFF` Electric Violet |
| Life violet | `--ct-life-violet` | `#5B4DFF` |
| Glow accent | `--ct-accent-muted` | `#9B6DFF` Neon Lavender |
| Success | `--ct-success` | `#10B981` Life emerald |
| Warning | `--ct-warning` | `#FFB020` Soft Gold |
| Text primary | `--ct-text` | `#F0EFF8` Life heading |
| Text secondary | `--ct-text-secondary` | `#A8A5C0` Lavender gray |

## Surface system

| Class / component | Style | Use |
|-------------------|-------|-----|
| `.ct-card`, `.ct-card-hero`, `.ct-modal-panel` | **Financial Life glass** — `--ct-life-grad-surface` / `--ct-life-grad-hero` | Dashboards, analytics, modals |
| `.ct-hero-month-financial`, `.ct-nw-hero` | **Financial Life hero** — `--ct-life-grad` + glow + shadow | Home month card, profile net worth |
| `.ct-metric`, `.ct-stat-cell`, `.ct-tool-tile`, `.ct-inset` | **Life insets** — `--ct-life-inset-bg` | Metrics, lending, health, dues |
| `.ct-segmented`, `.ct-chip`, filter rows | **Frost containers** — `--ct-life-glass` | Filters, segmented controls, search |

## Controls

| Class | Style |
|-------|-------|
| `.ct-btn-primary`, `.ct-btn-outline` | **Life gradient pills** — `--ct-life-btn-grad`, glow shadow |
| `.ct-nav-fab`, `.ct-fab` | **Quantum FAB** — circular, strong neon glow |
| `.ct-btn-ghost` | **Ghost pills** — transparent outline, secondary actions |

## Navigation

**Floating neon dock** — `.ct-bottom-nav` is a glass pill floating above the safe area with blur, violet border glow, active tab indicator, and elevated center FAB. Desktop uses `.ct-top-nav` (42rem inner max-width).

## Layout shell

Mobile-first centered column: `MainContent` in `Screen.jsx` uses Tailwind `max-w-lg` (~512px). Laptop/full-width layout is deferred.

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

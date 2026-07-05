# Design System — Direction H

## Identity

**Direction H — Editorial Financial OS** — warm charcoal editorial aesthetic. Designed for Indian household finance: bills, property, EMIs, lending between family. Not a trading platform. Trust, legibility, and seriousness over spectacle.

## Typography

| Role | Font | Usage |
|------|------|-------|
| Display / headlines | Fraunces (serif, italic) | Page titles, hero numbers, financial figures |
| Body narrative | Newsreader (serif) | Insights, explanatory text, captions |
| UI / labels | Inter | Form labels, nav, buttons, metadata |
| Indic scripts | Noto Sans (23 language stacks) | Regional language support |

## Colour palette

| Token | Dark mode | Light mode | Role |
|-------|-----------|------------|------|
| `--ed-bg` | `#16140f` | `#faf8f3` | Page background |
| `--ed-surface` | `#1c1a13` | `#f2efe8` | Cards, panels |
| `--ed-ink` | `#f0ebe0` | `#1a1814` | Primary text |
| `--ed-gold` | `#e3c489` | `#b08642` | Brand accent |
| `--ed-green` | `#5ec795` | `#147a57` | Positive / on-track |
| `--ed-red` | `#e89490` | `#b8453f` | Danger / overdue |
| `--ed-amber` | `#e3b06a` | `#a06020` | Warning / behind |

## Theme modes

Three modes selectable under Profile → Appearance:

| Mode | `data-theme` | Background |
|------|-------------|------------|
| Dark (default) | — (omitted) | `#16140f` warm charcoal |
| Light | `light` | `#faf8f3` warm cream |
| AMOLED | `amoled` | `#000000` true black |

System preference is also available; it resolves to dark or light based on the device.

## Token system

All tokens in `src/ui/styles/tokens.css`. Use `var(--ed-*)` everywhere — never hardcode hex values in JSX or CSS.

## Class system

All component classes use the `ed-` prefix. Class definitions live in:

| File | Purpose |
|------|---------|
| `tokens.css` | CSS custom properties |
| `components-dh.css` | Core layout, rows, sections, navigation |
| `components-editorial.css` | Screen-specific and feature components |
| `components-editorial-home.css` | Home screen and navbar |
| `components-editorial-pages.css` | Page-level layout |
| `components-charts.css` | Chart and data visualisation |
| `components-controls.css` | Forms, inputs, buttons |
| `components-shell.css` | App shell, screen wrappers |

## Icons

Phosphor via `CtIcon` only — no emoji as UI icons.

## Spacing

```
--ed-page-x:      16px   (horizontal page padding)
--ed-page-top:    12px   (header top padding)
--ed-space-1..12: 4px to 48px scale
--ed-r-sm/md/lg/xl/full: 6 / 10 / 14 / 20 / 9999px
```

## Primitives

| Component | Class output |
|-----------|-------------|
| `<Card>` | `ed-card` |
| `<Button variant="primary">` | `ed-btn ed-btn-primary` |
| `<Text variant="h1">` | `ed-display` |
| `<Badge tone="success">` | `ed-pill ed-pill-green` |

## Auditing

```bash
# Check for any remaining ct- class usage in JSX
grep -rn '"ct-\| ct-' src/ui --include="*.jsx" | grep -v "router-dom\|//"

# Check for hardcoded hex in inline styles
grep -rn 'style=.*#[0-9a-fA-F]' src/ui --include="*.jsx"

# Check for old Tailwind color classes
grep -rn 'text-\|bg-\|border-' src/ui --include="*.jsx" | grep -E "emerald|violet|indigo|slate-[0-9]"
```

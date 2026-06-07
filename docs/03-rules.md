# Rules for contributors

These rules are enforced by **ESLint** and **`npm run audit`**. Read [docs/README.md](./README.md) before starting work. Breaking them blocks a clean audit.

## 1. UI lives only in `src/ui/`

**All visual UI** — components, layout, modals, styling, design tokens — must be under `src/ui/`.

Outside `src/ui/` you may:

- `import { Card, Button, PageHeader, … } from "../ui"` (or `src/ui/index.js`)
- Use **`ct-*` layout classes** only on wrappers when needed (`ct-page`, `ct-stack`, `ct-row`, …) — defined in `src/ui/styles/components.css`

Outside `src/ui/` you must **not**:

- Add Tailwind **color/spacing/visual** utilities: `bg-*`, `text-gray-*`, `rounded-xl`, `border-indigo-*`, `dark:*`, `shadow-*`, etc.
- Copy-paste input/button/card styles (no local `fos-*`, no duplicate `profileInputClass` patterns outside approved profile helpers in `ui/features/profile/`)
- Create `src/components/Card.jsx`-style re-export shims
- Build presentation components (chips, banners, modals with markup) outside `ui/`

### Styling new UI

1. Prefer existing primitives/patterns from `ui/index.js`.
2. If you need new visuals, add **`ct-*` rules** in `src/ui/styles/components.css` (and tokens in `tokens.css`).
3. Reference palette:

| Token | Hex |
|-------|-----|
| Background | `#0B1020` / `#121A2F` |
| Card | `#1B233D` |
| Accent | `#7C5CFF` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Text | `#F5F7FA` / `#A8B2C7` / `#6E7B91` |

### Import convention

```js
import { Card, Button, Stack, PageHeader } from "../ui";
```

Do not import UI from deleted `src/components/` paths.

## 2. Logic stays out of UI

| Layer | Responsibility |
|-------|----------------|
| `engines/` | Calculations, forecasts, affordability, reminders |
| `utils/` | Persistence, dates, normalization, migrations |
| `constants/` | Static config, mode definitions, labels |
| `hooks/` | Compose engines + context for React |
| `ui/` | Render data, capture input, call context/hooks |

No complex math inside JSX. Add or extend engine functions and unit tests.

## 3. Pages & routing

Screens live in `ui/features/pages/*`. `App.jsx` imports them directly (lazy). Routing and providers stay in `App.jsx`.

## 4. TypeScript

- Config: `tsconfig.json` — `strict: true`, `checkJs: true`, `include: ["src"]`
- Shared context types: `src/types/context.ts`
- Run before PR: `npm run typecheck`

Do not disable checks to “make it pass” without team agreement.

## 5. Secrets & env

- `.env` is local only — **never commit**
- Production: set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_RAZORPAY_KEY_ID` where payments are enabled (see root README)
- Copy `.env.example` — never commit real keys
- Audit fails if `.env` is tracked by git

## 6. Quality gate before you finish

```bash
npm run audit
```

Optional stricter CI-local check:

```bash
npm run audit -- --strict
```

(`--strict` treats more warnings as failures; large bundle size stays advisory.)

## 7. Dead UI & orphan features

Audit depth checks (see [05-audit-and-quality.md](./05-audit-and-quality.md)):

- Barrel exports in `ui/index.js` must be used somewhere in `src/`
- Every `*Page.jsx` must have a route in `App.jsx` (lazy import from `ui/features/pages/`)
- Dashboard tool ids in `modeExperience.js` must have a handler in `DashboardTools.jsx`
- UI files unreachable from `App.jsx` / `pages/` are flagged

If you add a tool or export, wire it through to a screen.

## 8. Git / deploy (summary)

- Do not commit `dist/` or `node_modules/`
- Deploy: `npm run deploy` (build + gh-pages) — see root README

## 9. User-facing copy & i18n

- **Source of truth:** `src/i18n/messages/en.js`
- **In UI:** `useTranslation()` → `t("key")` — never hard-code product copy in JSX
- **Audit:** `npm run audit` checks key parity and formal copy tone
- Full guide: [10-i18n.md](./10-i18n.md)

## Quick “allowed vs banned”

| Allowed | Banned |
|---------|--------|
| New screen in `ui/features/pages/` | New `src/components/` |
| `ct-*` class in app shell | `className="bg-indigo-600"` outside `ui/` |
| Engine + test for new formula | Copy-paste EMI math in a modal |
| Import from `ui` barrel | Duplicate Button component |
| `t("key")` via `useTranslation()` | Hard-coded English on new screens |
| `npm run audit` clean | Skipping audit before merge |

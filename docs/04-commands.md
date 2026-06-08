# Commands reference

All commands run from the project root (`PROJECTapp/`).

## Daily development

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start Vite dev server with HMR (default `http://localhost:5173`) |
| `npm run preview` | Serve production build locally (run `build` first) |
| `npm test` | Run Vitest once (205 tests across engines/utils/services/i18n) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint on the repo |
| `npm run lint:fix` | ESLint with auto-fix where safe |
| `npm run typecheck` | `tsc --noEmit` — TypeScript check on `src/` (JS + `checkJs`) |

## Quality & audit (use before PR)

| Command | What it does |
|---------|----------------|
| `npm run audit` / `audit:all` | **Full production gate** — env, deps, CSS, UI, code, tests, types, build |
| `npm run audit -- --strict` | Same; most warnings also fail |
| `npm run audit:governance:quick` | Fast governance-only scan |
| `npm run audit:governance` | All governance audits (8 checks) |
| `npm run audit:governance:full` | Governance + UI/CSS/depth/merge |
| `npm run audit:summary` | Human-readable report from `reports/` |
| `npm run audit:fix-deps` | `npm audit fix` for production deps |
| `npm run audit:list` | List every audit id |
| `npm run audit:report` | Write `reports/governance-latest.json` |

### Focused governance

| Command | Focus |
|---------|--------|
| `audit:design` | Design system & UI consistency |
| `audit:architecture` | Layer boundaries, large files |
| `audit:features` | Feature registry & cross-feature imports |
| `audit:modes` | User mode isolation |
| `audit:sync` | Local-first vs cloud sync boundaries |
| `audit:insights` | Insight engine overlap |
| `audit:performance` | Heavy pages & render heuristics |
| `audit:mobile` | Responsive / overflow risks |
| `audit:charts` | Duplicate / similar UI |
| `audit:ui` / `audit:styles` | Layout rules & CSS tokens |
| `audit:ui-depth` / `audit:dead-code` | Unmounted screens, dead buttons |
| `audit:merge` | Advisory file merge suggestions |
| `npm run audit:copy` / `audit:copy:list` | Formal copy tone scan |
| `npm run audit:i18n` | Locale key parity (22 langs + en) |
| `npm run sync:i18n` | Sync missing keys from `en.js` into locale files |
| `npm run i18n:repair` | Fix corrupted / broken placeholders in locales |
| `npm run i18n:translate` | MyMemory API fill for locale files |
| `npm run i18n:translate:all` | Google batch translate all locales (dev; slow) |
| `audit:code` | ESLint + Knip only |

See [10-i18n.md](./10-i18n.md). Governance details: [08-governance.md](./08-governance.md).

### What `npm run audit` runs (order)

1. Environment & secrets (.env hygiene, git tracking check)
2. Dependencies (`npm install` check + `npm audit`)
3. CSS compatibility (`scripts/audit-styles.mjs`)
4. UI layout rules (`scripts/audit-ui.mjs`) — UI only under `src/ui/`, no stray Tailwind
5. Copy tone (`scripts/audit-copy-tone.mjs`) — formal user-facing language
6. i18n locales (`scripts/audit-i18n.mjs`) — key parity across 22 languages + en
7. Code health (`scripts/audit-code.mjs`) — ESLint, Knip, imports, **UI depth**
8. Unit tests (`vitest run`)
9. TypeScript (`tsc --noEmit`)
10. Production build (`vite build`) + bundle size advisory

**Green “ALL CHECKS PASSED”** = safe to merge from a tooling perspective.

## Clean generated output

| Command | What it does |
|---------|----------------|
| `npm run clean` | Deletes `dist/`, `dev-dist/`, `dist-ssr/` (build artifacts only — not source) |

Use when the repo looks messy locally. See [07-repo-folders.md](./07-repo-folders.md).

## Build & deploy

| Command | What it does |
|---------|----------------|
| `npm run build` | Generate PWA icons → Vite production build → copy `404.html` for GitHub Pages SPA |
| `npm run predeploy` | Runs `build` (npm lifecycle before deploy) |
| `npm run deploy` | `gh-pages -d dist` — publish `dist/` to GitHub Pages |

**Do not commit `dist/`** — it is build output.

## Optional / internal

| Command | What it does |
|---------|----------------|
| `npm run git:ship` | Helper commit/push script (`scripts/git-commit-push.mjs`) |

## Direct script access (rare)

Developers normally only need `npm run audit`. Internally:

| Script | Purpose |
|--------|---------|
| `node scripts/audit-ui.mjs` | UI-only rule scan |
| `node scripts/audit-code.mjs` | Lint + Knip + hygiene |
| `node scripts/audit-ui-depth.mjs --json` | Machine-readable depth report |

## Typical workflow

```bash
npm install
cp .env.example .env    # if using Supabase locally
npm run dev             # develop
npm test                # after engine/utils changes
npm run audit:governance:quick  # during large UI refactors
npm run audit           # before push / PR
```

## If `npm run audit` fails with many errors at once

If you see **missing packages**, **Vitest not found**, **tsc not found**, and **build failed** together, `node_modules` is incomplete — not a code bug:

```bash
npm install
npm run audit
```

OneDrive can sometimes interrupt `node_modules`; re-run `npm install` in the project root.

## Environment variables

| Variable | Used for |
|----------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay checkout key (`rzp_test_*` in dev) — Plans modal upgrades |

Without Supabase vars, auth/cloud features are limited; local storage still works. Without Razorpay key, paid tier buttons show a configuration error.

See [09-implementation-status.md](./09-implementation-status.md) for feature ↔ env mapping.

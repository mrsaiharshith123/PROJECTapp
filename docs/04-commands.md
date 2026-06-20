# Commands reference

All commands run from the project root (`PROJECTapp/`).

## Daily development

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start Vite dev server with HMR (default `http://localhost:5173`) — full app; use `npm run site:customer-on` to preview landing locally |
| `npm run preview` | Serve production build locally (run `build` first) |
| `npm test` | Run Vitest once (all unit tests — engines, utils, storage, sync, i18n) |
| `npm run test:sync` | Snapshot + sync meta tests only |
| `npm run test:engines` | Engine tests only |
| `npm run test:utils` | Utils tests only |
| `npm run audit -- --strict` | Full gate; merge suggestions stay advisory (not blocking) |
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
| `audit:sync` | Local-first vs cloud sync boundaries (no auto-pull, allowed Supabase UI paths) |
| `audit:household` | Family mode isolation + profile-scope wiring + dependents UI |
| `audit:docs-sync` | `09-implementation-status.md` matches shipped features |
| `audit:pre-release` | Full gate + governance + docs-sync + engine tests |
| `audit:guidance` | Financial guidance / education copy wiring |
| `audit:insights` | Insight engine overlap |
| `audit:performance` | Heavy pages & render heuristics |
| `audit:mobile` | Responsive / overflow risks |
| `audit:charts` | Duplicate / similar UI |
| `audit:ui` / `audit:styles` | Layout rules & CSS tokens |
| `audit:ui-depth` / `audit:dead-code` | Unmounted screens, dead buttons |
| `audit:orphans` | Production modules only referenced from tests |
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

## Mobile (TWA + Capacitor)

| Command | What it does |
|---------|----------------|
| `npm run apk:dev` | **Developer APK** — build web + Capacitor → `releases/Perovo-dev-latest.apk` (share offline) |
| `npm run apk:twa` | Play Store TWA APK/AAB (loads live `perovo.app`) |
| `npm run apk:twa:install` | Install TWA build on USB device |
| `npm run cap:sync` | `npm run build` + copy into native projects |
| `npm run cap:android` | Open Android Studio |
| `npm run cap:ios` | Open Xcode (macOS) |
| `npm run cap:add:android` | First-time Capacitor Android platform |
| `npm run audit:native-shells` | Governance: TWA + Capacitor config, no legacy mobile folders |

Full guide: [MOBILE.md](./MOBILE.md).

## Optional / internal

| Command | What it does |
|---------|----------------|
| `npm run ship` | Commit, push, build dev APK, publish to GitHub Releases (`latest` + `Perovo-dev-latest.apk`) |
| `npm run ship -- --no-apk "msg"` | Commit and push only (skip APK build + release) |
| `npm run ship -- --release-only` | Upload existing `releases/Perovo-dev-latest.apk` to GitHub Releases (no commit) |
| `npm run gh:login` | GitHub CLI login (works when `gh` is not on PATH yet — Windows) |
| `npm run site:mode` | Customer mode status for **localhost** (`npm run dev`) |
| `npm run site:customer-on` | Localhost → landing page (writes `.env.local`, restart dev) |
| `npm run site:customer-off` | Localhost → full app (default, restart dev) |
| `npm run git:ship` | Alias for `npm run ship` |

### Dev-only (local `npm run dev`)

| Surface | What it does |
|---------|----------------|
| `/dev` route | Developer panel — integration status, modals, state presets (`DevPanel.jsx`) |
| 🔧 floating button | Bottom-left; opens `/dev` when overrides active |
| `__perovoDev.help()` | Console shortcuts — presets, force-show, tier simulation (`devSubscriptionTools.js`) |

Bill OCR scan is on the **+ FAB menu**, not the Home tools grid.

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
npm run audit:household         # family mode + profile scope (after household work)
npm run audit:docs-sync         # implementation status doc matches code
npm run audit:pre-release       # gate + governance + docs + engine tests
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
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` (bare project ref auto-normalized) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_RAZORPAY_KEY_ID` | Razorpay checkout key (`rzp_test_*` in dev) — Plans modal upgrades |

Without Supabase vars, auth/cloud features are limited; local storage still works. Without Razorpay key, dev uses simulated payments. Restart `npm run dev` after `.env` changes. GitHub Pages: set all three as repository secrets.

See [09-implementation-status.md](./09-implementation-status.md) for feature ↔ env mapping.

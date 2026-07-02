# Commands reference

All commands run from the project root (`PROJECTapp/`).

## Daily development

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start Vite dev server — full app in **localhost phone shell** (`http://localhost:5173`) |
| `npm run roger:all` | **Full maintenance pass** — sync i18n, docs-sync, full audit (use when you say "roger all") |
| `npm run preview` | Serve production build locally (run `build` first) |
| `npm test` | Run Vitest once (all unit tests — engines, utils, storage, sync, i18n) |
| `npm run test:sync` | Snapshot + sync meta tests only |
| `npm run test:engines` | Engine tests only |
| `npm run test:utils` | Utils tests only |
| `npm run audit -- --strict` | Full gate; merge suggestions stay advisory (not blocking) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run lint` | ESLint on `src/` (build artifacts under `android/`, `dist-*` ignored) |
| `npm run lint:fix` | ESLint with auto-fix where safe |
| `npm run typecheck` | `tsc --noEmit` — TypeScript check on `src/` (JS + `checkJs`) |

## Quality & audit (use before PR)

| Command | What it does |
|---------|----------------|
### Essential audit commands

| Command | What it does |
|---------|----------------|
| `npm run audit` | Full production gate |
| `npm run audit:gov` | All governance audits (28 checks) |
| `npm run audit:gov:quick` | Fast governance-only scan |
| `npm run audit:fix` | Report auto-fixable issues |
| `npm run audit:fix:apply` | Apply safe auto-fixes |
| `npm run audit:fix:buttons` | Add `type="button"` to untyped buttons |
| `npm run audit:i18n` | Locale key parity |
| `npm run audit:apis` | External API usage audit |

To run a specific governance category directly:

```bash
node scripts/audit-runner.mjs security
node scripts/audit-runner.mjs testing
node scripts/audit-runner.mjs business-logic
# …any of the 28 governance IDs — see: node scripts/audit-runner.mjs --list
```

### Legacy focused audits (removed from package.json)

Individual category scripts were trimmed to reduce npm script sprawl. Run them via `node scripts/audit-runner.mjs [id]` instead of `npm run audit:*`.

| Command | Focus |
|---------|--------|
| `audit:design` | Design system & UI consistency |
| `audit:architecture` | Layer boundaries, large files |
| `audit:features` | Feature registry & cross-feature imports |
| `audit:modes` | User mode isolation |
| `audit:sync` | Local-first vs cloud sync boundaries (no auto-pull, allowed Supabase UI paths) |
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
| `npm run build` | Generate app icons → Vite production build → OTA bundle → copy `404.html` for GitHub Pages SPA |
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

## Roger all (full maintenance)

| Command | What it does |
|---------|----------------|
| `npm run roger:all` | Sync i18n → docs-sync → full `audit` gate |
| `npm run roger:all -- --fix` | ESLint auto-fix first, then roger pass |
| `npm run roger:all -- --strict` | Fail on advisories too |

See [11-roger-all.md](./11-roger-all.md). Cursor: say **"roger all"** to run this workflow.

## Optional / internal

| Command | What it does |
|---------|----------------|
| `npm run ship` | Commit, push, build dev APK, publish to GitHub Releases |
| `npm run ship -- --no-apk "msg"` | Commit and push only (skip APK build + release) |
| `npm run ship -- --release-only` | Upload existing `releases/Perovo-dev-latest.apk` to GitHub Releases (no commit) |
| `npm run gh:login` | GitHub CLI login (works when `gh` is not on PATH yet — Windows) |

Legacy `site:customer-on/off` scripts remain for local env toggles but marketing web mode is **disabled in code**.

### Admin (local `npm run dev`)

| Surface | What it does |
|---------|----------------|
| Left FAB (chart-bar) | `AdminFloatingButton.jsx` — visible when `profiles.is_admin`; opens `/admin` |
| `/admin` route | Admin dashboard (`AdminPage.jsx`) — `RequireAdmin` guard |

Legacy `/dev` wrench panel removed. Console dev helpers (`__perovoDev.help()`) remain in `devSubscriptionTools.js` for tier simulation when Razorpay is not configured.

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
npm run dev             # develop (phone shell on localhost)
npm run roger:all       # before push / release — full health pass
npm test                # after engine/utils changes
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

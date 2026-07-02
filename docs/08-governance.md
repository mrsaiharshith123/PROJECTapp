# Engineering governance

Perovo uses a **layered audit system**: production gate + focused governance scans.

## Production gate (pre-merge)

```bash
npm run audit          # one command — everything (see list below)
npm run audit -- --strict   # warnings on UI/copy/i18n/governance also fail
```

Runs: env, deps, CSS, UI layout, copy tone, i18n, code health, tests, TypeScript, production build, **full governance batch** (design, mobile/PWA, a11y, theme, shells, merge, orphans, tier, cleanup), registry sync, engine tests, cloud sync.

## Governance runner

```bash
npm run audit:list              # all audit ids
npm run audit:governance:quick  # fast governance only (~15s)
npm run audit:governance        # all governance checks (no ESLint/Knip)
npm run audit:governance:full   # governance + UI/CSS/depth/merge/orphans/tier
npm run audit:summary           # readable summary from report
npm run audit:report            # writes reports/governance-latest.json
npm run audit:fix-deps          # fix production npm audit issues
```

### Focused audits

| Command | Checks |
|---------|--------|
| `audit:design` | Design system bypass, hardcoded colors, inputClass drift |
| `audit:architecture` | File size, layer violations (engines↔ui) |
| `audit:features` | Feature registry + cross-feature imports |
| `audit:modes` | Mode isolation & engine coupling |
| `audit:insights` | Insight producer overlap |
| `audit:performance` | Heavy pages, hooks, chart usage |
| `audit:mobile` | Overflow, viewport, fixed widths, 100dvh resize |
| `audit:pwa` | PWA manifest, viewport-fit, safe-area, public assets |
| `audit:a11y` | ARIA, icon-button labels, img alt, dialog semantics |
| `audit:theme` | Light/dark `--ct-*` token parity |
| `audit:empty-states` | List screens + `emptyStates.js` registry coverage |
| `audit:cleanup` | Stale root files, legacy folders, one-off rebrand scripts |
| `audit:native-shells` | TWA + Capacitor config, dev APK scripts, no legacy mobile folders |
| `audit:charts` | Duplicate/similar UI (alias: duplicates) |
| `audit:guidance` | Guidance registries, onboarding, dashboard education |
| `audit:tree` | File tree layout, UI-only placement, orphan screens (`--tree` prints src/) |
| `audit:ui` / `audit:styles` / `audit:ui-depth` | Existing layout/CSS/screen wiring |
| `audit:merge` / `audit:orphans` / `audit:tier` | File consolidation, dead modules, subscription gates |
| `audit:copy` / `audit:i18n` | Formal copy tone; locale key parity |
| `audit:docs-sync` | `docs/09-implementation-status.md` freshness |
| `audit:pre-release` | Production gate + full governance + docs-sync + engine tests |

### Groups

```bash
npm run audit:frontend   # design, mobile, duplicates, ui
npm run audit:platform   # architecture, features
```

### Known advisories (June 2026)

| Scan | Item | Action |
|------|------|--------|
| `audit:charts` (duplicates) | Resolved: net worth categories → `wealthCategories.js` | Bill categories stay in `constants/categories.js` |
| `audit:governance` | Large page files (AuthGate, Analytics) | Extract sections when touching those files |
| `audit:performance` | Main JS chunk ~510 kB | Code-split when adding heavy routes |
| Baseline | **120** QA tests / colocated `src/**/__tests__` / governance tree + Knip clean | Update docs when counts change |

### Flags

```bash
node scripts/audit-runner.mjs modes --json --verbose
node scripts/audit-runner.mjs --all --quick --strict
```

## Registries (`src/governance/registries/`)

| File | Purpose |
|------|---------|
| `features.js` | Product feature map |
| `modes.js` | Mode capabilities & allowlists |
| `insights.js` | Insight producers & tones |
| `analytics.js` | Chart / analytics surfaces |
| `severityRegistry.js` | UI severity tokens (not `ui/tokens/severity.js`) |

Update registries when adding modes, tools, or major features.

## Philosophy

- Audits **advise** on scaling problems — not every warning blocks merge.
- Default `audit:governance:quick` fails only on **errors** (layer violations, design bypass in app code).
- Use `npm run audit -- --strict` for release branches.

## Architecture docs

See [architecture/](./architecture/) for system design reference.

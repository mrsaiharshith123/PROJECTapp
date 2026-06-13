# Engineering governance

Perovo uses a **layered audit system**: production gate + focused governance scans.

## Production gate (pre-merge)

```bash
npm run audit          # same as audit:all
```

Runs: env, deps, CSS, UI layout, ESLint/Knip, UI depth, TypeScript, tests, production build.

## Governance runner

```bash
npm run audit:list              # all audit ids
npm run audit:governance:quick  # fast governance only (~15s)
npm run audit:governance        # all governance checks (no ESLint/Knip)
npm run audit:governance:full   # governance + UI/CSS/depth/merge
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
| `audit:mobile` | Overflow, viewport, fixed widths |
| `audit:charts` | Duplicate/similar UI (alias: duplicates) |
| `audit:guidance` | Guidance registries, onboarding, dashboard education |
| `audit:tree` | File tree layout, UI-only placement, orphan screens (`--tree` prints src/) |
| `audit:ui` / `audit:styles` / `audit:ui-depth` | Existing layout/CSS/screen wiring |
| `audit:copy` / `audit:i18n` | Formal copy tone; locale key parity |

### Groups

```bash
npm run audit:frontend   # design, mobile, duplicates, ui
npm run audit:platform   # architecture, features
```

### Known advisories (June 2026)

| Scan | Item | Action |
|------|------|--------|
| `audit:charts` (duplicates) | Resolved: net worth categories → `wealthCategories.js` | Bill categories stay in `constants/categories.js` |

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

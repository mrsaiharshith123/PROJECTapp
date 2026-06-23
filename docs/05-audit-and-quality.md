# Audit & quality (deep dive)

The project uses **one command** for pre-merge quality: `npm run audit`.

It runs `scripts/audit-all.mjs`, which orchestrates smaller scripts and prints a **color report** (PASS / WARN / FAIL).

## Report sections

### Environment & secrets

- Reads `.env` key count (warning if missing)
- **Fails** if `.env` is tracked by git (security)

### Packages & vulnerabilities

- Verifies `node_modules` install state
- `npm audit` — production deps should be clean; dev toolchain advisories may WARN

### CSS & design tokens (`audit-styles.mjs`)

- Safari/WebKit prefix order (e.g. `-webkit-backdrop-filter` before `backdrop-filter`)
- Basic CSS hygiene tied to the Financial Life design system (`--ct-life-*` in `tokens.css`)
- Governance mobile/responsive scan: `npm run audit:mobile` (advisories on overflow / fixed widths)

### UI layout (`audit-ui.mjs`)

- All JSX UI under `src/ui/`
- No forbidden Tailwind visual classes outside `src/ui/`
- Allowed outside UI: `ct-*` layout tokens only

### Copy tone (`audit-copy-tone.mjs`)

- Scans user-facing strings for informal greetings, contractions, casual CTAs
- Run alone: `npm run audit:copy` or `npm run audit:copy:list`

### Translations (`audit-i18n.mjs`)

- Every `src/i18n/messages/{locale}.js` must match `en.js` key set (~1800+ keys)
- Detects corruption patterns (`tokens.push`, broken `{0}` artifacts)
- Fix: `npm run sync:i18n`, `npm run i18n:repair` — see [10-i18n.md](./10-i18n.md)

### JavaScript / code health (`audit-code.mjs`)

Includes:

| Check | Tool | What it catches |
|-------|------|-----------------|
| Lint | ESLint | React hooks, unused vars, project rules |
| Dead code | Knip | Unused files/exports (with ignores for intentional barrel exports) |
| Hygiene | Custom | Legacy paths (`src/components/`), duplicate files, bad imports |
| Unresolved imports | Custom | Broken relative imports |
| **Orphan modules** | `audit-orphan-modules.mjs` | `engines/` / `services/` files only imported from `__tests__` |
| **UI depth** | `audit-ui-depth.mjs` | See below |

#### UI depth checks (`npm run audit:ui-depth`)

Finds “built but not on screen” problems:

| Finding | Meaning |
|---------|---------|
| `barrel-export` | Exported from `ui/index.js` but never imported in `src/` |
| `unmounted-page` | `ui/features/pages/FooPage.jsx` with no route and no `pages/Foo.jsx` |
| `unreachable-ui` | UI file not imported from `App.jsx` / `pages/` chain |
| `tool-no-handler` | Tool id in `modeExperience.js` without `activeTool === "id"` in `DashboardTools.jsx` |
| `nav-no-route` | Navbar `to="/foo"` without matching `<Route path="/foo">` |
| `dead-screen-buttons` | `<Button>` / `<Fab>` / etc. only in unreachable files |
| `export-never-rendered` | Symbol imported but never used as JSX |

`npm run audit:ui-inventory` lists **wired** controls (the opposite — what *is* on screen).

#### Merge / simplify suggestions (`audit-merge-suggestions.mjs`)

**Advisory only** — does not fail `npm run audit` or `--strict` (merge-suggest warnings are excluded from strict blocking). Each line is actionable:

```text
Merge `toolSourcePickerItems.js` → `ToolSourcePicker.jsx`
only ToolSourcePicker uses it — one file is simpler than two (~103 lines combined)
```

Rules:

- **Only** when folding into an **existing** file (or deleting a useless re-export wrapper) — never “create a new merged file”.
- **High confidence:** small helper used by **one** parent in the same folder (`auth.js` → `client.js` owner).
- **Skipped:** shared utilities imported in many places; large modules; vague “this folder has 5 files”.

```bash
npm run audit:merge
```

### Unit tests

- Runs `npm test` (`vitest run`)
- Parses summary: `Tests N passed`, `Test Files N passed`
- **Fails** if Vitest exits non-zero
- Focused runs: `npm run test:sync` (snapshot + backup log), `npm run test:engines`, `npm run test:utils`
- Current baseline: **120** chaos QA tests in **9** suite files under `tests/suites/`; colocated tests in `src/**/__tests__/`
- Engine coverage: `npm run audit:engine-tests` — advisory list of engines without dedicated test files
- Engine depth scan: `npm run audit:complexity` — flags skeleton engines (&lt;40 lines)
- Engine purity: `npm run audit:engines` — no React/UI imports in `src/engines/`

### TypeScript safety

- `tsc --noEmit -p tsconfig.json`
- Counts `error TS*` lines
- **Fails** on any type error

Current policy: `strict: true` with `checkJs` on `src/`; see `src/types/context.ts` for React context types.

### Production build

- `npm run build`
- **Fails** if build fails
- **Warns** if main JS chunk &gt; ~500 KB (advisory; does not fail default audit)

## Strict mode

```bash
npm run audit -- --strict
```

Warnings in sections marked `strictBlocks` (env, deps, code, UI, tests, types) count as failures. Bundle size warning is still advisory.

## Fixing common audit failures

| Message | Fix |
|---------|-----|
| UI violation outside `src/ui/` | Move component to `ui/` or remove Tailwind classes |
| Knip unused export | Remove export or use it; check `knip.json` ignores for barrels |
| UI depth: barrel export | Remove from `ui/index.js` or import in app code |
| UI depth: tool-no-handler | Add modal block in `DashboardTools.jsx` for that tool id |
| TypeScript error | `npm run typecheck` and fix; update `src/types/` if context-related |
| Vitest failed | `npm test` and fix failing test |
| .env tracked by git | `git rm --cached .env` and ensure `.gitignore` |

## ESLint & Knip alone

```bash
npm run lint
npx knip
```

Audit already runs these; use separately for faster iteration.

## CI recommendation

For pull requests, run at minimum:

```bash
npm run audit
```

Optionally `npm run audit -- --strict` on `main` branch merges.

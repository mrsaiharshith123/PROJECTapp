# Roger all — full maintenance pass

Say **"roger all"** in Cursor (or run the npm script) whenever you want a complete project health check: sync translations, verify docs match code, lint, test, build, and governance.

**Roger all is not a git commit.** It runs audits and fixes blocking failures until exit code 0. Commit only when you explicitly ask.

```bash
npm run roger:all
npm run roger:all -- --fix       # auto-fix ESLint, then full gate
npm run roger:relaxed            # advisories do not fail the gate
```

`npm run audit` and `npm run roger:all` use **strict mode by default**.

Cursor rule: `.cursor/rules/roger-all.mdc` — the agent runs this workflow automatically when you type **roger all**.

## What runs (in order)

| Step | Command | Purpose |
|------|---------|---------|
| 1 (optional) | `lint:fix` | ESLint auto-fix with `--fix` |
| 2 | `sync:i18n` | Copy missing keys from `en.js` into all locale files |
| 3 | `audit:docs-sync` | `09-implementation-status.md` matches shipped features |
| 4 | `audit` | Full production gate (see below) |

## What `npm run audit` includes

1. Environment & secrets
2. Dependencies + `npm audit`
3. CSS compatibility
4. UI layout (all visual UI under `src/ui/`)
5. Copy tone
6. i18n key parity + hardcoded string scan
7. Code health (ESLint, Knip, UI depth)
8. Vitest (122+ tests)
9. TypeScript (`tsc --noEmit`)
10. Production build
11. Governance (design, mobile, shells, tree, …)
12. Feature registry + engine tests + cloud sync rules

**Green exit** = safe to ship from a tooling perspective. Yellow advisories (deps, governance, bundle size) are informational in strict mode unless they are in a strict-blocking section (code, CSS, i18n).

## After roger all fails

1. Read the **FAIL** sections in the audit report
2. Fix blocking errors in code
3. Update docs if product direction changed
4. Re-run `npm run roger:all` until exit code 0

## Product context (keep aligned)

| Topic | Current direction |
|-------|-------------------|
| Distribution | Mobile APK (Capacitor), Play Store TWA, iOS Capacitor |
| Web browser | **Dev only** — localhost phone shell, not a consumer PWA |
| PWA install / landing | Removed — no `vite-plugin-pwa`, no marketing web mode |
| Localhost UI | Full-screen phone frame (`src/ui/dev/DevPhoneFrame.jsx`) |
| App nav | Bottom nav only (no desktop top bar) |
| Boot loader | Single `PageLoader` — P logo + Starting Perovo |
| Data | Local-first; cloud backup manual restore only |

## Related docs

- [04-commands.md](./04-commands.md) — every npm script
- [05-audit-and-quality.md](./05-audit-and-quality.md) — audit internals
- [06-workflow.md](./06-workflow.md) — day-to-day dev flow
- [MOBILE.md](./MOBILE.md) — APK / TWA / Capacitor

# CommitTrack

Local-first PWA for **commitments, pressure, and household/salary cashflow** — not a full expense tracker. Data stays in the browser (`localStorage`); optional Supabase for auth/profile.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm run audit        # full quality gate before PR
```

## Documentation (developers)

**Full handbook:** **[`docs/README.md`](./docs/README.md)**

| Topic | Doc |
|-------|-----|
| What the app does | [docs/01-overview.md](./docs/01-overview.md) |
| Folder structure & where to add code | [docs/02-project-structure.md](./docs/02-project-structure.md) |
| Rules (UI-only, banned patterns) | [docs/03-rules.md](./docs/03-rules.md) |
| All npm commands | [docs/04-commands.md](./docs/04-commands.md) |
| How audit works (deep) | [docs/05-audit-and-quality.md](./docs/05-audit-and-quality.md) |
| Day-to-day workflow | [docs/06-workflow.md](./docs/06-workflow.md) |
| What's built vs planned (V1) | [docs/09-implementation-status.md](./docs/09-implementation-status.md) |
| `dist` / `dev-dist` clutter | [docs/07-repo-folders.md](./docs/07-repo-folders.md) |

## Scripts (summary)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build + PWA |
| `npm run test` | Vitest |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`checkJs` on `src/`) |
| `npm run audit` | **Full audit** (lint, UI rules, depth, tests, types, build) |
| `npm run deploy` | Publish `dist/` to GitHub Pages |

Details: [docs/04-commands.md](./docs/04-commands.md).

## GitHub Pages / Supabase

Add repository secrets for production builds:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID` (optional — Pro/Power upgrades; use test key in dev)

## Build outputs (do not commit)

| Path | Purpose |
|------|---------|
| `dist/` | Production build — deploy only |
| `node_modules/` | Dependencies |

See [docs/02-project-structure.md](./docs/02-project-structure.md) for the full layout.

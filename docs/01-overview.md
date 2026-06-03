# What CommitTrack is

CommitTrack is a **local-first PWA** for tracking **financial commitments** (bills, EMIs, subscriptions, lending, chit funds) and understanding **pressure** on income — not a full expense tracker.

## Core ideas

- **Commitments** — recurring or one-off obligations with due dates, amounts, categories, and payment history.
- **Pressure & stability** — engines compute burden vs income, survival runway, forecasts, and insights.
- **Modes** — salaried, family, freelancer, business, student, power; tools and copy change per mode (`constants/modeExperience.js`).
- **Lending** — track money lent/borrowed with agreements, schedules, and trust scoring.
- **Optional cloud** — Supabase auth/profile when env vars are set; core data still persists in the browser.

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + React Router |
| Build | Vite 8 + PWA (`vite-plugin-pwa`) |
| Styling | Design system under `src/ui/styles/` (`ct-*` classes, not ad-hoc Tailwind in app code) |
| Logic | Plain JS modules in `src/engines/` (no React) |
| Tests | Vitest |
| Types | TypeScript checks JS via `checkJs` (`tsconfig.json`) |
| Charts | Recharts (analytics UI) |

## Data flow (simplified)

```
User action (UI in src/ui/)
    → hooks / context (src/context/, src/hooks/)
    → engines (src/engines/) for calculations
    → utils (src/utils/) for persistence, dates, migration
    → localStorage (+ optional Supabase profile)
```

**Do not put business rules in UI components** — keep calculators and status logic in `engines/` and `utils/`, with tests in `engines/__tests__/` and `utils/__tests__/`.

## Entry points

| File | Role |
|------|------|
| `src/main.jsx` | React root, theme bootstrap |
| `src/App.jsx` | Router, auth shells, lazy-loaded pages |
| `src/ui/features/pages/*.jsx` | Full-page screens (imported from `App.jsx`) |
| `public/notification-handler.js` | Service worker helper for PWA notifications |

## Who this doc is for

Anyone cloning the repo: implement features in the layers described in [02-project-structure.md](./02-project-structure.md) and follow [03-rules.md](./03-rules.md) before opening a PR.

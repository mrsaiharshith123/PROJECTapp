# What CommitTrack is

CommitTrack is a **local-first PWA** for tracking **financial commitments** (bills, EMIs, subscriptions, lending, chit funds) and understanding **pressure** on income — not a full expense tracker.

## Core ideas

- **Commitments** — recurring or one-off obligations with due dates, amounts, categories, and payment history.
- **Pressure & stability** — engines compute burden vs income, survival runway, forecasts, and insights.
- **Modes (V1)** — **salaried only**: single or **family** household (`householdScope`). Removed modes (freelancer, student, business) migrate to salaried on load. Tools and copy live in `constants/modeExperience.js`.
- **Subscriptions** — `free` / `pro` / `power` tiers (`constants/subscriptionTiers.js`). Pro/Power unlock features via `ProGate`; upgrades use Razorpay with **monthly or yearly** billing (~29% off when paid yearly). See [architecture/PaymentsAndLending.md](./architecture/PaymentsAndLending.md).
- **Storage** — local-first on device; optional **CommitTrack Cloud** sync via Supabase (`docs/architecture/LocalFirstSync.md`).
- **Lending** — track money lent/borrowed with schedules, trust scoring, WhatsApp share cards, and **promissory-note export** (`engines/lendingAgreement.js`, `utils/agreementExport.js`). Full legal-details UI is deferred — see [09-implementation-status.md](./09-implementation-status.md).
- **Optional cloud** — Supabase auth/profile when env vars are set; core data still persists in the browser.
- **Admin intelligence (internal)** — role-gated `/admin` dashboard and Profile entry for `is_admin` users; privacy-safe product events in Supabase (`docs/architecture/AdminAnalytics.md`).
- **Appearance** — light, dark, or system theme (`data-theme` on `<html>`, `utils/theme.js`).
- **Languages** — English + 22 scheduled languages of India (`src/i18n/`). Profile language picker; RTL for Urdu. See [10-i18n.md](./10-i18n.md).

## Tech stack

| Layer | Choice |
|-------|--------|
| UI | React 19 + React Router |
| Build | Vite 8 + PWA (`vite-plugin-pwa`) |
| Styling | Financial Life design system — `src/ui/styles/` (`ct-*` + `--ct-life-*` tokens); `tailwind.config.js` bridges legacy Tailwind colors in `src/ui/` |
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
| `src/App.jsx` | Router, auth shells, `I18nProvider`, lazy-loaded pages |
| `src/ui/features/pages/*.jsx` | Full-page screens (imported from `App.jsx`) |
| `public/notification-handler.js` | Service worker helper for PWA notifications |

## Who this doc is for

Anyone cloning the repo: read [09-implementation-status.md](./09-implementation-status.md) for what’s already built, then [02-project-structure.md](./02-project-structure.md) and [03-rules.md](./03-rules.md) before opening a PR.

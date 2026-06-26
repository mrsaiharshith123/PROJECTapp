# Perovo Project Encyclopedia — Master Index

**Purpose:** One place to understand every screen, click, formula, route, test, and folder. Written for humans and AI agents. Logic is explained in **system/math terms**, not as a code walkthrough.

**Version:** See `package.json` (currently **1.5.0**) and [CHANGELOG.md](./CHANGELOG.md).

---

## How to read this encyclopedia

| Volume | File | You will learn |
|--------|------|----------------|
| 1 | [01-routes-and-navigation.md](./01-routes-and-navigation.md) | Every URL, redirect, navbar item, header avatar, FAB menu |
| 2 | [02-pages-and-clicks.md](./02-pages-and-clicks.md) | Every main page + `/you/*` + `/insights/*` — sections, buttons, what opens, wrong vs right input |
| 3 | [03-engines-and-math.md](./03-engines-and-math.md) | How scores, pressure, net worth, lending trust, tax, etc. are computed |
| 4 | [04-testing-and-qa.md](./04-testing-and-qa.md) | Vitest suites, chaos monkey, `npm run qa`, audit pipeline |
| 5 | [05-file-tree-and-data.md](./05-file-tree-and-data.md) | Repo shape, local-first storage, contexts, services boundaries |

---

## Product in one paragraph

Perovo is a **local-first** Indian personal finance app (PWA + Capacitor). Data lives in the browser/device first; optional Supabase backup is **manual restore only** — never auto-overwrites local data. The user tracks **bills, spends, assets, liabilities, instruments, informal lending, and goals**, then sees **pressure, net position, Perovo Score, and insights** derived from engines in `src/engines/`.

---

## Navigation map (mental model)

```
Bottom nav (4 tabs + center +):
  Home | Ledger | [+] | Agreements | Insights

Not in bottom nav:
  You (/you)        → header avatar popover → Account & settings
  Add (/add)        → also reachable via FAB
  Ledger bills/spends → /ledger/bills, /ledger/spends (under Ledger tab)
  Insights breakdowns → /insights/*
  Admin             → /admin (admin users only, floating button)
```

**Groww-style profile:** Identity + net glance in **avatar popover**; full settings list at **`/you`** (no duplicate goals/score hero on You page).

---

## Core data objects (what the app stores)

| Object | Plain meaning | Primary UI |
|--------|---------------|------------|
| `commitments` | Recurring bills / EMIs / insurance premiums | Ledger → Bills |
| `spends` | One-off or daily variable spending | Ledger → Spends |
| `wealthEntries` | Assets, liabilities, instruments (FD, SIP, etc.) | Ledger tabs |
| `lendings` | Informal lent/borrowed agreements | Agreements |
| `goals` | Savings targets | You → Tools |
| `settings` | Income, city, language, tier, reminders | You → Personal / Appearance |
| `monthlySnapshots` | Historical month summaries | Insights, momentum |

All persisted locally via `PerovoContext` → `localStorage` keys in `src/storage/keys.js`. Cloud sync pushes a **snapshot JSON**, not live queries.

---

## Tier gates (Free / Pro / Power)

Features like unlimited lending, chit funds, CA export, bond advisor, subscription leak, AI advisor check `tierHasFeature()` before showing UI. **Wrong:** bypassing tier in UI only — audits enforce gates. **Right:** gate in UI + engine where money logic applies.

See `src/constants/subscriptionTiers.js` and tests in `02-security-tiers.test.mjs`.

---

## i18n rule (non-negotiable)

When user picks a language, **entire UI** is that language. Engines return `{ id, tone, params? }`; UI resolves `t("insight.{id}")`. See `.cursor/rules/single-language-i18n.mdc` and [10-i18n.md](../10-i18n.md).

---

## Commands cheat sheet

| When | Command |
|------|---------|
| Before merge | `npm run audit` |
| Fast check | `npm test` |
| Full QA report | `npm run qa` |
| Lint + dead code | `npm run audit:code` |
| All npm scripts | [04-commands.md](../04-commands.md) |

---

## Related docs (existing)

- [01-overview.md](../01-overview.md) — stack & auth
- [02-project-structure.md](../02-project-structure.md) — where to add code
- [03-rules.md](../03-rules.md) — UI-only, banned patterns
- [08-governance.md](../08-governance.md) — registries & audits
- [09-implementation-status.md](../09-implementation-status.md) — shipped vs deferred
- [architecture/*.md](../architecture/) — deep dives (sync, insights, modes, payments)

---

## Agent rule

Cursor agents: read this index first for product questions, then the volume that matches the task. Do not duplicate settings entry points (gear + account + rows). Do not auto-pull cloud on startup.

# Implementation status (for developers)

Living snapshot of what is **shipped in code** vs **planned**. Update when you land a major feature.

**Version:** `1.5.0` (see [CHANGELOG.md](./CHANGELOG.md)) · **Last reviewed:** 2 July 2026 · **Tests:** 122 Vitest · **Audit:** run `npm run audit` — gate may fail until ESLint/TypeScript backlog is cleared

**Product docs:** [encyclopedia/00-index.md](./encyclopedia/00-index.md) (routes, pages, engines, QA) — prefer encyclopedia over duplicating detail here.

---

## Shipped — core product (V1)

| Area | Status | Routes / paths |
|------|--------|----------------|
| Home dashboard | ✅ | `/` — net position, category tiles, needs attention, tools preview |
| Ledger | ✅ | `/ledger` — assets, liabilities, instruments tabs |
| Bills & spends | ✅ | `/ledger/bills`, `/ledger/spends` |
| Agreements (lending + docs) | ✅ | `/agreements` |
| Add flow | ✅ | `/add` — picker → ledger / tools / spends |
| Insights hub | ✅ | `/insights` — sections + breakdown pages |
| Insights breakdowns | ✅ | `/insights/score`, `/insights/spending`, `/insights/networth`, `/insights/assets`, `/insights/liabilities`, `/insights/instruments`, `/insights/cashflow`, `/insights/pulse` |
| You / settings | ✅ | `/you` — Groww-style list; avatar popover for identity |
| Personal settings | ✅ | `/you/personal` — name, income, email, city, KYC (merged) |
| Tools & goals | ✅ | `/you/tools` |
| Cloud backup | ✅ | `/you/backup` — push on enable; **manual** restore only |
| Security / sessions | ✅ | `/you/security` — deduped devices, OS + browser version |
| Onboarding | ✅ | `/onboarding` |
| Admin (internal) | ✅ | `/admin` — `is_admin` only |
| i18n | ✅ | English + 22 scheduled languages |
| Mobile | ✅ | PWA, Capacitor, TWA, OTA (`docs/MOBILE.md`) |

---

## Shipped — engines & intelligence

| Area | Status | Notes |
|------|--------|-------|
| Pressure & burden | ✅ | `pressureScore.js`, `burden.js`, `safeToSpend.js` |
| Perovo Score | ✅ | Four pillars; `/insights/score` |
| Net worth | ✅ | `engines/netWorth/*`, ledger integration |
| Lending trust & agreements | ✅ | Promissory notes, offer links `/lend/offer` |
| Bill health | ✅ | Per-bill scores |
| Tax / paycheck insights | ✅ | `/paycheck` → `/insights?card=paycheck` |
| CA export (Pro) | ✅ | `/you/backup` |
| Product scope | ✅ | Single-user, salaried-only experience across all primary routes |

---

## Redirects (legacy CommiTrack / old Perovo URLs)

| Old | New |
|-----|-----|
| `/money/bills`, `/commitments` | `/ledger/bills` |
| `/money/spends` | `/ledger/spends` |
| `/money/lending`, `/lending` | `/agreements` |
| `/profile` | `/you` |
| `/analytics` | `/insights` |
| `/plan`, `/tools` | `/you/tools` |
| `/you/account`, `/you/money` | `/you/personal` |

Full table: [encyclopedia/01-routes-and-navigation.md](./encyclopedia/01-routes-and-navigation.md).

---

## Deferred / not in V1 UI

| Item | Notes |
|------|-------|
| Multi-user household room UI | Removed from scope (single-user salaried-only product) |
| Setu AA / BBPS / live bank sync | Post-V1 |
| Full legal lending workflow UI | Basic agreements shipped; deep legal deferred |
| Dedicated unit test per engine | Advisory `audit:engine-tests` still tracks coverage gaps |

---

## Quality gate (June 2026)

| Check | Result |
|-------|--------|
| `npm run audit` | ✅ 0 blocking errors |
| `npm test` | ✅ 122/122 |
| `npm run qa` | ✅ Launch ready |
| `npm run audit:docs-sync` | ✅ |

Optional QA prompt library: [planning/perovo-QA-framework.md](./planning/perovo-QA-framework.md).

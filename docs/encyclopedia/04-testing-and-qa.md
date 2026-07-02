# Volume 4 — Testing, QA & Chaos Monkey

---

## Quick commands

| Command | What runs |
|---------|-----------|
| `npm test` | All Vitest suites once (122 tests) |
| `npm run qa` | Vitest + formatted P0–P3 report |
| `npm run qa -- --fast` | Skips slow stress tests |
| `npm run qa -- --p0` | Only critical failures |
| `npm run test:engines` | Suites 01 + 03 (fintech + monkey) |
| `npm run test:utils` | Suites 02 + 04 (tiers + state machine) |
| `npm run test:sync` | Suite 07 sync governance |
| `npm run audit` | Full gate: lint, knip, i18n, build, governance |

---

## Test suites (`tests/suites/`)

### `01-fintech-logic.test.mjs` — CHAOS + ACCURACY
- Feeds garbage to `pressureScore`, `survival`, `lendingAgreement`, `safeToSpend`.
- **Must never:** throw, return `NaN`, return negative infinity.
- Verifies burden math, tax estimates, chit IRR accuracy.

### `02-security-tiers.test.mjs` — SECURITY
- Fake tiers (`platinum`, `admin`, `null`) must **not** unlock Pro/Power.
- `canAddLendingRecord`, `canAddChitRecord`, `canAddGoal` limits per tier.
- Device session dedupe (`deviceInfo.js`).

### `03-edge-cases.test.mjs` — MONKEY 🐒
The "chaotic monkey" suite: extreme inputs.

| Attack | Example |
|--------|---------|
| Income | `0`, `0.001`, `1e15`, `NaN` |
| Commitments | `null`, `undefined`, 200-bill stress |
| Tax | all zeros, null fields |
| Chit IRR | zero payout, tiny cashflows |

**Pass criteria:** no crash; outputs finite or safe defaults.

### `04-state-machine.test.mjs` — STATE
- Bill status transitions: pending → paid → overdue.
- Lending: signed agreements lock editing; delete rules.

### `05-data-integrity.test.mjs` — DATA
- Pricing constants, tier limits consistent.
- Engine totals: burden sums match commitment list.

### `06-i18n-coverage.test.mjs` — I18N
- All 23 locale files export objects.
- Critical keys exist; no empty stub values for required keys.

### `07-architecture.test.mjs` — ARCHITECTURE
- `syncEngine.js` exports push/pull guards.
- Feature pages don't import `@supabase/supabase-js` directly.
- Engines folder has zero React imports.

### `08-error-safety.test.mjs` — DEGRADATION
- Empty-arg calls on core engines return objects, not throws.

### `09-visual-ux.test.mjs` — UX RULES
- Bottom nav ≤ 5 items.
- No duplicate hero titles.
- Destructive actions de-emphasized.
- Removed household/family routes redirect to `/you` (feature out of scope).

---

## QA runner (`tests/qa-runner.mjs`)

Parses Vitest JSON output, buckets failures:

| Priority | Meaning |
|----------|---------|
| P0 | Ship blocker |
| P1 | Fix before public launch |
| P2 | Fix soon |
| P3 | Nice to fix |

Prints health score / pass rate. **Launch ready: YES** when P0 = 0.

---

## Full audit (`scripts/audit-all.mjs`)

Blocking sections (must pass):
1. Environment & secrets
2. Dependencies (`npm audit` prod)
3. CSS compatibility
4. UI layout (all UI under `src/ui/`)
5. Copy tone (formal)
6. i18n key parity (22 locales + en)
7. Hardcoded string scan
8. **Code:** ESLint + Knip dead files + UI depth
9. **Vitest** 122 tests
10. **TypeScript** `tsc --noEmit`
11. Production build
12. Governance registries
13. Engine test advisory
14. Cloud sync rules (no startup pull)

Warnings (advisory unless `--strict`):
- Large bundle chunks (react-vendor, i18n-core)
- English fallback count in locales
- Engines missing unit tests
- Merge suggestions

---

## Pre-release checklist

```bash
npm run audit
npm run qa
npm run audit:docs-sync
npm run audit:pre-release   # audit + governance + docs + engine tests
```

---

## Writing new tests

- Prefer **behavior** over snapshot trivia.
- Fintech: always test `NaN`, `0`, negative, huge numbers.
- New engine → add case in `01` or `03`, or dedicated file under `tests/suites/`.
- UI copy → `audit:i18n:hardcoded`, not JSX string tests.

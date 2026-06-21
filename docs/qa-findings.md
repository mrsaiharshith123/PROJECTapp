# QA findings snapshot

Code-review audit run **21 June 2026** (QA-01, QA-02, QA-04, QA-10, QA-20 from `docs/planning/perovo-QA-framework.md`).

## P0 — ship blockers

| ID | Finding | Status |
|----|---------|--------|
| — | No open P0 from this pass | Engine edge-case tests pass; admin gate uses server profile |

## P1 — release risks

| ID | Area | Finding | Suggested fix |
|----|------|---------|---------------|
| QA-02-01 | Tier | `subscriptionTier` in local settings can be edited in DevTools; gates read `settings` client-side | Accept for local-first MVP; verify tier on server for paid features long-term |
| QA-02-02 | ProGate | Dev force-show only when `import.meta.env.DEV` | ✅ Verified — `devOverride.js` gates on `IS_DEV` |
| QA-10-01 | Payments | `createServerOrder` returns `null` on failure with no user message in some paths | Improve error toast in `PlansModal` when order creation fails |
| QA-20-01 | IA | Analytics was not in Money nav tabs | ✅ Fixed — Insights 4th pill on `/money` |

## P2 — wrong behavior / confusion

| ID | Area | Finding | Fix |
|----|------|---------|-----|
| QA-13-01 | Duplication | Pressure + runway shown on Profile quick stats and Home hero | ✅ Reduced — Profile strip links to owners |
| QA-13-02 | Duplication | `/paycheck` duplicated Money insights content | ✅ Redirect → `/money/insights` |
| QA-20-02 | Nav | Tab still labeled “Profile” | ✅ Label → “You” (`nav.you`) |
| QA-20-03 | UI sweep | Modern tokens not on every screen | Ongoing — see gap analysis Phase 8 |

## P3 — polish

| ID | Finding |
|----|---------|
| QA-14-01 | Route remains `/profile` while sub-pages use `/you/*` — acceptable deep-link compat |
| QA-15-01 | Full WCAG pass not run in this session — run QA prompt 15 before public launch |

## Health scorecard (this pass)

| Area | Score | Notes |
|------|-------|-------|
| Fintech logic | 8/10 | pressure/survival/safeToSpend tests pass |
| Security posture | 7/10 | RLS + server verify OK; client tier is known gap |
| UI completeness | 7/10 | Money/Plan/You/Admin landed; UI sweep partial |
| Test coverage | 8/10 | 386+ unit tests per status doc |

## Next QA runs

1. QA-04 full RLS migration read (all tables)
2. QA-10 live Razorpay sandbox payment
3. QA-26 master compile after UI sweep

See `docs/planning/perovo-QA-framework.md` for all 26 prompts.

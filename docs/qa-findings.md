# QA findings snapshot

Code-review audit run **22 June 2026** (full `npm run audit` pass after score/analytics/asset OS + dead-code cleanup).

## Audit gate (22 June 2026)

| Check | Result |
|-------|--------|
| `npm run audit` | ✅ **0 blocking errors** |
| `npm run audit:tree` | ✅ 0 errors |
| `npm run audit:ui-depth` | ✅ 0 issues |
| `npm run audit:docs-sync` | ✅ Current |
| `npm test` | ✅ 105/105 |
| `npm run typecheck` | ✅ Clean |

**Advisories (non-blocking):** 2 moderate npm audit deps, i18n English fallbacks (~2379 keys), large i18n bundle chunk, ~400 governance warnings (large pages, a11y, empty states), 91 engines without dedicated test files, 4 merge suggestions.

## Dead code removed (22 June 2026)

Unreachable UI deleted (no `App.jsx` import chain): `AnalyticsScoreTiles`, `FamilyCalendarWidget`, `FestivalPlannerCard`, `PaycheckPage`, `ProfileWealthAnalyticsPage`, `PaycheckTimelinePanel`, `SafeToSpendCard`.

Unused services/utils removed: `otpConfirmation.js`, `lendingProfileShare.js` (deal share uses `lendingShareCard.js`).

**Wired into product:** `netWorthBenchmark.js` → Wealth tab; `recurringSpendDetect.js` → transaction insights.

## P0 — ship blockers

| ID | Finding | Status |
|----|---------|--------|
| — | No open P0 | Engine tests pass; OTA boot fixed v1.0.3+ |

## P1 — release risks

| ID | Area | Finding | Status |
|----|------|---------|--------|
| QA-02-01 | Tier | Client-side `subscriptionTier` in local settings | Accepted local-first MVP; server verify on paid checkout |
| QA-02-02 | ProGate | Dev override gated on `IS_DEV` | ✅ Verified |
| QA-10-01 | Payments | Silent failure when server order missing | ✅ Fixed — `plans.orderFailed` toast |
| QA-20-01 | IA | Analytics not in Money nav | ✅ Insights + Wealth pills |

## P2 — wrong behavior / confusion

| ID | Area | Finding | Status |
|----|------|---------|--------|
| QA-13-01 | Duplication | Pressure + runway on Profile strip | ✅ MetricOwnerLink |
| QA-13-02 | Duplication | Paycheck duplicated Insights | ✅ Redirect |
| QA-13-03 | Duplication | Net worth scattered | ✅ `/money/wealth` |
| QA-13-04 | Duplication | Pulse card on Insights | ✅ Removed |
| QA-13-05 | Duplication | Family outlook pressure/runway | ✅ Links to Home / Insights |
| QA-20-02 | Nav | “Profile” label | ✅ “You” |
| QA-20-03 | UI sweep | Legacy Tailwind on tools/forms | ✅ Phase 8 complete |

## P3 — polish

| ID | Finding | Status |
|----|---------|--------|
| QA-14-01 | Route `/profile` vs `/you/*` deep links | Accepted compat |
| QA-15-01 | Full WCAG pass | Deferred pre-store launch |
| QA-26-01 | Account Aggregator | Explicitly post-V1 |

## Health scorecard

| Area | Score | Notes |
|------|-------|-------|
| Fintech logic | 9/10 | Chaos suite + engine null guards |
| Security posture | 7/10 | RLS + server verify; client tier known gap |
| UI completeness | 9/10 | Money/Plan/You/Admin + token sweep |
| Test coverage | 9/10 | 105 chaos tests · `npm run qa` health 10/10 |

## Manual follow-ups (cannot automate)

1. **QA-10 live:** One Razorpay sandbox payment on device with test keys
2. **QA-15:** WCAG keyboard/contrast pass before Play Store
3. **Account Aggregator:** Future epic — not in gap analysis V1 execution plan

See `docs/planning/perovo-qa-system-prompt.md` for the chaos-first suite spec.

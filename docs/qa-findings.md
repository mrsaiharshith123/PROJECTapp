# QA findings snapshot

Code-review audit run **21 June 2026** (gap analysis completion + QA framework prompts 01, 02, 04, 10, 13, 20, 26).

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
| Fintech logic | 8/10 | Engine tests green |
| Security posture | 7/10 | RLS + server verify; client tier known gap |
| UI completeness | 9/10 | Money/Plan/You/Admin + token sweep |
| Test coverage | 8/10 | 386+ unit tests |

## Manual follow-ups (cannot automate)

1. **QA-10 live:** One Razorpay sandbox payment on device with test keys
2. **QA-15:** WCAG keyboard/contrast pass before Play Store
3. **Account Aggregator:** Future epic — not in gap analysis V1 execution plan

See `docs/planning/perovo-QA-framework.md` for all 26 prompts.

# Perovo — system architecture

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Entry | `main.jsx`, `App.jsx` | Boot, routing, auth/onboarding gates |
| Context | `context/` | `PerovoProvider`, `AuthProvider` — app state |
| Hooks | `hooks/` | Compose engines + context for screens |
| Engines | `engines/` | Pure finance: forecast, pressure, survival, lending, insights |
| Utils | `utils/` | Dates, storage, migrations, export/formatting helpers |
| Constants | `constants/` | Modes, categories, copy keys, nav |
| i18n | `i18n/` | Messages, `useTranslation`, locale helpers — [10-i18n.md](../10-i18n.md) |
| Guidance | `guidance/` | Education registries (copy keys; UI in `ui/guidance/`) |
| Services | `services/` | Supabase auth, cloud sync, product analytics, notifications, Razorpay, OTP confirmation |
| UI | `ui/` | All visual UI — primitives, patterns, features, pages |
| Governance | `scripts/registries/` | Registries for audit tooling — build-time only, not part of `src/`, never loaded in the production bundle |

### The rule that's actually enforced

`utils/` is **not** a zero-dependency base layer — several `utils/` files legitimately
import from `engines/`/`services/` (e.g. `wealthDailySeries.js` needs
`computeNetWorthCore`, `lendingFinancials.js` needs `trustScoreForLendingEntry`)
because they're building exports/summaries on top of an engine's computed
result, not reimplementing engine logic. Don't move that kind of code just to
satisfy a "utils sits below engines" rule — it doesn't and was never true in
practice. **The rule that does hold everywhere and must never be broken:**

- `engines/` and `services/` never import from `ui/` or `context/`.
- No import cycles, in any direction, between any two files.
- A pure, domain-agnostic helper (string/number formatting, generic parsing —
  no business decisions) belongs in `utils/` even if only one engine currently
  uses it; don't leave it defined inside an engine file "because that's the
  only caller today" (see `utils/numberToWords.js`, extracted from
  `engines/lendingAgreement.js` for exactly this reason).

## Data flow

1. User action in **UI** → hook or context method.
2. Context updates **localStorage** (commitments, lendings, settings).
3. Hooks call **engines** with normalized inputs.
4. Engines return scores, insights, forecasts (no React).
5. UI renders results via **ct-*** design system.

## Routing

`App.jsx` lazy-loads `ui/features/pages/*` and `app/*` glue (ThemeSync, ModeRoute, ToolsRedirect).

## Calculation systems

- **Burden / pressure** — `burden.js`, `pressureScore.js`, `pressureIntelligence.js`
- **Forecast** — `forecast.js`, `forecastSeries.js`, `stabilityPlan.js`
- **Survival** — `survival.js`, `emergencyFund.js`
- **Lending** — `lendingTrust.js`, `lendingAgreement.js` (promissory note), utils `lendingStatus.js`, `agreementExport.js`
- **Subscriptions** — `subscriptionTiers.js`, `ProGate`, `services/razorpaySubscription.js`
- **Insights** — `intelligence.js`, `insightsExtended.js` (see [InsightEngine.md](./InsightEngine.md))

## Payments

1. User picks **monthly** or **yearly** in `PlansModal`, then taps upgrade → `startSubscriptionCheckout({ tier, billing })`.
2. Amounts from `getTierPaise()` / `PLAN_PRESENTATION` (yearly ≈ 29% off monthly×12).
3. Edge Function `razorpay-checkout` creates order with matching `billing`; Razorpay modal opens.
4. On success, server verify when order + signature exist; else `saveSubscriptionTier`; then `updateSettings({ subscriptionTier })`.

## Lending legal documents

1. `buildPromissoryNoteText(lending, settings)` — India-structured note (Negotiable Instruments style sections).
2. `generateLegalAgreementHtml()` — print-ready A4 HTML with stamp-duty banner.
3. `downloadLendingAgreementHtml()` — triggered from lending detail UI; no separate legal modal required for basic export.
4. `otpConfirmation.js` — confirmation refs for future signing UI; not Aadhaar eSign.

## Admin intelligence & analytics

1. **Instrumentation** — `AnalyticsBridge` in `App.jsx` tracks page views, module opens, and session heartbeats for signed-in users.
2. **API** — `trackEvent()` from `services/analytics/trackEvent.js` (never insert `app_events` from UI).
3. **Storage** — Supabase `app_events` when cloud env is set; RLS limits users to own rows; admins read all via `is_perovo_admin()`.
4. **Dashboard** — `/admin` + `admin_product_overview()` RPC; Profile shows **Product intelligence** tile only when `profile.is_admin`.
5. **Grant admin** — Supabase SQL only (`grant_perovo_admin`). See [AdminAnalytics.md](./AdminAnalytics.md).

## Future-proofing (partial / planned)

- **Server payment verify** — implemented: `supabase/functions/razorpay-checkout` does server-side HMAC signature verification with an idempotency table.
- **Aadhaar eSign** — Leegality or similar (not implemented).
- **OS launcher home** — module grid UX (deferred; see [../09-implementation-status.md](../09-implementation-status.md)).
- **Feature flags**: extend `scripts/registries/` + mode capabilities.
- **Cloud sync**: context persistence is the single swap point.
- **React Native**: keep engines/utils/constants free of DOM; UI stays replaceable.

## Related docs

- [DesignSystem.md](./DesignSystem.md)
- [AdminAnalytics.md](./AdminAnalytics.md)
- [FeatureRegistry.md](./FeatureRegistry.md)
- [ModeArchitecture.md](./ModeArchitecture.md)
- [../08-governance.md](../08-governance.md)

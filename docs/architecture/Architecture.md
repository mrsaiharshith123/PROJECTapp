# CommitTrack — system architecture

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Entry | `main.jsx`, `App.jsx` | Boot, routing, auth/onboarding gates |
| Context | `context/` | `CommitTrackProvider`, `AuthProvider` — app state |
| Hooks | `hooks/` | Compose engines + context for screens |
| Engines | `engines/` | Pure finance: forecast, pressure, survival, lending, insights |
| Utils | `utils/` | Dates, storage, migrations, lending helpers |
| Constants | `constants/` | Modes, categories, copy keys, nav |
| i18n | `i18n/` | Messages, `useTranslation`, locale helpers — [10-i18n.md](../10-i18n.md) |
| Guidance | `guidance/` | Education registries (copy keys; UI in `ui/guidance/`) |
| Services | `services/` | Supabase auth, cloud sync, notifications, Razorpay, OTP confirmation |
| UI | `ui/` | All visual UI — primitives, patterns, features, pages |
| Governance | `governance/` | Registries for audits (not loaded in production bundle) |

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
- **Subscriptions** — `subscriptionTiers.js`, `ProGate`, `services/razorpay.js`
- **Insights** — `intelligence.js`, `insightsExtended.js` (see [InsightEngine.md](./InsightEngine.md))

## Payments (client-side today)

1. User taps upgrade in `PlansModal` → `openRazorpayCheckout()` in `services/razorpay.js`.
2. On success handler, `updateSettings({ subscriptionTier })` runs locally.
3. **Production TODO:** verify `razorpay_payment_id` on server before granting tier (see comment in `razorpay.js`).

## Lending legal documents

1. `buildPromissoryNoteText(lending, settings)` — India-structured note (Negotiable Instruments style sections).
2. `generateLegalAgreementHtml()` — print-ready A4 HTML with stamp-duty banner.
3. `downloadLendingAgreementHtml()` — triggered from lending detail UI; no separate legal modal required for basic export.
4. `otpConfirmation.js` — confirmation refs for future signing UI; not Aadhaar eSign.

## Future-proofing (partial / planned)

- **Server payment verify** — Supabase Edge Function (not implemented).
- **Aadhaar eSign** — Leegality or similar (not implemented).
- **OS launcher home** — module grid UX (deferred; see [../09-implementation-status.md](../09-implementation-status.md)).
- **Feature flags**: extend `src/governance/registries/` + mode capabilities.
- **Cloud sync**: context persistence is the single swap point.
- **React Native**: keep engines/utils/constants free of DOM; UI stays replaceable.

## Related docs

- [DesignSystem.md](./DesignSystem.md)
- [FeatureRegistry.md](./FeatureRegistry.md)
- [ModeArchitecture.md](./ModeArchitecture.md)
- [../08-governance.md](../08-governance.md)

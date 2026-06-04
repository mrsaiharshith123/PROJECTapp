# CommitTrack — system architecture

## Layers

| Layer | Path | Responsibility |
|-------|------|----------------|
| Entry | `main.jsx`, `App.jsx` | Boot, routing, auth/onboarding gates |
| Context | `context/` | `CommitTrackProvider`, `AuthProvider` — app state |
| Hooks | `hooks/` | Compose engines + context for screens |
| Engines | `engines/` | Pure finance: forecast, pressure, survival, lending, insights |
| Utils | `utils/` | Dates, storage, migrations, lending helpers |
| Constants | `constants/` | Modes, categories, copy, nav |
| Services | `services/` | Supabase auth, cloud sync, notifications |
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
- **Lending** — `lendingTrust.js`, utils `lendingStatus.js`
- **Insights** — `intelligence.js`, `insightsExtended.js` (see [InsightEngine.md](./InsightEngine.md))

## Future-proofing (not implemented)

- **Backend**: services layer already isolates Supabase; engines stay pure.
- **Feature flags**: extend `src/governance/registries/` + mode capabilities.
- **Premium**: gate tools via `MODE_TOOL_IDS` in `modeExperience.js`.
- **Cloud sync**: context persistence is the single swap point.
- **React Native**: keep engines/utils/constants free of DOM; UI stays replaceable.

## Related docs

- [DesignSystem.md](./DesignSystem.md)
- [FeatureRegistry.md](./FeatureRegistry.md)
- [ModeArchitecture.md](./ModeArchitecture.md)
- [../08-governance.md](../08-governance.md)

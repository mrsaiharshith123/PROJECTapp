# Financial Guidance System

Centralized education and explanation — not scattered copy in features.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Registry | `src/guidance/registry/` | Concepts, onboarding, empty states, dashboard focus, micro tips |
| Logic | `src/guidance/explainInsight.js`, `interpretMetric.js` | Why insights appear; KPI interpretation |
| UI | `src/ui/guidance/` | ConceptHelp, WhyInsightPanel, GuidanceBanner, GuidedEmptyState, MicroTipCard |

Import from `src/guidance/index.js` in app code; import UI from `src/ui` or `src/ui/guidance/`.

## Principles

- Calm, short, human tone — no textbook jargon
- Progressive disclosure (onboarding → dashboard → tooltips → “why” on insights)
- Mode-specific copy via `getExperienceMode(settings)` in registries

## Governance

```bash
npm run audit:guidance
```

Checks registry completeness, onboarding wiring, and dashboard education hooks.

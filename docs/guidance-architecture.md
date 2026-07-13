# Financial Guidance System

Centralized education and explanation — not scattered copy in features.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Registry | `src/constants/guidance/registry/` | Concepts, onboarding, empty states, dashboard focus, micro tips |
| Logic | `src/constants/guidance/explainInsight.js`, `interpretMetric.js` | Why insights appear; KPI interpretation |
| UI | `src/ui/guidance/` | ConceptHelp, WhyInsightPanel, GuidanceBanner, GuidedEmptyState, MicroTipCard |

Import content/copy from `src/constants/guidance/index.js`; import UI components from `src/ui/guidance/`.
These two directories share the word "guidance" but are deliberately kept apart by tier
(constants = data, ui = components) — do not merge them back under one top-level `src/guidance/`,
that naming collision (same word resolving to two different directories depending on relative
import depth) was the actual bug this reorganization fixed.

## Principles

- Calm, short, human tone — no textbook jargon
- Progressive disclosure (onboarding → dashboard → tooltips → “why” on insights)
- Mode-specific copy via `getExperienceMode(settings)` in registries

## Governance

```bash
npm run audit:guidance
```

Checks registry completeness, onboarding wiring, and dashboard education hooks.

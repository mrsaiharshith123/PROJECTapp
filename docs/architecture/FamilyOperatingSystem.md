# Family Financial Operating System

Perovo family mode is **not** budgeting, bill-splitting, or accounting. It is a **household coordination OS** — responsibility, contribution, pressure, dependency, and emotional financial intelligence.

## Philosophy

| Traditional apps track | Family OS tracks |
|------------------------|------------------|
| Transactions | Responsibility & contribution |
| Categories | Sacrifice & dependency |
| Balances | Pressure & stability |
| Accounts | Household resilience |

Tone: warm, calm, collaborative — not cold fintech spreadsheets.

## Architecture (engine-driven)

```
settings (householdScope, members, income, dependents, rooms)
        ↓
┌───────────────────────────────────────────────────────┐
│ familyCommandCenter.js (orchestrator)                 │
├─────────────┬──────────────┬────────────┬─────────────┤
│ modeFamily  │ household    │ family     │ family      │
│ pressure    │ Entity       │ Dependency │ Contribution│
├─────────────┴──────────────┴────────────┴─────────────┤
│ familyStabilityScore · familyPressureForecast         │
└───────────────────────────────────────────────────────┘
        ↓
useFamilyCommandIntel → HouseholdCommandPanel (Analytics full house)
useStabilityIntel     → FamilyModeDashboard (Analytics)
HouseholdRoomBridge   → rejoin room / setup modal prompt
```

### Core engines (`src/engines/`)

| Engine | Purpose |
|--------|---------|
| `familyCommandCenter.js` | Single API for Home command center |
| `familyStabilityScore.js` | Unified household stability index (0–100) |
| `familyDependency.js` | Income concentration, overload, member archetypes |
| `familyContribution.js` | Contribution memory from payment history + payer tags |
| `familyPressureForecast.js` | Heavy months, school windows, liquidity risk |
| `modeFamily.js` | Category pressure, renewals, school fees |
| `householdEntity.js` | Combined metrics, emergency target |
| `householdPayer.js` | Payer-tag burden split |
| `householdSpendBreakdown.js` | Per-member spend this month |
| `householdRoom*.js` | Invite-code rooms (local-first + cloud) |
| `familyCalendar.js` | Multi-month expense calendar |

### Member model

`settings.householdMembers[]` — roles: `owner`, `spouse`, `dependent`, `parent`, `contributor`.

Mapped archetypes: main earner, shared earner, dependent, parent, contributor, vulnerable.

Bill/spend tags: `householdPayer` (primary/secondary/shared), `forMember` (self/spouse/shared/child).

### UI surfaces

| Surface | Route | Role |
|---------|-------|------|
| **HouseholdCommandPanel** | Analytics (full house) | Unified household OS — stability, rooms, members, outlook |
| **HouseholdFamilyBadge** | Home + Analytics | Dependents count + pencil → editor modal |
| **FamilyModeDashboard** | Analytics | Deep household dashboard |
| **FinancialPulseCard** | Analytics | Pulse + forecast (Self or Full house scope) |
| **HouseholdSpendPanel** | Analytics | Spend by person / category |

### Insights

All family insights use `{ id, tone, params? }` → `insight.{id}` in `en.js` → `translateInsight()`.

## Implementation phases

### Phase 1 — Shipped (foundation)

- [x] Unified `familyStabilityScore` + `familyCommandCenter` orchestrator
- [x] Dependency analysis (income concentration, single-earner risk)
- [x] Contribution memory from payment history (local ledger)
- [x] Pressure forecast merge (calendar + ahead plan + emergency)
- [x] Analytics **Household Command Panel** (merged hub + command center)
- [x] Home/Analytics dependents badge + `HouseholdDependentsEditorModal`
- [x] Insight i18n cleanup (`modeFamily`, `familyCalendar`, `householdPayer`, `ModeInsightStrip`)

### Phase 2 — Next

- [ ] Household members editor UI (roles, income share)
- [ ] Persisted contribution timeline (`settings.contributionMemory`)
- [ ] Shared goals with member attribution + milestone celebrations
- [ ] AI family insights via advisor (calm tone, non-judgmental)
- [ ] Cross-device room sync (Supabase migration applied)

### Phase 3 — Long-term

- [ ] Family relationship graph visualization
- [ ] Responsibility score per member over time
- [ ] “Google Photos for family financial life” — browsable contribution history
- [ ] Festival / seasonal pressure intelligence
- [ ] Collaborative life-planning (wedding, education, medical reserves)

## Rules & audits

- Copy: `.cursor/rules/family-mode-copy.mdc`
- Philosophy: `.cursor/rules/family-os.mdc`
- Data scope: `resolveDataProfileScope()` — family = all profiles combined
- `npm run audit:household` after family UI/engine changes

## Related

- [ModeArchitecture.md](./ModeArchitecture.md)
- [../09-implementation-status.md](../09-implementation-status.md)

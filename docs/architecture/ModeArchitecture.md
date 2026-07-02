# Mode architecture (V1)

Perovo V1 is **single-user salaried only**. There is no household scope, family mode, or multi-user room.

## User mode

| Mode | Description | Dashboard |
|------|-------------|-----------|
| **Salaried** | One person, one income profile, personal bills & net worth | `HomeOverviewCard`, `FinancialPulseCard`, Analytics |

Removed modes (freelancer, student, business, family/household) **migrate to salaried** on load via `migrateStorage.js` and `userModes.js`.

## Settings

- **`settings.userMode`** — always `salaried` in V1.
- **`settings.profiles`** — optional bill-tracking profiles (Power tier); not household members.
- **`resolveDataProfileScope(settings)`** — returns active profile id or `null` for all profiles combined (single-user analytics only).

## Home stack

1. `HomeOverviewCard` → `HeroMonthCard` — month hero: scheduled / paid / unpaid, Insights status block, salary bar, sparkline → `/analytics`
2. `HomeNeedsAttention` — overdue / due-soon bills
3. `HomeUpcomingSection` — next 14 days
4. `FinancialPulseCard` — personal stability pulse → Analytics

## Tools & copy

Mode-specific tools and onboarding copy live in `src/constants/modeExperience.js`. Governance audit: `npm run audit:modes`.

## Deferred / removed

- Household scope (`single` | `family`), dependents editor, family dashboards
- Household rooms (invite codes, shared activity feed) — tables dropped in `20260623130000_drop_household_rooms.sql`
- `household_scope` on Supabase `profiles` is a **legacy column** (always `single`); not used in app logic

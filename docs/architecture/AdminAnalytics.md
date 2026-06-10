# Admin intelligence & product analytics

Built-in **product intelligence** for CommitTrack operators — not a separate admin site. Growth, retention, module usage, and onboarding funnel metrics live at `/admin` inside the same PWA.

## Who can access it

| Role | What they see |
|------|----------------|
| **Admin** (`profiles.is_admin = true`) | Profile → **Admin board** tile (below Control center) and `/admin` — analytics + user management |
| **Everyone else** | No nav link, no profile tile, `/admin` redirects to Home |

Admin status is **never self-granted** from the app API. Grant via Supabase SQL Editor only (see [Granting admin](#granting-admin)).

## User-facing entry points

1. **Profile** — `ProfileAdminEntry.jsx` renders only when `useAuth().isAdmin` is true. Placed below the control-center tile grid, above expandable settings panels. Label: **Internal** → tile **Product intelligence** → navigates to `/admin`.
2. **Direct URL** — `/admin` (guarded by `RequireAdmin`).

There is **no** bottom-nav item for admin — intentional, to keep the product surface clean for non-admins.

## Architecture

```
User action / navigation
    → AnalyticsBridge (page views, module opens, session heartbeats)
    → trackEvent()  ← public API — always use this
    → analyticsHub.js (fan-out to registered providers)
    → supabaseProvider.js → app_events table (when cloud configured)

Admin opens /admin
    → RequireAdmin (client: profile.is_admin)
    → useAdminOverview → RPC admin_product_overview()
    → AdminPage (metrics, charts, retention, modules, onboarding, signups)
```

### Key paths

| Layer | Path | Role |
|-------|------|------|
| Route guard | `src/app/RequireAdmin.jsx` | Blocks non-admins |
| Instrumentation | `src/app/AnalyticsBridge.jsx` | Mounted in `App.jsx` — sessions + navigation |
| Public tracking API | `src/services/analytics/trackEvent.js` | **Only** entry for new events |
| Event names | `src/services/analytics/eventNames.js` | Stable `ANALYTICS_EVENTS` constants |
| Hub | `src/services/analytics/analyticsHub.js` | Provider registry; `registerAnalyticsProvider()` for PostHog etc. |
| Supabase writer | `src/services/analytics/providers/supabaseProvider.js` | Inserts into `app_events` |
| Admin fetch | `src/services/analytics/adminIntel.js` | `isAdminProfile()`, `fetchAdminOverview()` |
| Admin hook | `src/hooks/useAdminOverview.js` | Loading/error/refresh for dashboard |
| Dashboard UI | `src/ui/features/pages/AdminPage.jsx` | Full page |
| Widgets | `src/ui/features/admin/*` | `AdminMetricCard`, `AdminGrowthChart`, `AdminUsersPanel` |
| User admin API | `src/services/adminUsers.js` | List, verify PAN, grant admin, edit profile, delete user |
| Profile entry | `src/ui/features/profile/hub/ProfileAdminEntry.jsx` | Admin-only tile |
| Auth flag | `src/context/AuthContext.jsx` | Exposes `isAdmin: Boolean(profile?.is_admin)` |

Auth and onboarding also call `trackEvent()` from `AuthContext.jsx` and `OnboardingPage.jsx`.

## Privacy rules

Track **product behaviour only** — never sensitive financial or identity data.

| OK | Never |
|----|-------|
| Module opens (`home`, `commitments`, `lending`, …) | Bill amounts, PAN, Aadhaar |
| Onboarding step completion | SMS message content |
| Session start / heartbeat | Lending principal or borrower PII |
| Auth sign-in / sign-up (no credentials) | Full profile payloads in `properties` |

Use `module` and `step` columns on `app_events`; keep `properties` jsonb minimal.

## Database (Supabase)

Apply migrations **in order** (SQL Editor or `supabase db push`):

| Migration | Purpose |
|-----------|---------|
| `20260606000000_admin_analytics.sql` | `is_admin`, `last_active_at`, `created_at` on `profiles`; `app_events` table; RLS; `is_committrack_admin()`; `admin_product_overview()` RPC; activity triggers |
| `20260606010000_fix_admin_rls_recursion.sql` | Fix login break — security-definer admin check; policies no longer recurse on `profiles` |
| `20260606020000_fix_admin_grant_trigger.sql` | Allow SQL Editor to grant admin; `grant_committrack_admin(uuid)` helper |
| `20260606030000_daily_spends_table_from_snapshot.sql` | Creates `public.daily_spends` + RLS and materializes `payload.dailySpends` from `user_finance_snapshots` |
| `20260610020000_admin_user_management.sql` | Admin RPCs: `admin_list_users`, `admin_update_user`, `admin_set_user_admin`, `admin_delete_user`; admins may grant `is_admin` from the app |

`supabase/schema-final.sql` is a convenience snapshot — **migrations are the source of truth** for admin schema until schema-final is refreshed.

### Tables & columns

- **`profiles.is_admin`** — boolean, default `false`
- **`profiles.last_active_at`** — updated on session heartbeats
- **`app_events`** — `user_id`, `event_name`, `module`, `step`, `properties`, `session_id`, `created_at`

### RLS summary

- Users insert/read **own** `app_events` only.
- Admins read **all** `app_events` and **all** `profiles` via `is_committrack_admin()`.
- `profiles_guard_admin_column` trigger: non-admins cannot flip `is_admin`; CommitTrack admins and SQL Editor can.

### Granting admin

**In app (after `20260610020000_admin_user_management.sql`):** `/admin` → User management → **Make admin** on a user row.

**First admin (SQL Editor only):**

```sql
SELECT grant_committrack_admin('<user-uuid>');
```

Find the user UUID in **Authentication → Users**. Sign out and back in so the client reloads `profile.is_admin`.

### User management (in-app)

Admins can search users, verify/revoke PAN, edit profile fields (name, phone, tier, income), grant/revoke admin, and delete accounts (not self). All mutations go through secured RPCs — no Supabase dashboard required for day-to-day ops.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| “Could not load your account” on login | RLS recursion on `profiles` | Run `20260606010000_fix_admin_rls_recursion.sql` |
| `is_admin` resets to `false` after SQL update | Old trigger blocked all updates | Run `20260606020000_fix_admin_grant_trigger.sql` |
| `/admin` redirects home | Not logged in or `is_admin` false | Grant admin + re-auth |
| Empty dashboard | No events yet / Supabase env missing | Use app normally; ensure `VITE_SUPABASE_*` set |

## Adding new events

1. Add a stable name to `ANALYTICS_EVENTS` in `eventNames.js`.
2. Call `trackEvent(ANALYTICS_EVENTS.YOUR_EVENT, { module, step, properties })`.
3. **Do not** insert into `app_events` from UI or hooks directly.
4. If the dashboard needs aggregation, extend `admin_product_overview()` in a new migration.

## Future providers

Register additional sinks without changing call sites:

```js
import { registerAnalyticsProvider } from "../services/analytics/analyticsHub.js";

registerAnalyticsProvider({
  name: "posthog",
  track(eventName, opts) { /* … */ },
});
```

Supabase remains the default when env vars are configured.

## i18n

- Profile entry: `profileHub.adminLabel`, `profileHub.adminTile`
- Dashboard: `admin.*` keys in `src/i18n/messages/en.js` (synced to 22 locales via `npm run sync:i18n`)

## Tests

- `src/services/analytics/__tests__/adminIntel.test.js`
- `src/services/analytics/__tests__/modules.test.js`

Run `npm test` or full `npm run audit`.

## Cursor rule

Agent conventions: `.cursor/rules/admin-analytics.mdc`

## Related docs

- [FeatureRegistry.md](./FeatureRegistry.md) — `admin-intelligence` feature id
- [09-implementation-status.md](../09-implementation-status.md) — shipped status
- [LocalFirstSync.md](./LocalFirstSync.md) — cloud vs local-first context

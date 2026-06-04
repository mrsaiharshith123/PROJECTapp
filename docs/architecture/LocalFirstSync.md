# Local-first & Supabase account backup

## Philosophy

- **Local-first**: finance engines, dashboards, and persistence run on-device (`localStorage`).
- **Account backup**: signed-in users get a private Supabase row (`user_finance_snapshots`) under their auth user id — not a separate “cloud product”.
- **Offline-safe**: no network required for daily use; backup is debounced background work after sign-in.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Storage keys | `src/storage/keys.js` | Canonical localStorage key names |
| Snapshots | `src/storage/appSnapshot.js` | Export/sync JSON shape |
| Events | `src/storage/events.js` | `committrack:data-changed` after local writes |
| Sync engine | `src/services/sync/syncEngine.js` | Push/pull, debounce, conflict (local-newer preference) |
| Cloud sync | `src/services/sync/syncEngine.js` | Supabase `user_finance_snapshots` |
| Bridge | `src/app/CloudSyncBridge.jsx` | Background sync when cloud enabled |
| UI | `ProfileCloudSyncSection.jsx` | Account backup, restore |

## Supabase

Migration: `supabase/migrations/*user_finance_snapshots.sql`

- One row per `user_id` (full app snapshot JSONB).
- **RLS**: `auth.uid() = user_id` for all operations.

Apply both migrations in Supabase SQL editor or CLI before production sign-in.

Also run `20260604150000_profiles.sql` for Account name/mode fields.

## Who gets backup

| Case | Behavior |
|------|----------|
| No sign-in | Full app on device; JSON export/import |
| Signed in + Supabase keys | Auto backup to `user_finance_snapshots` (RLS per user) |

## Backup options

- **Local**: JSON export in Profile → Local data & export.
- **Account**: Supabase snapshot when signed in (`services/sync`).

## Audits

```bash
npm run audit:sync
npm run audit:governance
```

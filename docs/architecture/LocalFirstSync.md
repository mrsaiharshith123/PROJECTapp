# Local-first & CommitTrack Cloud Sync

## Philosophy

- **Local-first**: finance engines, dashboards, and persistence run on-device (`localStorage`).
- **Optional cloud**: signed-in users may enable **CommitTrack Cloud** for backup, restore, and multi-device continuity.
- **Offline-safe**: no network required for daily use; sync is debounced background work.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Storage keys | `src/storage/keys.js` | Canonical localStorage key names |
| Snapshots | `src/storage/appSnapshot.js` | Export/sync JSON shape |
| Events | `src/storage/events.js` | `committrack:data-changed` after local writes |
| Sync engine | `src/services/sync/syncEngine.js` | Push/pull, debounce, conflict (local-newer preference) |
| Cloud sync | `src/services/sync/syncEngine.js` | Supabase `user_finance_snapshots` |
| Bridge | `src/app/CloudSyncBridge.jsx` | Background sync when cloud enabled |
| UI | `ProfileCloudSyncSection.jsx` | Enable cloud, backup now, restore |

## Supabase

Migration: `supabase/migrations/*user_finance_snapshots.sql`

- One row per `user_id` (full app snapshot JSONB).
- **RLS**: `auth.uid() = user_id` for all operations.

Apply in Supabase SQL editor or CLI before enabling cloud in production.

## Tiers

| Tier | Behavior |
|------|----------|
| Free / local | Full app, no sign-in required, JSON export/import |
| Cloud | Sign in + enable **CommitTrack Cloud** in Profile (or `subscriptionTier: power`) |

## Backup options

- **Local**: JSON export in Profile → Local data & export.
- **Cloud**: CommitTrack Cloud (`services/sync`) when signed in.

## Audits

```bash
npm run audit:sync
npm run audit:governance
```

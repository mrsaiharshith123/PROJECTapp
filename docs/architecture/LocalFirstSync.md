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
| Snapshot helpers | `src/storage/snapshotData.js` | Detect empty remote vs local user data |
| Sync meta | `src/services/sync/syncMeta.js` | Device id/label, backup log (push/restore history) |
| Sync engine | `src/services/sync/syncEngine.js` | Push/pull, debounce, empty-remote guard |
| Bridge | `src/app/CloudSyncBridge.jsx` | Debounced push on `DATA_CHANGED_EVENT` — **no auto-pull on startup** |
| UI | `ProfileCloudSyncSection.jsx` | Enable backup (push local), manual restore modal + history |
| Security UI | `ProfileSecuritySection.jsx` | Sign-in email, last login, device, last backup/restore |

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
| Signed in + Pro/Power + sync enabled | Debounced push to `user_finance_snapshots` (RLS per user) |
| Restore | Manual only — pick latest remote or local backup log entry |
| Empty remote + local has data | Pull blocked unless `force: true` (restore modal) |

## Backup options

- **Local**: JSON export in Profile → Local data & export.
- **Account**: Supabase snapshot when signed in (`services/sync`).

## Audits

```bash
npm run audit:sync
npm run audit:governance
```

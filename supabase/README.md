# Supabase schema

## Applying schema

**Option A — migrations (recommended)**  
Run files in `migrations/` in filename order via Supabase CLI or SQL Editor.

**Option B — snapshot**  
`schema-final.sql` is a consolidated paste-and-run snapshot for core tables (profiles, snapshots, agreement hashes). It does **not** yet include admin analytics — use the admin migrations below for product intelligence.

## Admin intelligence migrations (required for `/admin`)

Apply in order:

| File | Purpose |
|------|---------|
| `20260606000000_admin_analytics.sql` | `is_admin`, `app_events`, admin RPC, RLS |
| `20260606010000_fix_admin_rls_recursion.sql` | Fix profile login recursion |
| `20260606020000_fix_admin_grant_trigger.sql` | SQL Editor admin grant + `grant_committrack_admin()` |

Then grant admin:

```sql
SELECT grant_committrack_admin('<user-uuid>');
```

Full documentation: [docs/architecture/AdminAnalytics.md](../docs/architecture/AdminAnalytics.md).

## Env vars (client)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

See root `.env.example` and [docs/09-implementation-status.md](../docs/09-implementation-status.md).

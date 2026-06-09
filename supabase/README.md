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

## Daily spend persistence (required for transaction-intel daily spend analytics)

| File | Purpose |
|------|---------|
| `20260606030000_daily_spends_table_from_snapshot.sql` | Creates `public.daily_spends` + RLS and keeps it materialized from `user_finance_snapshots.payload.dailySpends` |

Then grant admin:

```sql
SELECT grant_committrack_admin('<user-uuid>');
```

Full documentation: [docs/architecture/AdminAnalytics.md](../docs/architecture/AdminAnalytics.md).

## Env vars (client)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_RAZORPAY_KEY_ID=rzp_test_...
```

See root `.env.example` and [docs/09-implementation-status.md](../docs/09-implementation-status.md).

## Razorpay (test / live)

1. Copy `.env.example` → `.env` and set `VITE_RAZORPAY_KEY_ID` to your **test** key (`rzp_test_…`).
2. Restart the Vite dev server.
3. Open **Plans** on Home or Profile → **Upgrade to Pro/Power** opens Razorpay checkout.
4. Test pay (India account): UPI `success@razorpay`, or Netbanking → Success, or domestic card `5267 3181 8797 5449`.

### Server verify (recommended before production)

Deploy the Edge Function and set secrets in Supabase Dashboard:

```bash
supabase functions deploy razorpay-checkout
```

Secrets (`razorpay-checkout`):

| Secret | Value |
|--------|--------|
| `RAZORPAY_KEY_ID` | Same as client test/live key id |
| `RAZORPAY_KEY_SECRET` | From Razorpay dashboard (never in `.env` client) |

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically when deployed.

When the function is live, checkout creates a Razorpay **order** server-side and **verifies the payment signature** before updating `profiles.subscription_tier`. Without the function, client-only checkout still works for local testing (less secure).

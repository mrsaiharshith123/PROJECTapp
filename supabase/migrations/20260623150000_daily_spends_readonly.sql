-- daily_spends is materialized from user_finance_snapshots via trigger only.
-- Clients must not INSERT/UPDATE/DELETE rows directly.

drop policy if exists "Users insert own daily spends" on public.daily_spends;
drop policy if exists "Users update own daily spends" on public.daily_spends;
drop policy if exists "Users delete own daily spends" on public.daily_spends;

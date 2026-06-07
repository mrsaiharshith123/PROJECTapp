-- Admin intelligence: roles, product events, aggregated admin RPC.
-- Grant admin manually: UPDATE public.profiles SET is_admin = true WHERE id = '<uuid>';

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists last_active_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

comment on column public.profiles.is_admin is 'Internal CommitTrack admin — set only via Supabase dashboard/SQL';
comment on column public.profiles.last_active_at is 'Last product heartbeat (privacy-safe activity signal)';

create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null,
  module text,
  step text,
  properties jsonb not null default '{}'::jsonb,
  session_id text,
  created_at timestamptz not null default now()
);

create index if not exists app_events_user_created_idx on public.app_events (user_id, created_at desc);
create index if not exists app_events_name_created_idx on public.app_events (event_name, created_at desc);
create index if not exists app_events_module_created_idx on public.app_events (module, created_at desc);

alter table public.app_events enable row level security;

drop policy if exists "Users insert own events" on public.app_events;
create policy "Users insert own events"
  on public.app_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users read own events" on public.app_events;
create policy "Users read own events"
  on public.app_events
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Security definer helper — avoids RLS infinite recursion on profiles subqueries.
create or replace function public.is_committrack_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_committrack_admin() to authenticated;

drop policy if exists "Admins read all events" on public.app_events;
create policy "Admins read all events"
  on public.app_events
  for select
  to authenticated
  using (public.is_committrack_admin());

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_committrack_admin());

-- Block self-promotion from the app API; SQL Editor (auth.uid() null) may grant admin.
create or replace function public.profiles_guard_admin_column()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.is_admin := false;
    end if;
    return new;
  end if;
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create or replace function public.grant_committrack_admin(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target_user_id is null then
    raise exception 'target_user_id required';
  end if;
  update public.profiles
  set is_admin = true
  where id = target_user_id;
  if not found then
    raise exception 'profile not found for %', target_user_id;
  end if;
end;
$$;

drop trigger if exists profiles_guard_admin_column on public.profiles;
create trigger profiles_guard_admin_column
  before insert or update on public.profiles
  for each row
  execute function public.profiles_guard_admin_column();

create or replace function public.touch_profile_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_active_at = now()
  where id = auth.uid();
end;
$$;

grant execute on function public.touch_profile_activity() to authenticated;

create or replace function public.admin_product_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_admin boolean;
  total_users int;
  onboarding_done int;
  premium_users int;
  sync_users int;
  dau int;
  wau int;
  mau int;
  d1_retention numeric;
  d7_retention numeric;
  d30_retention numeric;
begin
  select coalesce(p.is_admin, false) into caller_admin
  from public.profiles p where p.id = auth.uid();

  if not caller_admin then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  select count(*)::int into total_users from public.profiles;
  select count(*)::int into onboarding_done from public.profiles where onboarding_complete = true;
  select count(*)::int into premium_users from public.profiles where subscription_tier in ('pro', 'power');
  select count(distinct user_id)::int into sync_users from public.user_finance_snapshots;

  select count(distinct user_id)::int into dau
  from public.app_events where created_at >= now() - interval '1 day';

  select count(distinct user_id)::int into wau
  from public.app_events where created_at >= now() - interval '7 days';

  select count(distinct user_id)::int into mau
  from public.app_events where created_at >= now() - interval '30 days';

  select coalesce(
    round(
      100.0 * (
        select count(distinct e.user_id)
        from public.app_events e
        join public.profiles p on p.id = e.user_id
        where p.created_at <= now() - interval '1 day'
          and p.created_at > now() - interval '2 days'
          and e.created_at >= now() - interval '1 day'
      )::numeric
      / nullif(
        (select count(*) from public.profiles
         where created_at <= now() - interval '1 day'
           and created_at > now() - interval '2 days'),
        0
      ),
      1
    ),
    0
  ) into d1_retention;

  select coalesce(
    round(
      100.0 * (
        select count(distinct e.user_id)
        from public.app_events e
        join public.profiles p on p.id = e.user_id
        where p.created_at <= now() - interval '7 days'
          and p.created_at > now() - interval '14 days'
          and e.created_at >= now() - interval '7 days'
      )::numeric
      / nullif(
        (select count(*) from public.profiles
         where created_at <= now() - interval '7 days'
           and created_at > now() - interval '14 days'),
        0
      ),
      1
    ),
    0
  ) into d7_retention;

  select coalesce(
    round(
      100.0 * (
        select count(distinct e.user_id)
        from public.app_events e
        join public.profiles p on p.id = e.user_id
        where p.created_at <= now() - interval '30 days'
          and p.created_at > now() - interval '60 days'
          and e.created_at >= now() - interval '30 days'
      )::numeric
      / nullif(
        (select count(*) from public.profiles
         where created_at <= now() - interval '30 days'
           and created_at > now() - interval '60 days'),
        0
      ),
      1
    ),
    0
  ) into d30_retention;

  return jsonb_build_object(
    'generated_at', now(),
    'totals', jsonb_build_object(
      'users', total_users,
      'onboarding_complete', onboarding_done,
      'onboarding_rate', case when total_users > 0
        then round(100.0 * onboarding_done / total_users, 1) else 0 end,
      'premium_users', premium_users,
      'sync_users', sync_users,
      'dau', dau,
      'wau', wau,
      'mau', mau,
      'active_30d', (
        select count(*)::int from public.profiles
        where last_active_at >= now() - interval '30 days'
      )
    ),
    'retention', jsonb_build_object(
      'd1_pct', d1_retention,
      'd7_pct', d7_retention,
      'd30_pct', d30_retention
    ),
    'growth', coalesce(
      (
        select jsonb_agg(row order by row->>'date')
        from (
          select jsonb_build_object(
            'date', to_char(d, 'YYYY-MM-DD'),
            'signups', (
              select count(*)::int from public.profiles p
              where p.created_at::date = d
            )
          ) as row
          from generate_series(current_date - 13, current_date, interval '1 day') as d
        ) s
      ),
      '[]'::jsonb
    ),
    'modules', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'module', module,
          'opens', opens,
          'unique_users', unique_users
        ) order by opens desc)
        from (
          select coalesce(module, 'unknown') as module,
                 count(*)::int as opens,
                 count(distinct user_id)::int as unique_users
          from public.app_events
          where event_name = 'module.open'
            and created_at >= now() - interval '30 days'
          group by coalesce(module, 'unknown')
        ) m
      ),
      '[]'::jsonb
    ),
    'onboarding', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'step', step,
          'count', cnt
        ) order by step)
        from (
          select coalesce(step, 'unknown') as step,
                 count(*)::int as cnt
          from public.app_events
          where event_name = 'onboarding.step'
            and created_at >= now() - interval '90 days'
          group by coalesce(step, 'unknown')
        ) o
      ),
      '[]'::jsonb
    ),
    'recent_signups', coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'id', p.id,
          'display_name', coalesce(p.display_name, p.username, 'User'),
          'created_at', p.created_at,
          'onboarding_complete', coalesce(p.onboarding_complete, false),
          'subscription_tier', coalesce(p.subscription_tier, 'free'),
          'last_active_at', p.last_active_at
        ) order by p.created_at desc)
        from (
          select * from public.profiles
          order by created_at desc
          limit 8
        ) p
      ),
      '[]'::jsonb
    )
  );
end;
$$;

grant execute on function public.admin_product_overview() to authenticated;

comment on table public.app_events is 'Privacy-minimal product analytics events (module, onboarding, session)';

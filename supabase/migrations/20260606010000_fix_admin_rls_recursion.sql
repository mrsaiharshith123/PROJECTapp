-- Fix login break: admin RLS policies must not subquery profiles (infinite recursion).
-- Run this in Supabase SQL Editor if sign-in fails with "Could not load your account".

create or replace function public.is_perovo_admin()
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

grant execute on function public.is_perovo_admin() to authenticated;

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_perovo_admin());

drop policy if exists "Admins read all events" on public.app_events;
create policy "Admins read all events"
  on public.app_events
  for select
  to authenticated
  using (public.is_perovo_admin());

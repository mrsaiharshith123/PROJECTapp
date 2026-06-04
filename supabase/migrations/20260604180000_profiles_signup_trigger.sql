-- Create profiles row when auth.users is inserted (works before email confirm / JWT session).
-- Fixes signup "permission denied" when the app cannot upsert as authenticated yet.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    display_name,
    phone,
    user_mode,
    household_scope,
    monthly_income,
    onboarding_complete,
    pan_verified
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    coalesce(new.raw_user_meta_data->>'user_mode', 'salaried'),
    coalesce(new.raw_user_meta_data->>'household_scope', 'single'),
    coalesce((new.raw_user_meta_data->>'monthly_income')::numeric, 0),
    coalesce((new.raw_user_meta_data->>'onboarding_complete')::boolean, false),
    false
  )
  on conflict (id) do update set
    display_name = coalesce(nullif(excluded.display_name, ''), profiles.display_name),
    phone = coalesce(excluded.phone, profiles.phone),
    user_mode = coalesce(excluded.user_mode, profiles.user_mode),
    household_scope = coalesce(excluded.household_scope, profiles.household_scope),
    monthly_income = coalesce(excluded.monthly_income, profiles.monthly_income);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_committrack on auth.users;
create trigger on_auth_user_created_committrack
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- Explicit RLS (insert/update/select own row)
drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

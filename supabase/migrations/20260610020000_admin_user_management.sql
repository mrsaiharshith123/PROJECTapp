-- Admin user management RPCs (list, update, verify, grant admin, delete).
-- Admins may change is_admin from the app; regular users still cannot self-promote.

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

  if new.is_admin is distinct from old.is_admin then
    if auth.uid() is not null and not public.is_committrack_admin() then
      new.is_admin := old.is_admin;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.admin_assert_caller()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_committrack_admin() then
    raise exception 'not_admin' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.admin_assert_caller() to authenticated;

create or replace function public.admin_list_users(
  p_search text default '',
  p_limit int default 50,
  p_offset int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  q text := trim(coalesce(p_search, ''));
  lim int := greatest(1, least(coalesce(p_limit, 50), 100));
  off int := greatest(0, coalesce(p_offset, 0));
  total_count int;
begin
  perform public.admin_assert_caller();

  select count(*)::int into total_count
  from public.profiles p
  left join auth.users u on u.id = p.id
  where q = ''
     or p.display_name ilike '%' || q || '%'
     or p.username ilike '%' || q || '%'
     or p.phone ilike '%' || q || '%'
     or p.pan ilike '%' || q || '%'
     or u.email ilike '%' || q || '%';

  return jsonb_build_object(
    'total', total_count,
    'limit', lim,
    'offset', off,
    'users', coalesce(
      (
        select jsonb_agg(row order by row->>'created_at' desc)
        from (
          select jsonb_build_object(
            'id', p.id,
            'email', u.email,
            'display_name', coalesce(p.display_name, p.username, ''),
            'username', p.username,
            'phone', p.phone,
            'pan', p.pan,
            'pan_verified', coalesce(p.pan_verified, false),
            'is_admin', coalesce(p.is_admin, false),
            'subscription_tier', coalesce(p.subscription_tier, 'free'),
            'monthly_income', p.monthly_income,
            'onboarding_complete', coalesce(p.onboarding_complete, false),
            'user_mode', p.user_mode,
            'created_at', p.created_at,
            'last_active_at', p.last_active_at
          ) as row
          from public.profiles p
          left join auth.users u on u.id = p.id
          where q = ''
             or p.display_name ilike '%' || q || '%'
             or p.username ilike '%' || q || '%'
             or p.phone ilike '%' || q || '%'
             or p.pan ilike '%' || q || '%'
             or u.email ilike '%' || q || '%'
          order by p.created_at desc
          limit lim offset off
        ) s
      ),
      '[]'::jsonb
    )
  );
end;
$$;

grant execute on function public.admin_list_users(text, int, int) to authenticated;

create or replace function public.admin_update_user(
  p_user_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles%rowtype;
begin
  perform public.admin_assert_caller();

  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  update public.profiles
  set
    display_name = case when p_patch ? 'display_name' then nullif(trim(p_patch->>'display_name'), '') else display_name end,
    phone = case when p_patch ? 'phone' then nullif(trim(p_patch->>'phone'), '') else phone end,
    username = case when p_patch ? 'username' then nullif(trim(p_patch->>'username'), '') else username end,
    subscription_tier = case
      when p_patch ? 'subscription_tier' and (p_patch->>'subscription_tier') in ('free', 'pro', 'power')
        then p_patch->>'subscription_tier'
      else subscription_tier
    end,
    monthly_income = case
      when p_patch ? 'monthly_income' then nullif(p_patch->>'monthly_income', '')::numeric
      else monthly_income
    end,
    onboarding_complete = case
      when p_patch ? 'onboarding_complete' then (p_patch->>'onboarding_complete')::boolean
      else onboarding_complete
    end,
    user_mode = case when p_patch ? 'user_mode' then nullif(trim(p_patch->>'user_mode'), '') else user_mode end,
    pan_verified = case
      when p_patch ? 'pan_verified' then (p_patch->>'pan_verified')::boolean
      else pan_verified
    end,
    pan_updated_at = case
      when p_patch ? 'pan_verified' then now()
      else pan_updated_at
    end,
    subscription_updated_at = case
      when p_patch ? 'subscription_tier' then now()
      else subscription_updated_at
    end
  where id = p_user_id
  returning * into updated;

  if not found then
    raise exception 'profile not found';
  end if;

  return to_jsonb(updated);
end;
$$;

grant execute on function public.admin_update_user(uuid, jsonb) to authenticated;

create or replace function public.admin_set_user_admin(
  p_user_id uuid,
  p_is_admin boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.profiles%rowtype;
begin
  perform public.admin_assert_caller();

  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  if p_user_id = auth.uid() and coalesce(p_is_admin, false) = false then
    raise exception 'cannot_revoke_own_admin';
  end if;

  update public.profiles
  set is_admin = coalesce(p_is_admin, false)
  where id = p_user_id
  returning * into updated;

  if not found then
    raise exception 'profile not found';
  end if;

  return jsonb_build_object('id', updated.id, 'is_admin', updated.is_admin);
end;
$$;

grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_caller();

  if p_user_id is null then
    raise exception 'user_id required';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'cannot_delete_self';
  end if;

  delete from auth.users where id = p_user_id;

  if not found then
    raise exception 'user not found';
  end if;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

comment on function public.admin_list_users(text, int, int) is
  'Admin-only: search and paginate users with auth email.';
comment on function public.admin_update_user(uuid, jsonb) is
  'Admin-only: update profile fields including pan_verified and subscription_tier.';
comment on function public.admin_set_user_admin(uuid, boolean) is
  'Admin-only: grant or revoke CommitTrack admin role.';
comment on function public.admin_delete_user(uuid) is
  'Admin-only: permanently delete auth user (cascades to profiles and snapshots).';

-- Admin user actions: ban, verify email, revoke sessions; extended list fields.

create or replace function public.admin_ban_user(
  p_user_id uuid,
  p_ban boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_caller();
  if p_user_id = auth.uid() then
    raise exception 'cannot_ban_self';
  end if;

  update auth.users
  set banned_until = case
    when p_ban then (now() + interval '100 years')
    else null
  end
  where id = p_user_id;

  if not found then
    raise exception 'user not found';
  end if;

  return jsonb_build_object('id', p_user_id, 'banned', p_ban);
end;
$$;

grant execute on function public.admin_ban_user(uuid, boolean) to authenticated;

create or replace function public.admin_verify_email(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_caller();
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now())
  where id = p_user_id;

  if not found then
    raise exception 'user not found';
  end if;

  return jsonb_build_object('id', p_user_id, 'verified', true);
end;
$$;

grant execute on function public.admin_verify_email(uuid) to authenticated;

create or replace function public.admin_revoke_sessions(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  perform public.admin_assert_caller();
  delete from auth.sessions where user_id = p_user_id;
  delete from auth.refresh_tokens where user_id = p_user_id;
  return jsonb_build_object('id', p_user_id, 'sessions_revoked', true);
end;
$$;

grant execute on function public.admin_revoke_sessions(uuid) to authenticated;

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
  lim int := greatest(1, least(coalesce(p_limit, 50), 1000));
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
            'email', case
              when u.email is null then null
              else regexp_replace(u.email, '(.{2}).+(@.+)', '\1***\2')
            end,
            'display_name', coalesce(p.display_name, p.username, ''),
            'username', p.username,
            'phone', case
              when p.phone is null or length(trim(p.phone)) < 4 then null
              else '***' || right(regexp_replace(p.phone, '\D', '', 'g'), 4)
            end,
            'pan_verified', coalesce(p.pan_verified, false),
            'is_admin', coalesce(p.is_admin, false),
            'subscription_tier', coalesce(p.subscription_tier, 'free'),
            'onboarding_complete', coalesce(p.onboarding_complete, false),
            'user_mode', p.user_mode,
            'monthly_income', p.monthly_income,
            'created_at', p.created_at,
            'last_active_at', p.last_active_at,
            'banned_until', u.banned_until,
            'email_confirmed_at', u.email_confirmed_at,
            'subscription_updated_at', p.subscription_updated_at,
            'razorpay_payment_id', p.razorpay_payment_id
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

comment on function public.admin_list_users(text, int, int) is
  'Admin user list with masked email/phone plus ban/email/subscription fields.';

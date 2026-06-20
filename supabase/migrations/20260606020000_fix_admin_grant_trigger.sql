-- Allow granting is_admin via SQL Editor; still block self-promotion from the app API.

create or replace function public.profiles_guard_admin_column()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    -- App signups always start non-admin.
    if auth.uid() is not null then
      new.is_admin := false;
    end if;
    return new;
  end if;

  if new.is_admin is distinct from old.is_admin then
    -- SQL Editor / service (no JWT) may change admin flag.
    if auth.uid() is not null then
      new.is_admin := old.is_admin;
    end if;
  end if;

  return new;
end;
$$;

-- Explicit helper for Supabase SQL Editor (paste user uuid).
create or replace function public.grant_perovo_admin(target_user_id uuid)
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

comment on function public.grant_perovo_admin(uuid) is
  'Run in SQL Editor: select grant_perovo_admin(''<user-uuid>'');';

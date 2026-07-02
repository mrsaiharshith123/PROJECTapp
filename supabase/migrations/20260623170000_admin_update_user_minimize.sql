-- Minimize PII returned from admin_update_user (no full PAN/phone in response).

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

  return jsonb_build_object(
    'id', updated.id,
    'display_name', updated.display_name,
    'username', updated.username,
    'phone', case
      when updated.phone is null or length(trim(updated.phone)) < 4 then null
      else '***' || right(regexp_replace(updated.phone, '\D', '', 'g'), 4)
    end,
    'pan_verified', coalesce(updated.pan_verified, false),
    'is_admin', coalesce(updated.is_admin, false),
    'subscription_tier', coalesce(updated.subscription_tier, 'free'),
    'onboarding_complete', coalesce(updated.onboarding_complete, false),
    'user_mode', updated.user_mode,
    'monthly_income', updated.monthly_income,
    'subscription_updated_at', updated.subscription_updated_at
  );
end;
$$;

comment on function public.admin_update_user(uuid, jsonb) is
  'Admin profile patch; response omits full PAN and masks phone.';

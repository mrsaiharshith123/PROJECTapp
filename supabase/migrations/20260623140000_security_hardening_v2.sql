-- Security hardening v2: pan_verified protection, api-proxy document ownership, admin tier updates

-- ── 1. pan_verified — only service_role may set true ─────────────────────────
create or replace function public.protect_profiles_pan_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.pan_verified := false;
    return new;
  end if;
  if old.pan_verified is distinct from new.pan_verified then
    new.pan_verified := old.pan_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profiles_pan_verified on public.profiles;
create trigger protect_profiles_pan_verified
  before insert or update on public.profiles
  for each row execute function public.protect_profiles_pan_verified();

comment on function public.protect_profiles_pan_verified() is
  'Only service_role (KYC edge) may set pan_verified=true';

-- ── 2. Allow Perovo admins to update subscription_tier via profiles update ───
create or replace function public.protect_profiles_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', '') = 'service_role' then
    return new;
  end if;
  if public.is_perovo_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.subscription_tier := 'free';
    new.razorpay_payment_id := null;
    return new;
  end if;
  if old.subscription_tier is distinct from new.subscription_tier
     or old.razorpay_payment_id is distinct from new.razorpay_payment_id
     or old.subscription_updated_at is distinct from new.subscription_updated_at then
    new.subscription_tier := old.subscription_tier;
    new.razorpay_payment_id := old.razorpay_payment_id;
    new.subscription_updated_at := old.subscription_updated_at;
  end if;
  return new;
end;
$$;

-- ── 3. api-proxy document ownership (Leegality status IDOR fix) ───────────────
create table if not exists public.api_proxy_documents (
  user_id uuid not null references auth.users (id) on delete cascade,
  document_id text not null,
  service text not null default 'leegality',
  created_at timestamptz not null default now(),
  primary key (user_id, document_id)
);

create index if not exists api_proxy_documents_user_idx
  on public.api_proxy_documents (user_id, created_at desc);

alter table public.api_proxy_documents enable row level security;

drop policy if exists "Users read own api proxy documents" on public.api_proxy_documents;
create policy "Users read own api proxy documents"
  on public.api_proxy_documents for select to authenticated
  using (auth.uid() = user_id);

-- Inserts via service_role only (api-proxy edge)

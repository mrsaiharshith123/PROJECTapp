-- Subscription tier on profiles (Razorpay upgrades)
-- TODO: restrict subscription_tier writes to service_role only
-- once Razorpay webhook Edge Function is live.

alter table public.profiles
  add column if not exists subscription_tier text
    not null default 'free'
    check (subscription_tier in ('free', 'pro', 'power'));

alter table public.profiles
  add column if not exists subscription_updated_at timestamptz;

alter table public.profiles
  add column if not exists razorpay_payment_id text;

comment on column public.profiles.subscription_tier is 'Perovo plan: free, pro, or power';

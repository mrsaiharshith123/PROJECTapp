-- Safe to re-run: adds any profile columns the app uses (signup + onboarding).
-- Run after 20260604150000_profiles.sql if that file was applied before phone/onboarding columns existed.

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists pan text;
alter table public.profiles add column if not exists pan_verified boolean not null default false;
alter table public.profiles add column if not exists pan_updated_at timestamptz;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists user_mode text;
alter table public.profiles add column if not exists household_scope text;
alter table public.profiles add column if not exists monthly_income numeric;
alter table public.profiles add column if not exists onboarding_complete boolean;
alter table public.profiles add column if not exists phone text;

comment on column public.profiles.phone is 'Indian mobile (10 digits), required at signup in app';
comment on column public.profiles.display_name is 'User name from signup/onboarding';
comment on column public.profiles.monthly_income is 'Monthly salary in INR';
comment on column public.profiles.onboarding_complete is 'True after onboarding flow finished';

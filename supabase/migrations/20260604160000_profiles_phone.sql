-- Phone on account profile (required at signup in app).

alter table public.profiles add column if not exists phone text;

comment on column public.profiles.phone is 'Indian mobile (10 digits), collected at signup';

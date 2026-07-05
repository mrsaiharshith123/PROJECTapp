-- Device tokens for FCM / web push (admin broadcasts, security alerts)
create table if not exists public.user_push_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android',
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

create index if not exists user_push_tokens_token_idx on public.user_push_tokens (token);

alter table public.user_push_tokens enable row level security;

create policy "Users manage own push tokens"
  on public.user_push_tokens for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role reads tokens when sending admin broadcast push
create policy "Service role read push tokens"
  on public.user_push_tokens for select
  to service_role
  using (true);

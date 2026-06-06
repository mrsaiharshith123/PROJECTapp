create table if not exists public.agreement_hashes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lending_id text not null,
  agreement_hash text not null,
  sealed_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.agreement_hashes enable row level security;

drop policy if exists "Users read own hashes" on public.agreement_hashes;
create policy "Users read own hashes"
  on public.agreement_hashes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own hashes" on public.agreement_hashes;
create policy "Users insert own hashes"
  on public.agreement_hashes for insert to authenticated
  with check (auth.uid() = user_id);

comment on table public.agreement_hashes is
  'SHA-256 hash of agreement text at signing time. Used to prove document was not modified after both parties confirmed.';

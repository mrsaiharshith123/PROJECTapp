-- Shared household rooms — invite code join for family mode (optional cloud).

create table if not exists public.household_rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Our household',
  member_limit int not null default 6,
  created_at timestamptz not null default now()
);

create table if not exists public.household_room_members (
  room_id uuid not null references public.household_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text,
  role text not null default 'member' check (role in ('owner', 'member')),
  share_spends boolean not null default true,
  share_bill_detail boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index if not exists household_room_members_user_idx
  on public.household_room_members (user_id);

alter table public.household_rooms enable row level security;
alter table public.household_room_members enable row level security;

drop policy if exists "Members read own household room" on public.household_rooms;
create policy "Members read own household room"
  on public.household_rooms for select to authenticated
  using (
    exists (
      select 1 from public.household_room_members m
      where m.room_id = household_rooms.id and m.user_id = auth.uid()
    )
  );

drop policy if exists "Owner creates household room" on public.household_rooms;
create policy "Owner creates household room"
  on public.household_rooms for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Owner updates household room" on public.household_rooms;
create policy "Owner updates household room"
  on public.household_rooms for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Anyone authenticated lookup room by code for join" on public.household_rooms;
create policy "Anyone authenticated lookup room by code for join"
  on public.household_rooms for select to authenticated
  using (true);

drop policy if exists "Members manage own membership row" on public.household_room_members;
create policy "Members manage own membership row"
  on public.household_room_members for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Room members visible to same room" on public.household_room_members;
create policy "Room members visible to same room"
  on public.household_room_members for select to authenticated
  using (
    exists (
      select 1 from public.household_room_members mine
      where mine.room_id = household_room_members.room_id and mine.user_id = auth.uid()
    )
  );

drop policy if exists "Owner inserts members on join" on public.household_room_members;
create policy "Owner inserts members on join"
  on public.household_room_members for insert to authenticated
  with check (user_id = auth.uid());

comment on table public.household_rooms is 'Perovo family household — invite-code rooms for multi-user family mode';
comment on table public.household_room_members is 'Household membership, spend sharing prefs per user';

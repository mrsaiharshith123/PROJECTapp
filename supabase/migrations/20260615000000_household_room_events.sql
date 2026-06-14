-- Household room activity feed — shared financial awareness for family members.

create table if not exists public.household_room_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.household_rooms (id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists room_events_room_idx
  on public.household_room_events (room_id, created_at desc);

alter table public.household_room_events enable row level security;

drop policy if exists "Room members read events" on public.household_room_events;
create policy "Room members read events"
  on public.household_room_events for select to authenticated
  using (
    room_id in (
      select room_id from public.household_room_members
      where user_id = auth.uid()
    )
  );

drop policy if exists "Room members insert events" on public.household_room_events;
create policy "Room members insert events"
  on public.household_room_events for insert to authenticated
  with check (
    auth.uid() = user_id and
    room_id in (
      select room_id from public.household_room_members
      where user_id = auth.uid()
    )
  );

comment on table public.household_room_events is 'Perovo family room activity feed — bills paid, added, goals, joins';

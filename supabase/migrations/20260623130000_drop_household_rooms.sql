-- Remove household / family room feature (product scope removed).

drop function if exists public.lookup_household_room_by_invite(text);

drop table if exists public.household_room_events;
drop table if exists public.household_rooms cascade;
drop table if exists public.household_room_members;

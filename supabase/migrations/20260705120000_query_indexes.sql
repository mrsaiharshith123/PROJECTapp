-- Query indexes for scale (idempotent)
create index if not exists user_device_sessions_user_device_idx
  on public.user_device_sessions (user_id, device_id);

create index if not exists user_notifications_user_read_idx
  on public.user_notifications (user_id, read, created_at desc);

create index if not exists app_broadcasts_active_idx
  on public.app_broadcasts (active_from desc, active_until);

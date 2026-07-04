-- Admins can create, update, delete, and list all broadcasts (including inactive).
create policy "Admins manage broadcasts"
  on public.app_broadcasts for all
  to authenticated
  using (public.is_perovo_admin())
  with check (public.is_perovo_admin());

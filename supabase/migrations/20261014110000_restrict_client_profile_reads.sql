-- Restrict client profile reads to the profile owner and platform administrators.
-- The previous clients_public_read policy used USING (true), exposing every client row
-- to anonymous and authenticated users through the public role.
drop policy if exists clients_public_read on public.clients;

drop policy if exists clients_select_owner_or_admin on public.clients;
create policy clients_select_owner_or_admin
  on public.clients
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('admin', 'super_admin')
    )
  );

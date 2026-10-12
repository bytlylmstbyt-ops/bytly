-- Allow the admin proposal workflow to create and delete offers without bypassing RLS.
drop policy if exists project_offers_admin_insert on public.project_offers;
create policy project_offers_admin_insert
  on public.project_offers
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles pr
      where pr.user_id = auth.uid() and pr.role = 'admin'
    )
    and exists (
      select 1 from public.projects p
      where p.id = project_offers.project_id
    )
    and exists (
      select 1 from public.engineers e
      where e.user_id = project_offers.engineer_user_id
    )
  );

drop policy if exists project_offers_admin_delete on public.project_offers;
create policy project_offers_admin_delete
  on public.project_offers
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles pr
      where pr.user_id = auth.uid() and pr.role = 'admin'
    )
  );

-- Restore admin read access required by the quality-certification workflow.
-- Access is limited to authenticated users with an admin profile.
drop policy if exists projects_admin_select on public.projects;
create policy projects_admin_select on public.projects
for select to authenticated
using (exists (
  select 1 from public.profiles pr
  where pr.user_id = (select auth.uid()) and pr.role = 'admin'
));

drop policy if exists engineers_admin_select on public.engineers;
create policy engineers_admin_select on public.engineers
for select to authenticated
using (exists (
  select 1 from public.profiles pr
  where pr.user_id = (select auth.uid()) and pr.role = 'admin'
));

drop policy if exists clients_admin_select on public.clients;
create policy clients_admin_select on public.clients
for select to authenticated
using (exists (
  select 1 from public.profiles pr
  where pr.user_id = (select auth.uid()) and pr.role = 'admin'
));

drop policy if exists technical_reviews_admin_select on public.technical_reviews;
create policy technical_reviews_admin_select on public.technical_reviews
for select to authenticated
using (exists (
  select 1 from public.profiles pr
  where pr.user_id = (select auth.uid()) and pr.role = 'admin'
));

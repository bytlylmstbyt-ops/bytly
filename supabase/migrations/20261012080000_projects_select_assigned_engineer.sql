-- Allow an authenticated engineer to read only projects assigned to their linked engineer profile.
-- This complements the existing client/project-member/admin policies without exposing unrelated private projects.
create policy "projects_select_assigned_engineer"
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.engineers e
    where e.id = projects.assigned_engineer_id
      and e.user_id = (select auth.uid())
  )
);

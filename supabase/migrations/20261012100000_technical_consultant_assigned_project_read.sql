drop policy if exists "projects_select_assigned_technical_consultant" on public.projects;
create policy "projects_select_assigned_technical_consultant"
on public.projects
for select
to authenticated
using (
  exists (
    select 1 from public.consultants c
    where c.id = projects.technical_consultant_id
      and c.user_id = (select auth.uid())
  )
);

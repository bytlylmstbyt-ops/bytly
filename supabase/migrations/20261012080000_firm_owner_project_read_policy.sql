-- Let a signed-in engineering-firm owner read only projects associated with their firm.
drop policy if exists "projects_select_owned_engineering_firm" on public.projects;
create policy "projects_select_owned_engineering_firm"
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.engineering_firms f
    where f.owner_user_id = (select auth.uid())
      and (
        projects.company_id = f.id
        or projects.client_id = f.id::text
      )
  )
);

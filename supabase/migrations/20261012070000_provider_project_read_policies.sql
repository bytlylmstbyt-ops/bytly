-- Allow each authenticated contractor or supplier to read projects assigned to their own provider record.
-- This is additive and does not grant access to unrelated private projects.
create policy "projects_select_assigned_contractor"
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.contractors c
    where c.id = projects.assigned_contractor_id
      and c.user_id = (select auth.uid())
  )
);

create policy "projects_select_assigned_supplier"
on public.projects
for select
to authenticated
using (
  exists (
    select 1
    from public.suppliers s
    where s.id = projects.assigned_supplier_id
      and s.user_id = (select auth.uid())
  )
);

-- Allow each authenticated contractor or supplier to read projects assigned to their own provider record.
-- Additive and scoped to the provider's own UUID; unrelated private projects remain protected.
drop policy if exists "projects_select_assigned_contractor" on public.projects;
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

drop policy if exists "projects_select_assigned_supplier" on public.projects;
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

-- Firm owners may view team members linked to their own engineering firm.
drop policy if exists "consultants_select_linked_firm_owner" on public.consultants;
create policy "consultants_select_linked_firm_owner"
on public.consultants
for select
to authenticated
using (
  exists (
    select 1
    from public.engineering_firms f
    where f.id = consultants.engineering_firm_id
      and f.owner_user_id = (select auth.uid())
  )
);

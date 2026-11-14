-- Allow authenticated project participants to append their own workspace activity.
-- Keep activity reads scoped to existing participant/admin policies.
drop policy if exists activity_participant_insert on public.project_activity;

create policy activity_participant_insert
on public.project_activity
for insert
to authenticated
with check (
  actor_user_id = auth.uid()
  and (
    exists (
      select 1
      from public.projects p
      where p.id = project_activity.project_id
        and p.client_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_members pm
      where pm.project_id = project_activity.project_id
        and pm.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_offers po
      where po.project_id = project_activity.project_id
        and po.engineer_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.project_contracts pc
      where pc.project_id = project_activity.project_id
        and (pc.client_user_id = auth.uid() or pc.provider_user_id = auth.uid())
    )
  )
);

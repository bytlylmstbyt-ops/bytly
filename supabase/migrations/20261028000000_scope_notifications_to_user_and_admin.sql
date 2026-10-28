-- Restrict notification access to the owning account and platform administrators.
-- This migration is intentionally committed to the feature branch only; it has not been applied to Supabase.
begin;

drop policy if exists notifications_owner_all on public.notifications;

create policy notifications_select_scoped
on public.notifications
for select
using (
  (
    user_id = auth.uid()
    and coalesce(type, '') <> 'system'
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
  )
);

create policy notifications_insert_scoped
on public.notifications
for insert
with check (
  (
    user_id = auth.uid()
    and coalesce(type, '') <> 'system'
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
  )
);

create policy notifications_update_scoped
on public.notifications
for update
using (
  (
    user_id = auth.uid()
    and coalesce(type, '') <> 'system'
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
  )
)
with check (
  (
    user_id = auth.uid()
    and coalesce(type, '') <> 'system'
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
  )
);

create policy notifications_delete_scoped
on public.notifications
for delete
using (
  (
    user_id = auth.uid()
    and coalesce(type, '') <> 'system'
  )
  or exists (
    select 1
    from public.profiles p
    where p.user_id = auth.uid()
      and lower(coalesce(p.role, '')) in ('admin', 'super_admin')
  )
);

commit;

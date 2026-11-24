-- Security hardening: protect private client/provider records while preserving a safe public engineer directory.
-- Apply only after reviewing the matching frontend compatibility adapter in this branch.

begin;

-- Client records contain contact details, wallet balances and subscription information.
drop policy if exists clients_public_read on public.clients;
drop policy if exists clients_owner_select on public.clients;
create policy clients_owner_select
  on public.clients
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Engineer records contain private contact, certificate and financial information.
drop policy if exists engineers_public_read on public.engineers;
drop policy if exists engineers_owner_select on public.engineers;
create policy engineers_owner_select
  on public.engineers
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Public discovery is restricted to approved, verified, real profiles and excludes
-- email, phone, registration numbers, certificate URLs, wallet and subscription data.
create or replace view public.engineer_public_directory
with (security_barrier = true)
as
select
  id,
  full_name,
  city,
  country,
  specialization,
  bio,
  is_verified,
  status,
  rating,
  years_experience,
  completed_projects,
  profile_image,
  total_reviews,
  created_at
from public.engineers
where status = 'approved'
  and is_verified is true
  and is_real is true;

revoke all on public.engineer_public_directory from public;
grant select on public.engineer_public_directory to anon, authenticated;

-- Public clients are not a searchable directory; access is owner/admin only.
-- Keep admin access aligned with the roles already recognized by the application.
drop policy if exists clients_admin_select on public.clients;
create policy clients_admin_select
  on public.clients
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

drop policy if exists engineers_admin_select on public.engineers;
create policy engineers_admin_select
  on public.engineers
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

-- Public/anonymous clients must not be able to rewrite another user's pending registration.
drop policy if exists pending_registrations_public_update on public.pending_registrations;
drop policy if exists pending_registrations_admin_select on public.pending_registrations;
create policy pending_registrations_admin_select
  on public.pending_registrations
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

drop policy if exists pending_registrations_admin_update on public.pending_registrations;
create policy pending_registrations_admin_update
  on public.pending_registrations
  for update
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

commit;

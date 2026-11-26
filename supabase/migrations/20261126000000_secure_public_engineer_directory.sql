-- Public engineer directory exposes professional fields only.
-- The view intentionally runs with its owner privileges so public visitors do not
-- need direct SELECT access to the private engineers table.
create or replace view public.public_engineer_directory
with (security_barrier = true)
as
select
  id,
  full_name,
  city,
  specialization,
  bio,
  is_verified,
  rating,
  country,
  years_experience,
  completed_projects,
  profile_image,
  total_reviews,
  created_at
from public.engineers
where status = 'approved'
  and is_real = true
  and coalesce(email, '') <> 'test-registration@invalid.example'
  and coalesce(email, '') not like '%@bytly.com';

grant select on public.public_engineer_directory to anon, authenticated;

-- Replace broad public table reads with owner/admin access.
drop policy if exists clients_public_read on public.clients;
drop policy if exists engineers_public_read on public.engineers;

create policy clients_owner_select
on public.clients
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy engineers_owner_select
on public.engineers
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke select on table public.clients from anon;
revoke select on table public.engineers from anon;

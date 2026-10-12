-- Project details Supabase migration: public-open project visibility, offer metadata, safe review/offer inserts.
alter table public.project_offers
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists portfolio_items jsonb not null default '[]'::jsonb;

drop policy if exists projects_open_authenticated_read on public.projects;
create policy projects_open_authenticated_read
  on public.projects
  for select
  to authenticated
  using (status = 'open' and coalesce(is_hidden, false) = false);

drop policy if exists project_offers_insert_engineer on public.project_offers;
create policy project_offers_insert_engineer
  on public.project_offers
  for insert
  to authenticated
  with check (
    engineer_user_id = auth.uid()
    and exists (
      select 1
      from public.projects p
      where p.id = project_offers.project_id
        and p.status = 'open'
        and coalesce(p.is_hidden, false) = false
    )
  );

drop policy if exists reviews_participant_insert on public.project_reviews;
create policy reviews_participant_insert
  on public.project_reviews
  for insert
  to authenticated
  with check (
    reviewer_user_id = auth.uid()
    and exists (
      select 1
      from public.projects p
      join public.engineers e on e.id = p.assigned_engineer_id
      where p.id = project_reviews.project_id
        and p.client_user_id = auth.uid()
        and p.status = 'completed'
        and e.user_id = project_reviews.reviewee_user_id
    )
  );

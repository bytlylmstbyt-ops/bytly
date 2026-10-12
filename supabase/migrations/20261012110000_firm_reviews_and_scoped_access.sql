create table if not exists public.firm_reviews (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.engineering_firms(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  client_profile_id uuid references public.clients(id) on delete set null,
  client_name text,
  rating integer not null check (rating between 1 and 5),
  quality_rating integer check (quality_rating between 1 and 5),
  service_rating integer check (service_rating between 1 and 5),
  communication_rating integer check (communication_rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (firm_id, client_user_id)
);
alter table public.firm_reviews enable row level security;
drop policy if exists "firm_reviews_public_read" on public.firm_reviews;
create policy "firm_reviews_public_read" on public.firm_reviews for select to anon, authenticated using (true);
drop policy if exists "firm_reviews_client_insert_own" on public.firm_reviews;
create policy "firm_reviews_client_insert_own" on public.firm_reviews for insert to authenticated
with check (client_user_id = (select auth.uid()));
drop policy if exists "firm_reviews_client_update_own" on public.firm_reviews;
create policy "firm_reviews_client_update_own" on public.firm_reviews for update to authenticated
using (client_user_id = (select auth.uid())) with check (client_user_id = (select auth.uid()));

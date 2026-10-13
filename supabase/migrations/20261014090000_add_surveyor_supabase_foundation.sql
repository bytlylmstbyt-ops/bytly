-- Surveyor migration foundation. This is intentionally additive: it does not
-- drop Base44 data or replace the legacy survey engine yet.
create extension if not exists pgcrypto;

create table if not exists public.surveyor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  license_number text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  geofencing_radius_km integer not null default 50 check (geofencing_radius_km between 1 and 500),
  equipment_checklist jsonb not null default '{}'::jsonb,
  is_identity_verified boolean not null default false,
  is_license_verified boolean not null default false,
  verification_documents text[] not null default '{}',
  profile_image text,
  bio text,
  years_experience integer not null default 0 check (years_experience >= 0),
  rating numeric(3,2) not null default 0 check (rating between 0 and 5),
  total_jobs integer not null default 0 check (total_jobs >= 0),
  wallet_balance numeric(12,2) not null default 0 check (wallet_balance >= 0),
  available_balance numeric(12,2) not null default 0 check (available_balance >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  is_available boolean not null default true,
  terms_accepted boolean not null default false,
  terms_accepted_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists surveyor_profiles_city_status_idx on public.surveyor_profiles(city, status, is_available);
create index if not exists surveyor_profiles_email_idx on public.surveyor_profiles(lower(email));

create table if not exists public.survey_requests (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references auth.users(id),
  client_id uuid,
  client_email text not null,
  client_name text not null,
  surveyor_user_id uuid references auth.users(id),
  surveyor_profile_id uuid references public.surveyor_profiles(id),
  surveyor_name text,
  surveyor_email text,
  latitude double precision not null,
  longitude double precision not null,
  address text not null default '',
  property_area_sqm numeric(12,2) not null check (property_area_sqm > 0),
  property_status text not null default 'vacant_land' check (property_status in ('vacant_land','existing_building')),
  notes text,
  status text not null default 'pending' check (status in ('pending','broadcasted','accepted','in_progress','submitted','approved','disbursed','cancelled')),
  payout_amount numeric(12,2) not null default 0 check (payout_amount >= 0),
  platform_fee numeric(12,2) not null default 0 check (platform_fee >= 0),
  total_charged numeric(12,2) not null default 0 check (total_charged >= 0),
  commission_rate numeric(5,2) not null default 15,
  escrow_transaction_id uuid,
  escrow_status text not null default 'none' check (escrow_status in ('none','held','released','refunded')),
  matched_surveyors jsonb not null default '[]'::jsonb,
  accepted_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  disbursed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists survey_requests_client_idx on public.survey_requests(client_user_id, created_at desc);
create index if not exists survey_requests_surveyor_idx on public.survey_requests(surveyor_user_id, status, created_at desc);
create index if not exists survey_requests_available_idx on public.survey_requests(status, created_at desc);

create table if not exists public.survey_deliverables (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.survey_requests(id) on delete cascade,
  surveyor_user_id uuid not null references auth.users(id),
  cad_files text[] not null default '{}',
  visual_files text[] not null default '{}',
  survey_metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  description text,
  created_at timestamptz not null default now()
);
create index if not exists survey_deliverables_request_idx on public.survey_deliverables(request_id, created_at desc);

alter table public.surveyor_profiles enable row level security;
alter table public.survey_requests enable row level security;
alter table public.survey_deliverables enable row level security;

drop policy if exists surveyor_profiles_select_own on public.surveyor_profiles;
create policy surveyor_profiles_select_own on public.surveyor_profiles
  for select to authenticated using (user_id = auth.uid());
drop policy if exists surveyor_profiles_insert_own on public.surveyor_profiles;
create policy surveyor_profiles_insert_own on public.surveyor_profiles
  for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and wallet_balance = 0 and available_balance = 0 and is_identity_verified = false and is_license_verified = false and rating = 0 and total_jobs = 0 and terms_accepted = false);
drop policy if exists surveyor_profiles_update_own on public.surveyor_profiles;
create policy surveyor_profiles_update_own on public.surveyor_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Prevent clients from changing verification, status, ratings, job counters or balances.
revoke all on public.surveyor_profiles from anon, authenticated;
grant select on public.surveyor_profiles to authenticated;
grant insert (user_id, full_name, email, phone, license_number, city, latitude, longitude, geofencing_radius_km, equipment_checklist, verification_documents, profile_image, bio, years_experience, is_available, terms_accepted, terms_accepted_date) on public.surveyor_profiles to authenticated;
grant update (full_name, phone, city, latitude, longitude, geofencing_radius_km, equipment_checklist, verification_documents, profile_image, bio, years_experience, is_available, terms_accepted, terms_accepted_date, updated_at) on public.surveyor_profiles to authenticated;

drop policy if exists survey_requests_select_participant on public.survey_requests;
create policy survey_requests_select_participant on public.survey_requests
  for select to authenticated using (client_user_id = auth.uid() or surveyor_user_id = auth.uid());
-- Request creation and every state/escrow transition are deliberately server-only;
-- the secure Edge Function will validate wallet funds and update related records atomically.
revoke all on public.survey_requests from anon, authenticated;
grant select on public.survey_requests to authenticated;

drop policy if exists survey_deliverables_select_participant on public.survey_deliverables;
create policy survey_deliverables_select_participant on public.survey_deliverables
  for select to authenticated using (
    surveyor_user_id = auth.uid()
    or exists (select 1 from public.survey_requests r where r.id = request_id and r.client_user_id = auth.uid())
  );
drop policy if exists survey_deliverables_insert_owner on public.survey_deliverables;
create policy survey_deliverables_insert_owner on public.survey_deliverables
  for insert to authenticated with check (
    surveyor_user_id = auth.uid()
    and exists (select 1 from public.survey_requests r where r.id = request_id and r.surveyor_user_id = auth.uid() and r.status in ('accepted','in_progress'))
  );
revoke all on public.survey_deliverables from anon, authenticated;
grant select, insert on public.survey_deliverables to authenticated;

-- Existing Base44 records must be reconciled and mapped to auth.users before any
-- runtime cutover. This migration intentionally does not import or delete them.

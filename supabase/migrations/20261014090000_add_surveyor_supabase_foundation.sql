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


-- All money/state transitions below are atomic and callable only by service_role.
create or replace function public.create_survey_request_with_escrow(
  p_actor_user_id uuid,
  p_client_email text,
  p_client_name text,
  p_latitude double precision,
  p_longitude double precision,
  p_address text,
  p_property_area_sqm numeric,
  p_property_status text,
  p_notes text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_total numeric(12,2);
  v_fee numeric(12,2);
  v_payout numeric(12,2);
  v_wallet public.wallet_accounts%rowtype;
  v_request public.survey_requests%rowtype;
begin
  if p_actor_user_id is null or p_latitude is null or p_longitude is null
    or p_latitude not between -90 and 90 or p_longitude not between -180 and 180
    or p_property_area_sqm is null or p_property_area_sqm <= 0
    or p_property_status not in ('vacant_land','existing_building') then
    raise exception 'INVALID_SURVEY_REQUEST';
  end if;

  v_total := least(5000, greatest(300, round(p_property_area_sqm * case when p_property_status='existing_building' then 5 else 3 end)));
  v_fee := round(v_total * 0.15, 2);
  v_payout := v_total - v_fee;

  select * into v_wallet from public.wallet_accounts
    where user_id = p_actor_user_id and status = 'active' and currency = 'SAR'
    for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if v_wallet.available_balance < v_total then raise exception 'INSUFFICIENT_BALANCE'; end if;

  update public.wallet_accounts
    set available_balance = available_balance - v_total,
        held_balance = held_balance + v_total, updated_at = now()
    where id = v_wallet.id;

  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
    values (p_actor_user_id,'survey_escrow_hold',v_total,'SAR','completed','survey-pending','Survey escrow hold','available','debit');
  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
    values (p_actor_user_id,'survey_escrow_hold',v_total,'SAR','completed','survey-pending','Survey escrow held','held','credit');

  insert into public.survey_requests(
    client_user_id,client_email,client_name,latitude,longitude,address,property_area_sqm,
    property_status,notes,status,payout_amount,platform_fee,total_charged,commission_rate,escrow_status
  ) values (
    p_actor_user_id,lower(trim(p_client_email)),p_client_name,p_latitude,p_longitude,coalesce(p_address,''),
    p_property_area_sqm,p_property_status,p_notes,'pending',v_payout,v_fee,v_total,15,'held'
  ) returning * into v_request;

  update public.wallet_transactions set reference = v_request.id::text
    where user_id = p_actor_user_id and reference = 'survey-pending';

  return jsonb_build_object('request_id',v_request.id,'total_charged',v_total,'payout_amount',v_payout,'platform_fee',v_fee);
end;
$$;

create or replace function public.accept_survey_request(p_actor_user_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_profile public.surveyor_profiles%rowtype; v_request public.survey_requests%rowtype;
begin
  select * into v_profile from public.surveyor_profiles where user_id=p_actor_user_id and status='approved' and is_available=true for update;
  if not found then raise exception 'SURVEYOR_NOT_APPROVED'; end if;
  update public.survey_requests set status='accepted',surveyor_user_id=p_actor_user_id,
    surveyor_profile_id=v_profile.id,surveyor_name=v_profile.full_name,surveyor_email=v_profile.email,
    accepted_at=now(),updated_at=now()
  where id=p_request_id and status in ('pending','broadcasted')
    and (matched_surveyors='[]'::jsonb or matched_surveyors @> jsonb_build_array(jsonb_build_object('surveyor_id',v_profile.id::text)));
  if not found then raise exception 'REQUEST_UNAVAILABLE'; end if;
  select * into v_request from public.survey_requests where id=p_request_id;
  return jsonb_build_object('request_id',v_request.id,'status',v_request.status,'surveyor_name',v_profile.full_name);
end;
$$;

create or replace function public.submit_survey_deliverable(
  p_actor_user_id uuid,p_request_id uuid,p_cad_files text[],p_visual_files text[],p_survey_metadata jsonb,p_description text
) returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_request public.survey_requests%rowtype; v_delivery public.survey_deliverables%rowtype;
begin
  select * into v_request from public.survey_requests where id=p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_request.surveyor_user_id <> p_actor_user_id then raise exception 'FORBIDDEN'; end if;
  if v_request.status not in ('accepted','in_progress') then raise exception 'INVALID_REQUEST_STATUS'; end if;
  insert into public.survey_deliverables(request_id,surveyor_user_id,cad_files,visual_files,survey_metadata,description)
    values(p_request_id,p_actor_user_id,coalesce(p_cad_files,'{}'),coalesce(p_visual_files,'{}'),coalesce(p_survey_metadata,'{}'::jsonb),p_description)
    returning * into v_delivery;
  update public.survey_requests set status='submitted',submitted_at=now(),updated_at=now() where id=p_request_id;
  return jsonb_build_object('request_id',p_request_id,'deliverable_id',v_delivery.id,'status','submitted');
end;
$$;

create or replace function public.approve_survey_deliverable(p_actor_user_id uuid,p_request_id uuid)
returns jsonb language plpgsql security definer set search_path=public
as $$
declare v_request public.survey_requests%rowtype; v_client_wallet public.wallet_accounts%rowtype; v_surveyor_wallet public.wallet_accounts%rowtype;
begin
  select * into v_request from public.survey_requests where id=p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_request.client_user_id <> p_actor_user_id then raise exception 'FORBIDDEN'; end if;
  if v_request.status <> 'submitted' or v_request.escrow_status <> 'held' then raise exception 'INVALID_ESCROW_STATE'; end if;

  select * into v_client_wallet from public.wallet_accounts where user_id=v_request.client_user_id and currency='SAR' and status='active' for update;
  if not found or v_client_wallet.held_balance < v_request.total_charged then raise exception 'ESCROW_BALANCE_MISMATCH'; end if;
  select * into v_surveyor_wallet from public.wallet_accounts where user_id=v_request.surveyor_user_id and currency='SAR' and status='active' for update;
  if not found then raise exception 'SURVEYOR_WALLET_NOT_FOUND'; end if;

  update public.wallet_accounts set held_balance=held_balance-v_request.total_charged,updated_at=now() where id=v_client_wallet.id;
  update public.wallet_accounts set available_balance=available_balance+v_request.payout_amount,updated_at=now() where id=v_surveyor_wallet.id;

  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
    values(v_request.client_user_id,'survey_escrow_release',v_request.total_charged,'SAR','completed',p_request_id::text,'Survey escrow released','held','debit');
  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
    values(v_request.surveyor_user_id,'survey_payout',v_request.payout_amount,'SAR','completed',p_request_id::text,'Survey payout','available','credit');

  update public.survey_requests set status='disbursed',escrow_status='released',approved_at=now(),disbursed_at=now(),updated_at=now()
    where id=p_request_id;
  update public.surveyor_profiles set available_balance=available_balance+v_request.payout_amount,total_jobs=total_jobs+1,updated_at=now()
    where user_id=v_request.surveyor_user_id;
  return jsonb_build_object('request_id',p_request_id,'status','disbursed','payout_amount',v_request.payout_amount,'platform_fee',v_request.platform_fee);
end;
$$;

revoke all on function public.create_survey_request_with_escrow(uuid,text,text,double precision,double precision,text,numeric,text,text) from public,anon,authenticated;
revoke all on function public.accept_survey_request(uuid,uuid) from public,anon,authenticated;
revoke all on function public.submit_survey_deliverable(uuid,uuid,text[],text[],jsonb,text) from public,anon,authenticated;
revoke all on function public.approve_survey_deliverable(uuid,uuid) from public,anon,authenticated;
grant execute on function public.create_survey_request_with_escrow(uuid,text,text,double precision,double precision,text,numeric,text,text) to service_role;
grant execute on function public.accept_survey_request(uuid,uuid) to service_role;
grant execute on function public.submit_survey_deliverable(uuid,uuid,text[],text[],jsonb,text) to service_role;
grant execute on function public.approve_survey_deliverable(uuid,uuid) to service_role;

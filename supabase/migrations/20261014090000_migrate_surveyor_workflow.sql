-- Surveyor workflow migration from Base44 to Supabase.
-- All balance-affecting operations are atomic database functions. Existing Base44
-- records are intentionally not deleted or rewritten by this migration.
create table if not exists public.surveyor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  phone text not null default '',
  license_number text not null,
  city text not null,
  latitude double precision,
  longitude double precision,
  geofencing_radius_km integer not null default 50 check (geofencing_radius_km between 1 and 500),
  bio text not null default '',
  years_experience integer not null default 0 check (years_experience >= 0),
  status text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  is_available boolean not null default true,
  terms_accepted boolean not null default false,
  terms_accepted_date timestamptz,
  available_balance numeric(12,2) not null default 0 check (available_balance >= 0),
  total_jobs integer not null default 0,
  rating numeric(3,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists surveyor_profiles_status_available_idx on public.surveyor_profiles(status,is_available);
create index if not exists surveyor_profiles_email_idx on public.surveyor_profiles(lower(email));

create table if not exists public.survey_requests (
  id uuid primary key default gen_random_uuid(),
  client_user_id uuid not null references auth.users(id),
  client_email text not null,
  client_name text not null default '',
  surveyor_id uuid references public.surveyor_profiles(id),
  surveyor_user_id uuid references auth.users(id),
  surveyor_email text,
  surveyor_name text,
  latitude double precision not null,
  longitude double precision not null,
  address text not null default '',
  property_area_sqm numeric(12,2) not null check (property_area_sqm > 0),
  property_status text not null default 'vacant_land',
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending','broadcasted','accepted','in_progress','submitted','disbursed','cancelled','disputed')),
  total_charged numeric(12,2) not null check (total_charged >= 0),
  payout_amount numeric(12,2) not null check (payout_amount >= 0),
  platform_fee numeric(12,2) not null check (platform_fee >= 0),
  commission_rate numeric(5,2) not null default 15,
  escrow_status text not null default 'held' check (escrow_status in ('held','released','refunded','disputed')),
  matched_surveyors jsonb not null default '[]'::jsonb,
  accepted_at timestamptz,
  submitted_at timestamptz,
  approved_at timestamptz,
  disbursed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists survey_requests_status_created_idx on public.survey_requests(status,created_at desc);
create index if not exists survey_requests_client_idx on public.survey_requests(client_user_id,created_at desc);
create index if not exists survey_requests_surveyor_idx on public.survey_requests(surveyor_user_id,created_at desc);

create table if not exists public.survey_deliverables (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.survey_requests(id),
  surveyor_id uuid not null references public.surveyor_profiles(id),
  cad_files jsonb not null default '[]'::jsonb,
  visual_files jsonb not null default '[]'::jsonb,
  survey_metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists survey_deliverables_request_idx on public.survey_deliverables(request_id,created_at desc);

alter table public.surveyor_profiles enable row level security;
alter table public.survey_requests enable row level security;
alter table public.survey_deliverables enable row level security;
-- Access is mediated by the authenticated survey-engine Edge Function.
revoke all on public.surveyor_profiles from anon, authenticated;
revoke all on public.survey_requests from anon, authenticated;
revoke all on public.survey_deliverables from anon, authenticated;
grant all on public.surveyor_profiles to service_role;
grant all on public.survey_requests to service_role;
grant all on public.survey_deliverables to service_role;

create or replace function public.bytly_hold_survey_escrow(
  p_client_user_id uuid, p_client_email text, p_client_name text,
  p_latitude double precision, p_longitude double precision, p_address text,
  p_area numeric, p_property_status text, p_notes text,
  p_total numeric, p_fee numeric, p_payout numeric, p_matches jsonb
) returns public.survey_requests
language plpgsql security definer set search_path=public
as $$
declare v_wallet public.wallet_accounts; v_request public.survey_requests; v_legacy_balance numeric(12,2);
begin
  select * into v_wallet from public.wallet_accounts where user_id=p_client_user_id and currency='SAR' and status='active' for update;
  if not found then
    select coalesce(wallet_balance,0) into v_legacy_balance from public.clients where user_id=p_client_user_id;
    insert into public.wallet_accounts(user_id,currency,available_balance,held_balance,status)
    values(p_client_user_id,'SAR',greatest(coalesce(v_legacy_balance,0),0),0,'active')
    on conflict (user_id,currency) do nothing;
    select * into v_wallet from public.wallet_accounts where user_id=p_client_user_id and currency='SAR' for update;
  end if;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if coalesce(v_wallet.available_balance,0) < p_total then raise exception 'INSUFFICIENT_BALANCE'; end if;
  update public.wallet_accounts set available_balance=available_balance-p_total, held_balance=held_balance+p_total, updated_at=now() where id=v_wallet.id;
  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
  values(p_client_user_id,'survey_escrow_hold',p_total,'SAR','completed',null,'حجز ضمان طلب رفع مساحي','held','out');
  insert into public.survey_requests(client_user_id,client_email,client_name,latitude,longitude,address,property_area_sqm,property_status,notes,status,total_charged,payout_amount,platform_fee,matched_surveyors)
  values(p_client_user_id,p_client_email,p_client_name,p_latitude,p_longitude,coalesce(p_address,''),p_area,coalesce(p_property_status,'vacant_land'),coalesce(p_notes,''),case when jsonb_array_length(coalesce(p_matches,'[]'::jsonb))>0 then 'broadcasted' else 'pending' end,p_total,p_payout,p_fee,coalesce(p_matches,'[]'::jsonb))
  returning * into v_request;
  return v_request;
end $$;
revoke all on function public.bytly_hold_survey_escrow(uuid,text,text,double precision,double precision,text,numeric,text,text,numeric,numeric,numeric,jsonb) from public, anon, authenticated;
grant execute on function public.bytly_hold_survey_escrow(uuid,text,text,double precision,double precision,text,numeric,text,text,numeric,numeric,numeric,jsonb) to service_role;

create or replace function public.bytly_release_survey_escrow(p_request_id uuid,p_client_user_id uuid)
returns public.survey_requests language plpgsql security definer set search_path=public
as $$
declare v_request public.survey_requests; v_wallet public.wallet_accounts; v_surveyor_wallet public.wallet_accounts;
begin
  select * into v_request from public.survey_requests where id=p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_request.client_user_id<>p_client_user_id then raise exception 'FORBIDDEN'; end if;
  if v_request.status<>'submitted' or v_request.escrow_status<>'held' then raise exception 'INVALID_REQUEST_STATUS'; end if;
  select * into v_wallet from public.wallet_accounts where user_id=v_request.client_user_id and currency='SAR' for update;
  if not found or coalesce(v_wallet.held_balance,0)<v_request.total_charged then raise exception 'ESCROW_BALANCE_MISMATCH'; end if;
  update public.wallet_accounts set held_balance=held_balance-v_request.total_charged,updated_at=now() where id=v_wallet.id;
  select * into v_surveyor_wallet from public.wallet_accounts where user_id=v_request.surveyor_user_id and currency='SAR' and status='active' for update;
  if not found then
    insert into public.wallet_accounts(user_id,currency,available_balance,held_balance,status)
    values(v_request.surveyor_user_id,'SAR',v_request.payout_amount,0,'active');
  else
    update public.wallet_accounts set available_balance=available_balance+v_request.payout_amount,updated_at=now() where id=v_surveyor_wallet.id;
  end if;
  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
  values(v_request.surveyor_user_id,'survey_escrow_release',v_request.payout_amount,'SAR','completed',p_request_id::text,'صرف مستحقات الرفع المساحي','available','in');
  update public.surveyor_profiles set available_balance=available_balance+v_request.payout_amount,total_jobs=total_jobs+1,updated_at=now() where id=v_request.surveyor_id;
  update public.survey_requests set status='disbursed',escrow_status='released',approved_at=now(),disbursed_at=now(),updated_at=now() where id=p_request_id returning * into v_request;
  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
  values(v_request.client_user_id,'survey_platform_commission',v_request.platform_fee,'SAR','completed',p_request_id::text,'عمولة منصة بيتلي لطلب رفع مساحي','held','out');
  return v_request;
end $$;
revoke all on function public.bytly_release_survey_escrow(uuid,uuid) from public, anon, authenticated;
grant execute on function public.bytly_release_survey_escrow(uuid,uuid) to service_role;

create or replace function public.bytly_cancel_survey_escrow(p_request_id uuid,p_client_user_id uuid)
returns public.survey_requests language plpgsql security definer set search_path=public
as $$
declare v_request public.survey_requests; v_wallet public.wallet_accounts;
begin
  select * into v_request from public.survey_requests where id=p_request_id for update;
  if not found then raise exception 'REQUEST_NOT_FOUND'; end if;
  if v_request.client_user_id<>p_client_user_id then raise exception 'FORBIDDEN'; end if;
  if v_request.status not in ('pending','broadcasted') or v_request.escrow_status<>'held' then raise exception 'CANNOT_CANCEL_AFTER_ACCEPTANCE'; end if;
  select * into v_wallet from public.wallet_accounts where user_id=v_request.client_user_id and currency='SAR' for update;
  if not found or coalesce(v_wallet.held_balance,0)<v_request.total_charged then raise exception 'ESCROW_BALANCE_MISMATCH'; end if;
  update public.wallet_accounts set available_balance=available_balance+v_request.total_charged,held_balance=held_balance-v_request.total_charged,updated_at=now() where id=v_wallet.id;
  insert into public.wallet_transactions(user_id,type,amount,currency,status,reference,description,balance_type,direction)
  values(v_request.client_user_id,'survey_escrow_refund',v_request.total_charged,'SAR','completed',p_request_id::text,'استرداد ضمان طلب رفع مساحي ملغى','available','in');
  update public.survey_requests set status='cancelled',escrow_status='refunded',cancelled_at=now(),updated_at=now() where id=p_request_id returning * into v_request;
  return v_request;
end $$;
revoke all on function public.bytly_cancel_survey_escrow(uuid,uuid) from public, anon, authenticated;
grant execute on function public.bytly_cancel_survey_escrow(uuid,uuid) to service_role;

-- Preserve the richer survey-rating fields previously collected in Base44.
alter table public.project_reviews add column if not exists quality_rating integer not null default 0;
alter table public.project_reviews add column if not exists delivery_rating integer not null default 0;
alter table public.project_reviews add column if not exists communication_rating integer not null default 0;

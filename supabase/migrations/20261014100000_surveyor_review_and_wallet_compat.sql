-- Follow-up compatibility fields and wallet initialization guard for surveyor migration.
alter table public.project_reviews add column if not exists quality_rating integer not null default 0;
alter table public.project_reviews add column if not exists delivery_rating integer not null default 0;
alter table public.project_reviews add column if not exists communication_rating integer not null default 0;
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


-- Atomic acceptance of one project offer and creation of a draft contract.
CREATE OR REPLACE FUNCTION public.accept_project_offer(p_offer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_project_id uuid;
  v_project public.projects%rowtype;
  v_offer public.project_offers%rowtype;
  v_engineer public.engineers%rowtype;
  v_contract public.project_contracts%rowtype;
  v_contract_id uuid := gen_random_uuid();
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_offer_id is null then raise exception 'OFFER_ID_REQUIRED'; end if;

  select project_id into v_project_id
  from public.project_offers where id=p_offer_id;
  if v_project_id is null then raise exception 'OFFER_NOT_FOUND'; end if;

  select * into v_project from public.projects where id=v_project_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if v_project.client_user_id is distinct from v_user_id then raise exception 'NOT_PROJECT_OWNER'; end if;

  select * into v_offer from public.project_offers where id=p_offer_id and project_id=v_project_id for update;
  if not found then raise exception 'OFFER_NOT_FOUND'; end if;

  select * into v_contract from public.project_contracts where offer_id=p_offer_id limit 1;
  if found and v_offer.status='accepted' then
    return jsonb_build_object('ok',true,'already_accepted',true,'project_id',v_project_id,'offer_id',p_offer_id,'contract_id',v_contract.id);
  end if;

  if exists(select 1 from public.project_offers where project_id=v_project_id and status='accepted' and id<>p_offer_id) then
    raise exception 'ANOTHER_OFFER_ALREADY_ACCEPTED';
  end if;
  if v_offer.status <> 'pending' then raise exception 'OFFER_NOT_PENDING'; end if;
  if v_project.status <> 'open' or coalesce(v_project.lifecycle_status,'draft') in ('contracted','completed','cancelled') then
    raise exception 'PROJECT_NOT_OPEN_FOR_ACCEPTANCE';
  end if;

  select * into v_engineer from public.engineers where user_id=v_offer.engineer_user_id limit 1;
  if not found then raise exception 'OFFER_ENGINEER_PROFILE_NOT_FOUND'; end if;

  update public.project_offers set status='accepted',updated_at=now() where id=p_offer_id;

  update public.projects set
    assigned_engineer_id=v_engineer.id,
    status='in_progress',
    lifecycle_status='assigned',
    updated_at=now()
  where id=v_project_id;

  insert into public.project_contracts (
    id,project_id,offer_id,client_user_id,provider_user_id,client_id,engineer_id,
    title,contract_number,amount,total_amount,currency,status,terms,payment_terms,
    contract_type,service_description,provider_type
  ) values (
    v_contract_id,v_project_id,p_offer_id,v_project.client_user_id,v_offer.engineer_user_id,
    nullif(v_project.client_id,'')::uuid,v_engineer.id,
    'عقد مشروع: '||v_project.title,
    'BTY-'||to_char(now(),'YYYYMMDD')||'-'||upper(substr(replace(v_contract_id::text,'-',''),1,8)),
    v_offer.amount,v_offer.amount,coalesce(v_offer.currency,'SAR'),'draft',
    coalesce(v_offer.proposal,'عرض الخدمة المقبول'), 'وفق مراحل المشروع والدفعات المعتمدة في بيتلي',
    'engineering_service',coalesce(v_project.description,v_project.category,'خدمات هندسية'),'engineer'
  ) returning * into v_contract;

  return jsonb_build_object(
    'ok',true,'already_accepted',false,'project_id',v_project_id,
    'offer_id',p_offer_id,'contract_id',v_contract.id,'contract_status',v_contract.status,
    'provider_user_id',v_offer.engineer_user_id,'amount',v_offer.amount
  );
end;
$function$
;
revoke all on function public.accept_project_offer(uuid) from public, anon;
grant execute on function public.accept_project_offer(uuid) to authenticated;

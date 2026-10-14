create or replace function public.request_withdrawal(
  p_amount numeric,
  p_iban text,
  p_bank_name text,
  p_account_holder_name text,
  p_project_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_uid uuid := auth.uid();
  v_wallet public.wallet_accounts%rowtype;
  v_w public.withdrawal_requests%rowtype;
  v_iban text := upper(regexp_replace(coalesce(p_iban, ''), '\s+', '', 'g'));
  v_role text;
  v_provider_type text;
  v_engineer_id uuid;
  v_contractor_id uuid;
  v_supplier_id uuid;
  v_consultant_id uuid;
  v_legal_consultant_id uuid;
  v_bank_id uuid;
begin
  if v_uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if v_iban !~ '^SA[0-9]{22}$' then raise exception 'INVALID_SAUDI_IBAN'; end if;
  if nullif(trim(p_bank_name), '') is null or nullif(trim(p_account_holder_name), '') is null then
    raise exception 'BANK_DETAILS_REQUIRED';
  end if;

  select lower(coalesce(role, '')) into v_role
  from public.profiles where user_id = v_uid limit 1;
  if v_role is null then raise exception 'WITHDRAWAL_PROVIDER_NOT_FOUND'; end if;

  -- A profile role alone is not enough: require a real provider profile owned by this user.
  case v_role
    when 'engineer' then
      select id into v_engineer_id from public.engineers where user_id = v_uid limit 1;
      v_provider_type := 'engineer';
    when 'contractor' then
      select id into v_contractor_id from public.contractors where user_id = v_uid limit 1;
      v_provider_type := 'contractor';
    when 'supplier' then
      select id into v_supplier_id from public.suppliers where user_id = v_uid limit 1;
      v_provider_type := 'supplier';
    when 'technical_consultant' then
      select id into v_consultant_id from public.consultants where user_id = v_uid limit 1;
      v_provider_type := 'technical_consultant';
    when 'legal_consultant' then
      select id into v_legal_consultant_id from public.legal_consultants where user_id = v_uid limit 1;
      v_provider_type := 'legal_consultant';
    else
      raise exception 'WITHDRAWAL_PROVIDER_ROLE_NOT_SUPPORTED';
  end case;

  if v_engineer_id is null and v_contractor_id is null and v_supplier_id is null
     and v_consultant_id is null and v_legal_consultant_id is null then
    raise exception 'WITHDRAWAL_PROVIDER_PROFILE_REQUIRED';
  end if;

  select id into v_bank_id from public.financial_bank_accounts
  where user_id = v_uid and iban = v_iban
    and verification_status in ('pending', 'verified')
  limit 1;
  if v_bank_id is null then
    insert into public.financial_bank_accounts(
      user_id, account_holder_name, bank_name, iban, verification_status, is_default
    ) values (
      v_uid, trim(p_account_holder_name), trim(p_bank_name), v_iban, 'pending', false
    ) returning id into v_bank_id;
  end if;

  select * into v_wallet from public.wallet_accounts
  where user_id = v_uid and currency = 'SAR'
  for update;
  if not found then raise exception 'WALLET_NOT_FOUND'; end if;
  if coalesce(v_wallet.status, 'active') <> 'active' then raise exception 'WALLET_INACTIVE'; end if;
  if coalesce(v_wallet.available_balance, 0) < p_amount then raise exception 'INSUFFICIENT_AVAILABLE_BALANCE'; end if;

  if p_project_id is not null then
    if not exists (
      select 1 from public.project_payments pp
      where pp.project_id = p_project_id
        and pp.payee_user_id = v_uid
        and pp.escrow_status = 'released'
    ) then
      raise exception 'PROJECT_NOT_ASSIGNED_TO_PROVIDER';
    end if;
  end if;

  insert into public.withdrawal_requests(
    project_id, provider_user_id, provider_type,
    engineer_id, contractor_id, supplier_id,
    consultant_user_id, consultant_profile_id, consultant_profile_type,
    financial_bank_account_id, amount, status, consultant_approval, owner_approval, request_date
  ) values (
    p_project_id, v_uid, v_provider_type,
    v_engineer_id, v_contractor_id, v_supplier_id,
    case when v_consultant_id is not null or v_legal_consultant_id is not null then v_uid else null end,
    coalesce(v_consultant_id, v_legal_consultant_id),
    case when v_consultant_id is not null then 'technical_consultant'
         when v_legal_consultant_id is not null then 'legal_consultant' else null end,
    v_bank_id, p_amount, 'pending', false, false, now()
  ) returning * into v_w;

  insert into public.withdrawal_bank_details(
    withdrawal_id, user_id, iban, bank_name, account_holder_name
  ) values (
    v_w.id, v_uid, v_iban, trim(p_bank_name), trim(p_account_holder_name)
  );

  update public.wallet_accounts
  set available_balance = available_balance - p_amount,
      held_balance = coalesce(held_balance, 0) + p_amount,
      updated_at = now()
  where id = v_wallet.id;

  insert into public.wallet_transactions(
    user_id, type, amount, currency, status, reference, description, balance_type, direction, payment_id
  ) values (
    v_uid, 'withdrawal_request', p_amount, 'SAR', 'pending', v_w.id::text,
    'حجز مبلغ طلب سحب لمقدم الخدمة حتى اكتمال الاعتماد والتنفيذ',
    'held', 'debit', v_w.id
  );

  return jsonb_build_object(
    'id', v_w.id, 'amount', v_w.amount, 'status', v_w.status,
    'provider_user_id', v_uid, 'provider_type', v_provider_type,
    'financial_bank_account_id', v_bank_id, 'request_date', v_w.request_date
  );
end;
$function$;

revoke all on function public.request_withdrawal(numeric, text, text, text, uuid) from public, anon;
grant execute on function public.request_withdrawal(numeric, text, text, text, uuid) to authenticated, service_role;

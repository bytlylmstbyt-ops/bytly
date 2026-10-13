create or replace function public.complete_moyasar_project_payment(
  p_project_payment_id uuid,
  p_moyasar_payment_id text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  pp public.project_payments%rowtype;
  pr public.projects%rowtype;
  ms public.project_milestones%rowtype;
  fm public.project_financial_milestones%rowtype;
  v_base numeric(14,2);
  v_vat_rate numeric(5,2);
  v_vat numeric(14,2);
  v_total numeric(14,2);
  v_commission_rate numeric(5,2);
  v_project_base numeric(14,2);
  v_project_commission numeric(14,2);
  v_invoice uuid;
  v_reference text;
  v_inserted boolean := false;
begin
  if p_project_payment_id is null or nullif(trim(p_moyasar_payment_id), '') is null then
    raise exception 'INVALID_PAYMENT_REFERENCE';
  end if;

  select * into pp
  from public.project_payments
  where id = p_project_payment_id
  for update;
  if not found then raise exception 'PROJECT_PAYMENT_NOT_FOUND'; end if;
  if pp.gateway_reference is distinct from p_moyasar_payment_id then
    raise exception 'MOYASAR_REFERENCE_MISMATCH';
  end if;
  if pp.currency <> 'SAR' then raise exception 'UNSUPPORTED_CURRENCY'; end if;
  if pp.escrow_status = 'held' and pp.status = 'paid' then
    return jsonb_build_object('ok', true, 'already_completed', true, 'payment_id', pp.id, 'project_id', pp.project_id, 'milestone_id', pp.milestone_id);
  end if;
  if pp.status not in ('initiated','pending','paid') then raise exception 'PAYMENT_NOT_COMPLETABLE'; end if;

  select * into pr from public.projects where id = pp.project_id for update;
  if not found then raise exception 'PROJECT_NOT_FOUND'; end if;
  if pr.client_user_id is distinct from pp.payer_user_id then raise exception 'PAYER_PROJECT_MISMATCH'; end if;
  if pp.payee_user_id is null or pp.payee_user_id = pp.payer_user_id then raise exception 'INVALID_PROJECT_PROVIDER'; end if;

  select * into ms
  from public.project_milestones
  where id = pp.milestone_id and project_id = pp.project_id
  for update;
  if not found then raise exception 'MILESTONE_NOT_FOUND'; end if;

  if exists (
    select 1 from public.project_financial_milestones
    where project_id = pp.project_id
      and milestone_id = pp.milestone_id
      and escrow_status in ('funded','held','partially_released','released')
      and id is distinct from (
        select id from public.project_financial_milestones
        where project_id = pp.project_id and milestone_id = pp.milestone_id
        order by created_at desc limit 1
      )
  ) then
    raise exception 'MILESTONE_ALREADY_FUNDED';
  end if;

  v_base := round(coalesce(pp.taxable_amount, pp.amount), 2);
  v_vat_rate := coalesce(pp.vat_rate, 15);
  v_vat := round(coalesce(pp.vat_amount, v_base * v_vat_rate / 100), 2);
  v_total := round(coalesce(nullif(pp.total_amount, 0), v_base + v_vat), 2);
  if v_base <= 0 or v_total < v_base then raise exception 'INVALID_PAYMENT_AMOUNT'; end if;

  select coalesce(default_project_commission_rate, 15)
  into v_commission_rate from public.financial_settings where id = true;
  v_commission_rate := coalesce(v_commission_rate, 15);

  v_project_base := coalesce(pr.project_taxable_amount, 0);
  if v_project_base <= 0 then
    select coalesce(sum(amount), 0) into v_project_base
    from public.project_milestones where project_id = pp.project_id;
  end if;
  v_project_commission := coalesce(pr.project_commission_amount, 0);
  if v_project_commission <= 0 then
    v_project_commission := round(v_project_base * v_commission_rate / 100, 2);
  end if;

  v_reference := 'MOYASAR_PROJECT_ESCROW:' || pp.id::text;
  insert into public.wallet_accounts(user_id, currency, available_balance, held_balance, updated_at)
  values(pp.payer_user_id, 'SAR', 0, 0, now())
  on conflict(user_id) do nothing;

  insert into public.wallet_transactions(
    user_id, project_id, payment_id, type, amount, currency, status,
    reference, description, balance_type, direction
  ) values (
    pp.payer_user_id, pp.project_id, pp.id, 'escrow_hold', v_total, 'SAR', 'completed',
    v_reference, 'حجز دفعة مشروع عبر Moyasar في الضمان', 'held', 'debit'
  ) on conflict(project_id, reference) do nothing;
  v_inserted := found;
  if v_inserted then
    update public.wallet_accounts
    set held_balance = coalesce(held_balance, 0) + v_total, updated_at = now()
    where user_id = pp.payer_user_id;
  end if;

  update public.projects
  set escrow_amount = coalesce(escrow_amount, 0) + v_base,
      escrow_status = 'held',
      project_commission_rate = coalesce(project_commission_rate, v_commission_rate),
      project_commission_amount = greatest(coalesce(project_commission_amount, 0), v_project_commission),
      project_taxable_amount = coalesce(project_taxable_amount, 0) + v_base,
      project_vat_amount = coalesce(project_vat_amount, 0) + v_vat,
      project_customer_total = coalesce(project_customer_total, 0) + v_total,
      updated_at = now()
  where id = pp.project_id;

  select * into fm
  from public.project_financial_milestones
  where project_id = pp.project_id and milestone_id = pp.milestone_id
  order by created_at desc limit 1
  for update;

  if found then
    if fm.escrow_status in ('funded','held','partially_released','released') then
      raise exception 'MILESTONE_ALREADY_FUNDED';
    end if;
    update public.project_financial_milestones
    set gross_amount = v_base, escrow_status = 'funded', release_status = 'pending',
        funded_at = now(), vat_rate = v_vat_rate, vat_amount = v_vat,
        customer_total_amount = v_total, commission_rate = v_commission_rate,
        platform_commission = v_project_commission, commission_amount = v_project_commission,
        updated_at = now()
    where id = fm.id returning * into fm;
  else
    insert into public.project_financial_milestones(
      project_id, milestone_id, sequence_no, title, gross_amount, platform_commission,
      allocations, escrow_status, release_status, funded_at, vat_rate, vat_amount,
      customer_total_amount, commission_rate, commission_amount
    ) values (
      pp.project_id, pp.milestone_id, coalesce(ms.sequence_no, 1), ms.title, v_base,
      v_project_commission, '[]'::jsonb, 'funded', 'pending', now(), v_vat_rate,
      v_vat, v_total, v_commission_rate, v_project_commission
    ) returning * into fm;
  end if;

  v_invoice := public.create_project_escrow_invoice(pp.project_id, pp.milestone_id, pp.payer_user_id, v_base, pp.contract_id);

  update public.project_payments
  set status = 'paid', escrow_status = 'held', paid_at = coalesce(paid_at, now()),
      held_at = coalesce(held_at, now()), invoice_id = coalesce(invoice_id, v_invoice),
      taxable_amount = v_base, vat_rate = v_vat_rate, vat_amount = v_vat,
      total_amount = v_total, updated_at = now()
  where id = pp.id;

  update public.project_milestones
  set status = 'in_progress', updated_at = now()
  where id = pp.milestone_id;

  return jsonb_build_object(
    'ok', true, 'already_completed', false, 'payment_id', pp.id,
    'project_id', pp.project_id, 'milestone_id', pp.milestone_id,
    'financial_milestone_id', fm.id, 'invoice_id', v_invoice,
    'taxable_amount', v_base, 'vat_amount', v_vat, 'total_amount', v_total
  );
end;
$function$;

revoke all on function public.complete_moyasar_project_payment(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_moyasar_project_payment(uuid, text) to service_role;
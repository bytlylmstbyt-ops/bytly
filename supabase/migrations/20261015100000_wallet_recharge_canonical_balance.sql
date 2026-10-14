-- Keep wallet recharge credits in the canonical wallet ledger while mirroring legacy profile balances
-- for older UI paths during the migration window.
create or replace function public.complete_wallet_recharge(
  p_order_id uuid,
  p_user_id uuid,
  p_payment_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_tx public.wallet_transactions%rowtype;
  v_wallet public.wallet_accounts%rowtype;
  v_client_id uuid;
  v_engineer_id uuid;
begin
  if p_order_id is null or p_user_id is null or nullif(trim(p_payment_id), '') is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_payment_reference');
  end if;

  select * into v_tx
  from public.wallet_transactions
  where id = p_order_id
    and user_id = p_user_id
    and type = 'wallet_recharge'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if v_tx.status = 'completed' and v_tx.reference = p_payment_id then
    return jsonb_build_object('ok', true, 'already_completed', true, 'credited_to', 'wallet_accounts');
  end if;

  if v_tx.status <> 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'order_not_pending', 'status', v_tx.status);
  end if;

  -- Serialize completions that present the same gateway payment ID to prevent double credit.
  perform pg_advisory_xact_lock(hashtext(p_payment_id));

  if exists (
    select 1 from public.wallet_transactions
    where reference = p_payment_id and id <> p_order_id
  ) then
    return jsonb_build_object('ok', false, 'reason', 'payment_already_used');
  end if;

  if coalesce(v_tx.amount, 0) <= 0 or coalesce(v_tx.currency, '') <> 'SAR' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_order_amount_or_currency');
  end if;

  insert into public.wallet_accounts(user_id, currency, available_balance, held_balance, status, updated_at)
  values (p_user_id, 'SAR', 0, 0, 'active', now())
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.wallet_accounts
  where user_id = p_user_id and currency = 'SAR'
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'wallet_not_found');
  end if;
  if coalesce(v_wallet.status, 'active') <> 'active' then
    return jsonb_build_object('ok', false, 'reason', 'wallet_inactive');
  end if;

  update public.wallet_transactions
  set status = 'completed',
      reference = p_payment_id,
      balance_type = 'available',
      direction = 'credit'
  where id = p_order_id and user_id = p_user_id and status = 'pending';
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_pending');
  end if;

  update public.wallet_accounts
  set available_balance = coalesce(available_balance, 0) + v_tx.amount,
      updated_at = now()
  where id = v_wallet.id;

  -- Transitional mirror only; wallet_accounts is the canonical balance.
  select id into v_client_id
  from public.clients
  where user_id = p_user_id
  order by created_at desc
  limit 1
  for update;

  if v_client_id is not null then
    update public.clients
    set wallet_balance = coalesce(wallet_balance, 0) + v_tx.amount
    where id = v_client_id;
    return jsonb_build_object('ok', true, 'credited_to', 'client_and_wallet_accounts');
  end if;

  select id into v_engineer_id
  from public.engineers
  where user_id = p_user_id
  order by created_at desc
  limit 1
  for update;

  if v_engineer_id is not null then
    update public.engineers
    set wallet_balance = coalesce(wallet_balance, 0) + v_tx.amount
    where id = v_engineer_id;
    return jsonb_build_object('ok', true, 'credited_to', 'engineer_and_wallet_accounts');
  end if;

  return jsonb_build_object('ok', true, 'credited_to', 'wallet_accounts');
end;
$function$;

revoke all on function public.complete_wallet_recharge(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.complete_wallet_recharge(uuid, uuid, text) to service_role;

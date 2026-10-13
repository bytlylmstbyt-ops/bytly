-- Resolve legacy seller IDs that refer to Supabase auth user IDs as well as profile row IDs.
create or replace function public.purchase_ready_made_design_with_wallet(p_design_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email',''));
  v_design public.ready_made_design%rowtype;
  v_asset public.ready_made_design_assets%rowtype;
  v_client public.clients%rowtype;
  v_seller_user_id uuid;
  v_seller_balance numeric;
  v_amount numeric;
  v_commission numeric;
  v_earnings numeric;
  v_purchase_id text;
  v_download_url text;
begin
  if v_user_id is null or v_email = '' then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  select * into v_design from public.ready_made_design where id = p_design_id and status = 'active' for update;
  if not found then raise exception 'التصميم غير متاح للشراء'; end if;
  if lower(coalesce(v_design.created_by,'')) = v_email then raise exception 'لا يمكن شراء تصميمك الخاص'; end if;
  v_amount := round(coalesce(v_design.price, 0), 2);
  if v_amount <= 0 then raise exception 'سعر التصميم غير صالح'; end if;
  if exists(select 1 from public.design_purchase where design_id=p_design_id and buyer_email=v_email and payment_status='completed') then
    raise exception 'تم شراء هذا التصميم مسبقاً';
  end if;
  select * into v_client from public.clients where lower(email)=v_email and (user_id=v_user_id or user_id is null) order by (user_id=v_user_id) desc nulls last limit 1 for update;
  if not found then raise exception 'ملف العميل غير موجود'; end if;
  if coalesce(v_client.wallet_balance,0) < v_amount then raise exception 'رصيد المحفظة غير كافٍ'; end if;

  if v_design.seller_type = 'engineer' then
    select user_id, coalesce(wallet_balance,0) into v_seller_user_id, v_seller_balance
    from public.engineers
    where id::text=v_design.seller_id
       or base44_id=v_design.seller_id
       or user_id::text=v_design.seller_id
    limit 1 for update;
  else
    select owner_user_id, coalesce(wallet_balance,0) into v_seller_user_id, v_seller_balance
    from public.engineering_firms
    where id::text=v_design.seller_id
       or base44_id=v_design.seller_id
       or owner_user_id::text=v_design.seller_id
    limit 1 for update;
  end if;
  if v_seller_user_id is null then raise exception 'حساب البائع غير مكتمل لاستلام الأرباح'; end if;

  v_commission := round(v_amount * 0.25, 2);
  v_earnings := v_amount - v_commission;
  select * into v_asset from public.ready_made_design_assets where design_id=p_design_id;
  v_download_url := case when jsonb_typeof(v_asset.design_files)='array' then v_asset.design_files->>0 else null end;
  v_purchase_id := gen_random_uuid()::text;

  update public.clients set wallet_balance=coalesce(wallet_balance,0)-v_amount, updated_at=now() where id=v_client.id;
  if v_design.seller_type='engineer' then
    update public.engineers set wallet_balance=coalesce(wallet_balance,0)+v_earnings, updated_at=now()
    where id::text=v_design.seller_id or base44_id=v_design.seller_id;
  else
    update public.engineering_firms set wallet_balance=coalesce(wallet_balance,0)+v_earnings, updated_at=now()
    where id::text=v_design.seller_id or base44_id=v_design.seller_id;
  end if;
  insert into public.design_purchase (
    id,design_id,buyer_id,buyer_email,buyer_name,seller_id,seller_email,amount_paid,
    platform_commission,seller_earnings,payment_method,payment_status,download_url,created_by
  ) values (
    v_purchase_id,p_design_id,v_client.id::text,v_email,v_client.full_name,v_design.seller_id,
    v_design.created_by,v_amount,v_commission,v_earnings,'wallet','completed',v_download_url,v_email
  );
  update public.ready_made_design set total_purchases=total_purchases+1, updated_date=now() where id=p_design_id;
  insert into public.wallet_transactions(user_id,type,amount,status,reference,description,balance_type,direction)
  values
    (v_user_id,'design_purchase',v_amount,'completed',v_purchase_id,'شراء تصميم جاهز: '||v_design.title,'available','debit'),
    (v_seller_user_id,'design_sale',v_earnings,'completed',v_purchase_id,'بيع تصميم جاهز: '||v_design.title,'available','credit'),
    ('2d1b547d-ba5d-4cdc-a39c-cfb60d2f52bc'::uuid,'platform_commission',v_commission,'completed',v_purchase_id,'عمولة منصة بيتلي على بيع تصميم: '||v_design.title,'available','credit');
  return jsonb_build_object('success',true,'purchase_id',v_purchase_id,'download_url',v_download_url,
    'amount_paid',v_amount,'platform_commission',v_commission,'seller_earnings',v_earnings);
end;
$$;

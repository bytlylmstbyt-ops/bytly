-- Migrate ready-made design catalog and purchases from Base44 to Supabase.
-- Original design files are kept separate from public catalog metadata.
create or replace function public.bytly_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and lower(coalesce(p.role, '')) = 'admin'
  );
$$;
revoke all on function public.bytly_is_admin() from public;
grant execute on function public.bytly_is_admin() to authenticated;

create table if not exists public.ready_made_design (
  id text primary key default gen_random_uuid()::text,
  seller_id text not null,
  seller_type text not null default 'engineer' check (seller_type in ('engineer','firm')),
  seller_name text,
  title text not null,
  description text,
  category text not null,
  price numeric not null check (price >= 0),
  design_style text,
  preview_images jsonb not null default '[]'::jsonb,
  area_sqm numeric,
  floors numeric,
  bedrooms numeric,
  bathrooms numeric,
  specifications jsonb not null default '{}'::jsonb,
  includes jsonb not null default '[]'::jsonb,
  modification_available boolean not null default true,
  modification_fee numeric,
  total_purchases integer not null default 0,
  rating numeric not null default 0,
  total_reviews integer not null default 0,
  status text not null default 'active' check (status in ('active','inactive','sold_out')),
  is_featured boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  created_by text not null default (auth.jwt()->>'email'),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists ready_made_design_status_created_idx
  on public.ready_made_design(status, created_date desc);
create index if not exists ready_made_design_seller_idx
  on public.ready_made_design(created_by);

create table if not exists public.design_purchase (
  id text primary key default gen_random_uuid()::text,
  design_id text not null references public.ready_made_design(id) on delete restrict,
  buyer_id text,
  buyer_email text not null,
  buyer_name text,
  seller_id text,
  seller_email text,
  amount_paid numeric not null check (amount_paid >= 0),
  platform_commission numeric not null default 0 check (platform_commission >= 0),
  seller_earnings numeric not null default 0 check (seller_earnings >= 0),
  payment_method text,
  payment_status text not null default 'pending' check (payment_status in ('pending','completed','failed','refunded')),
  stripe_payment_intent text,
  download_url text,
  download_count integer not null default 0,
  has_modification_request boolean not null default false,
  modification_notes text,
  modification_fee numeric,
  modification_status text not null default 'not_requested' check (modification_status in ('not_requested','pending','in_progress','completed')),
  review_rating numeric,
  review_comment text,
  description text,
  created_by text not null default (auth.jwt()->>'email'),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);
create index if not exists design_purchase_buyer_idx on public.design_purchase(buyer_email, created_date desc);
create index if not exists design_purchase_design_status_idx on public.design_purchase(design_id, payment_status);

create table if not exists public.ready_made_design_assets (
  design_id text primary key references public.ready_made_design(id) on delete cascade,
  design_files jsonb not null default '[]'::jsonb,
  created_by text not null default (auth.jwt()->>'email'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ready_made_design enable row level security;
alter table public.design_purchase enable row level security;
alter table public.ready_made_design_assets enable row level security;

drop policy if exists ready_made_design_public_read on public.ready_made_design;
create policy ready_made_design_public_read on public.ready_made_design
for select to anon, authenticated
using (status in ('active','sold_out') or created_by = (auth.jwt()->>'email') or public.bytly_is_admin());
drop policy if exists ready_made_design_owner_insert on public.ready_made_design;
create policy ready_made_design_owner_insert on public.ready_made_design
for insert to authenticated
with check (created_by = (auth.jwt()->>'email'));
drop policy if exists ready_made_design_owner_update on public.ready_made_design;
create policy ready_made_design_owner_update on public.ready_made_design
for update to authenticated
using (created_by = (auth.jwt()->>'email') or public.bytly_is_admin())
with check (created_by = (auth.jwt()->>'email') or public.bytly_is_admin());
drop policy if exists ready_made_design_owner_delete on public.ready_made_design;
create policy ready_made_design_owner_delete on public.ready_made_design
for delete to authenticated
using (created_by = (auth.jwt()->>'email') or public.bytly_is_admin());

drop policy if exists design_purchase_participant_read on public.design_purchase;
create policy design_purchase_participant_read on public.design_purchase
for select to authenticated
using (buyer_email = (auth.jwt()->>'email') or seller_email = (auth.jwt()->>'email') or public.bytly_is_admin());
drop policy if exists design_purchase_participant_update on public.design_purchase;
create policy design_purchase_participant_update on public.design_purchase
for update to authenticated
using (buyer_email = (auth.jwt()->>'email') or seller_email = (auth.jwt()->>'email') or public.bytly_is_admin())
with check (buyer_email = (auth.jwt()->>'email') or seller_email = (auth.jwt()->>'email') or public.bytly_is_admin());

drop policy if exists ready_made_design_assets_owner_or_buyer_read on public.ready_made_design_assets;
create policy ready_made_design_assets_owner_or_buyer_read on public.ready_made_design_assets
for select to authenticated
using (
  created_by = (auth.jwt()->>'email')
  or public.bytly_is_admin()
  or exists (
    select 1 from public.design_purchase dp
    where dp.design_id = ready_made_design_assets.design_id
      and dp.buyer_email = (auth.jwt()->>'email')
      and dp.payment_status = 'completed'
  )
);
drop policy if exists ready_made_design_assets_owner_insert on public.ready_made_design_assets;
create policy ready_made_design_assets_owner_insert on public.ready_made_design_assets
for insert to authenticated
with check (
  exists (select 1 from public.ready_made_design d where d.id = design_id and d.created_by = (auth.jwt()->>'email'))
);
drop policy if exists ready_made_design_assets_owner_update on public.ready_made_design_assets;
create policy ready_made_design_assets_owner_update on public.ready_made_design_assets
for update to authenticated
using (created_by = (auth.jwt()->>'email') or public.bytly_is_admin())
with check (created_by = (auth.jwt()->>'email') or public.bytly_is_admin());
drop policy if exists ready_made_design_assets_owner_delete on public.ready_made_design_assets;
create policy ready_made_design_assets_owner_delete on public.ready_made_design_assets
for delete to authenticated
using (created_by = (auth.jwt()->>'email') or public.bytly_is_admin());

-- Financial status and amounts are immutable from browser-side updates.
create or replace function public.guard_design_purchase_financial_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_user not in ('postgres','service_role')
     and (
       new.design_id is distinct from old.design_id
       or new.buyer_id is distinct from old.buyer_id
       or new.buyer_email is distinct from old.buyer_email
       or new.seller_id is distinct from old.seller_id
       or new.seller_email is distinct from old.seller_email
       or new.amount_paid is distinct from old.amount_paid
       or new.platform_commission is distinct from old.platform_commission
       or new.seller_earnings is distinct from old.seller_earnings
       or new.payment_method is distinct from old.payment_method
       or new.payment_status is distinct from old.payment_status
       or new.stripe_payment_intent is distinct from old.stripe_payment_intent
       or new.download_url is distinct from old.download_url
     ) then
    raise exception 'Financial purchase fields can only be changed by a trusted payment service';
  end if;
  new.updated_date := now();
  return new;
end; $$;
drop trigger if exists guard_design_purchase_financial_fields on public.design_purchase;
create trigger guard_design_purchase_financial_fields
before update on public.design_purchase
for each row execute function public.guard_design_purchase_financial_fields();

-- A wallet purchase is one database transaction: lock balances, verify ownership,
-- debit buyer, credit seller, create ledger entries, and mark purchase completed.
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
    where id::text=v_design.seller_id or base44_id=v_design.seller_id
    limit 1 for update;
  else
    select owner_user_id, coalesce(wallet_balance,0) into v_seller_user_id, v_seller_balance
    from public.engineering_firms
    where id::text=v_design.seller_id or base44_id=v_design.seller_id
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
revoke all on function public.purchase_ready_made_design_with_wallet(text) from public;
grant execute on function public.purchase_ready_made_design_with_wallet(text) to authenticated;

-- Preview images may be viewed publicly; original design files remain private.
drop policy if exists ready_design_preview_files_public_read on storage.objects;
create policy ready_design_preview_files_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'project-files' and (storage.foldername(name))[1] = 'ready-design-previews');

drop policy if exists ready_design_preview_files_owner_insert on storage.objects;
create policy ready_design_preview_files_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = 'ready-design-previews' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists ready_design_preview_files_owner_delete on storage.objects;
create policy ready_design_preview_files_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'project-files' and (storage.foldername(name))[1] = 'ready-design-previews' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists ready_design_original_files_owner_insert on storage.objects;
create policy ready_design_original_files_owner_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = 'ready-designs' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists ready_design_original_files_entitled_read on storage.objects;
create policy ready_design_original_files_entitled_read on storage.objects
for select to authenticated
using (
  bucket_id = 'project-files'
  and (storage.foldername(name))[1] = 'ready-designs'
  and (
    (storage.foldername(name))[2] = auth.uid()::text
    or public.bytly_is_admin()
    or exists (
      select 1 from public.ready_made_design_assets a
      where a.design_files::text like '%' || objects.name || '%'
        and (
          a.created_by = (auth.jwt()->>'email')
          or exists (
            select 1 from public.design_purchase dp
            where dp.design_id = a.design_id
              and dp.buyer_email = (auth.jwt()->>'email')
              and dp.payment_status = 'completed'
          )
        )
    )
  )
);

drop policy if exists ready_design_original_files_owner_delete on storage.objects;
create policy ready_design_original_files_owner_delete on storage.objects
for delete to authenticated
using (bucket_id = 'project-files' and (storage.foldername(name))[1] = 'ready-designs' and (storage.foldername(name))[2] = auth.uid()::text);

grant select on public.ready_made_design to anon, authenticated;
grant insert, update, delete on public.ready_made_design to authenticated;
grant select on public.design_purchase to authenticated;
grant update on public.design_purchase to authenticated;
grant select, insert, update, delete on public.ready_made_design_assets to authenticated;

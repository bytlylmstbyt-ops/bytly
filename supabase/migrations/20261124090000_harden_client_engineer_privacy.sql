-- Security hardening: protect private client/provider records while preserving a safe public engineer directory.
-- Apply only after reviewing the matching frontend compatibility adapter in this branch.

begin;

-- Client records contain contact details, wallet balances and subscription information.
drop policy if exists clients_public_read on public.clients;
drop policy if exists clients_owner_select on public.clients;
create policy clients_owner_select
  on public.clients
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Registration inserts must be authenticated and tied to the signed-in account.
-- Never allow browser-supplied balances, trust scores, verification or subscriptions.
drop policy if exists public_registration_insert_clients on public.clients;
create policy public_registration_insert_clients
  on public.clients
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_real is true
    and coalesce(wallet_balance, 0) = 0
    and coalesce(trust_score, 0) = 0
    and coalesce(total_projects, 0) = 0
    and coalesce(subscription_type, 'none') = 'none'
    and coalesce(is_subscription_active, false) is false
    and coalesce(status, 'new') = 'new'
  );

-- Engineer records contain private contact, certificate and financial information.
drop policy if exists public_registration_insert_engineers on public.engineers;
create policy public_registration_insert_engineers
  on public.engineers
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_real is true
    and is_verified is false
    and status = 'pending'
    and coalesce(wallet_balance, 0) = 0
    and coalesce(rating, 0) = 0
    and coalesce(total_reviews, 0) = 0
    and coalesce(completed_projects, 0) = 0
    and coalesce(subscription_type, 'none') = 'none'
    and coalesce(is_subscription_active, false) is false
    and subscription_start_date is null
    and trial_end_date is null
  );

drop policy if exists engineers_public_read on public.engineers;
drop policy if exists engineers_owner_select on public.engineers;
create policy engineers_owner_select
  on public.engineers
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Public discovery is restricted to approved, verified, real profiles and excludes
-- email, phone, registration numbers, certificate URLs, wallet and subscription data.
create or replace view public.engineer_public_directory
with (security_barrier = true)
as
select
  id,
  full_name,
  city,
  country,
  specialization,
  bio,
  is_verified,
  status,
  rating,
  years_experience,
  completed_projects,
  profile_image,
  total_reviews,
  created_at
from public.engineers
where status = 'approved'
  and is_verified is true
  and is_real is true;

revoke all on public.engineer_public_directory from public;
grant select on public.engineer_public_directory to anon, authenticated;

-- Public clients are not a searchable directory; access is owner/admin only.
-- Keep admin access aligned with the roles already recognized by the application.
drop policy if exists clients_admin_select on public.clients;
create policy clients_admin_select
  on public.clients
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

drop policy if exists engineers_admin_select on public.engineers;
create policy engineers_admin_select
  on public.engineers
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

-- Prevent any authenticated user from generating or retrieving another user's invoice
-- by guessing a payment UUID. The payer, payee, or an administrator may create it.
create or replace function public.create_project_payment_invoice(p_payment_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  pay record;
  existing uuid;
  inv uuid;
  seller_type text;
  v_uid uuid := auth.uid();
  v_is_admin boolean := false;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into pay
  from public.project_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  v_is_admin := exists (
    select 1
    from public.profiles p
    where p.user_id = v_uid
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  );

  if not v_is_admin
     and v_uid is distinct from pay.payer_user_id
     and v_uid is distinct from pay.payee_user_id then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select id into existing
  from public.invoices
  where payment_id = pay.id
  limit 1;

  if existing is not null then
    return existing;
  end if;

  if pay.status not in ('paid', 'completed') then
    raise exception 'PAYMENT_NOT_SETTLED';
  end if;

  seller_type := case
    when pay.payee_user_id is null then 'other'
    else 'other'
  end;

  insert into public.invoices(
    project_id, contract_id, milestone_id, payment_id, invoice_type,
    issuer_user_id, issuer_type, buyer_user_id,
    service_description, line_items, subtotal, taxable_amount, vat_rate, vat_amount, total_amount,
    currency, status, paid_at, payment_reference, created_by, metadata
  )
  select pay.project_id, pay.contract_id, pay.milestone_id, pay.id, 'tax_invoice',
         pay.payee_user_id, seller_type, pay.payer_user_id,
         coalesce(pr.title, 'خدمة هندسية عبر بيتلي'),
         jsonb_build_array(jsonb_build_object(
           'description', coalesce(pr.title, 'خدمة المشروع'),
           'amount', pay.amount,
           'currency', pay.currency,
           'milestone_id', pay.milestone_id
         )),
         pay.amount, pay.amount, 0, 0, pay.amount,
         pay.currency, 'paid', coalesce(pay.paid_at, now()), pay.gateway_reference, v_uid,
         jsonb_build_object('source', 'project_payment', 'escrow_status', pay.escrow_status,
                            'platform_fee', pay.platform_fee, 'provider_amount', pay.provider_amount)
  from public.projects pr
  where pr.id = pay.project_id;

  select id into inv
  from public.invoices
  where payment_id = pay.id
  limit 1;

  if inv is null then
    raise exception 'INVOICE_CREATE_FAILED';
  end if;

  update public.project_payments
  set invoice_id = inv
  where id = pay.id;

  if pay.milestone_id is not null then
    update public.project_financial_milestones
    set invoice_id = inv
    where id = pay.milestone_id and invoice_id is null;
  end if;

  return inv;
end;
$function$;

revoke all on function public.create_project_payment_invoice(uuid) from public;
grant execute on function public.create_project_payment_invoice(uuid) to authenticated;

-- Public/anonymous clients must not be able to rewrite another user's pending registration.
drop policy if exists pending_registrations_public_update on public.pending_registrations;
drop policy if exists pending_registrations_admin_select on public.pending_registrations;
create policy pending_registrations_admin_select
  on public.pending_registrations
  for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

drop policy if exists pending_registrations_admin_update on public.pending_registrations;
create policy pending_registrations_admin_update
  on public.pending_registrations
  for update
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
      and lower(coalesce(p.role, '')) in ('admin', 'administrator', 'super_admin', 'owner')
  ));

commit;

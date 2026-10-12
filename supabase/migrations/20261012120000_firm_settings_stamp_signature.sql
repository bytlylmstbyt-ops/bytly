alter table public.engineering_firms
  add column if not exists official_stamp text,
  add column if not exists authorized_signature text;

drop policy if exists "engineering_firms_owner_update" on public.engineering_firms;
create policy "engineering_firms_owner_update"
on public.engineering_firms
for update
to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));

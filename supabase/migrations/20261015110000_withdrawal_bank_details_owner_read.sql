-- Permit each authenticated provider to read only their own bank-detail snapshot
-- for their withdrawal requests. Writes remain restricted to the SECURITY DEFINER RPC.
create policy withdrawal_bank_details_owner_select
on public.withdrawal_bank_details
for select
to authenticated
using (user_id = auth.uid());

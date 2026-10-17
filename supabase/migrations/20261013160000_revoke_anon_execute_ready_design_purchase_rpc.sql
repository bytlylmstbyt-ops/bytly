-- The wallet purchase RPC changes balances and creates completed purchase records.
-- It must never be callable by anon or inherited PUBLIC privileges.
revoke all on function public.purchase_ready_made_design_with_wallet(text) from public, anon;
grant execute on function public.purchase_ready_made_design_with_wallet(text) to authenticated;

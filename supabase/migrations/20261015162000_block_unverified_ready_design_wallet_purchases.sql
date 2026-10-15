-- Temporarily block ready-design wallet purchases until seller credit, platform commission,
-- paid-file access, atomic rollback, idempotency, and concurrency are verified.
-- This disables only the dedicated wallet-purchase RPC; it does not alter balances,
-- existing purchases, wallet recharge, project escrow, or other wallet operations.
revoke execute on function public.purchase_ready_made_design_with_wallet(text) from public, anon, authenticated;

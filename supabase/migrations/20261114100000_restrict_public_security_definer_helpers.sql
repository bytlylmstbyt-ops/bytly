-- Restrict SECURITY DEFINER helpers that do not need direct API execution.
-- bytly_is_admin remains executable by authenticated users because RLS policies call it.
revoke execute on function public.bytly_is_admin() from anon;

-- These functions are trigger-only helpers, not client-facing RPC endpoints.
revoke execute on function public.guard_design_purchase_financial_fields() from public, anon, authenticated;
revoke execute on function public.notify_admin_on_profile_registration() from public, anon, authenticated;
revoke execute on function public.notify_registration_and_welcome() from public, anon, authenticated;

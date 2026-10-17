-- Keep purchase creation and financial fields writable only by trusted database functions.
-- Buyers and sellers may update only review and modification-request fields allowed by RLS.
revoke insert, update, delete on table public.design_purchase from anon, authenticated, public;
grant update (
  has_modification_request,
  modification_notes,
  review_rating,
  review_comment,
  download_count,
  updated_date
) on table public.design_purchase to authenticated;

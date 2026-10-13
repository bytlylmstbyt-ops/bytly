-- Do not let participants manipulate the download counter.
-- Keep review and modification-request fields as the only participant-writable columns.
revoke update (download_count) on table public.design_purchase from authenticated;
grant update (
  has_modification_request,
  modification_notes,
  review_rating,
  review_comment
) on table public.design_purchase to authenticated;

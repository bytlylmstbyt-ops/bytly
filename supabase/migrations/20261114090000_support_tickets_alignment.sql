-- Align the support page with the existing Supabase support_tickets table.
alter table public.support_tickets
  add column if not exists category text,
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.support_tickets.category is 'User-selected support request category.';
comment on column public.support_tickets.attachments is 'Array of uploaded attachment URLs or storage references.';

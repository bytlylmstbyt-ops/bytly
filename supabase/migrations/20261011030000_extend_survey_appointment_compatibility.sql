-- Preserve fields used by the legacy survey appointment UI while the frontend migrates to Supabase.
alter table public.consultation_appointments
  add column if not exists request_id text,
  add column if not exists duration_minutes integer not null default 60,
  add column if not exists location text,
  add column if not exists client_name text,
  add column if not exists client_email text,
  add column if not exists google_event_id text;

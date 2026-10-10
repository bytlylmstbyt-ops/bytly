-- Per-user notification preferences used by the Supabase compatibility bridge.
-- This migration is additive; it does not import or delete legacy Base44 records.
create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_notifications boolean not null default true,
  in_app_notifications boolean not null default true,
  notification_preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

drop policy if exists "Users can read their own notification settings" on public.notification_settings;
create policy "Users can read their own notification settings"
  on public.notification_settings for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own notification settings" on public.notification_settings;
create policy "Users can insert their own notification settings"
  on public.notification_settings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notification settings" on public.notification_settings;
create policy "Users can update their own notification settings"
  on public.notification_settings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own notification settings" on public.notification_settings;
create policy "Users can delete their own notification settings"
  on public.notification_settings for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.notification_settings to authenticated;

-- Enable Realtime delivery for notification rows where the standard publication exists.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;

-- Defense in depth: notification settings are private to authenticated users.
revoke all privileges on table public.notification_settings from anon;
revoke all privileges on table public.notification_settings from public;
grant select, insert, update, delete on table public.notification_settings to authenticated;

-- Respect each administrator's in-app preference for login notifications.
create or replace function public.notify_admin_user_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_full_name text;
  v_role text;
  v_profile_id uuid;
  v_display_name text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select p.id, p.email, p.full_name, p.role
    into v_profile_id, v_email, v_full_name, v_role
  from public.profiles p
  where p.user_id = v_user_id
  limit 1;

  v_email := coalesce(v_email, auth.jwt() ->> 'email', 'بريد غير متاح');
  v_display_name := coalesce(nullif(btrim(v_full_name), ''), v_email);
  v_role := coalesce(nullif(btrim(v_role), ''), 'user');

  insert into public.notifications (user_id, type, title, body, entity_type, entity_id)
  select
    admin_profile.user_id,
    'user_login',
    'تسجيل دخول مستخدم',
    'دخل المستخدم ' || v_display_name || ' (' || v_email || ') — نوع الحساب: ' || v_role,
    case when v_profile_id is null then null else 'profile' end,
    v_profile_id
  from public.profiles admin_profile
  left join public.notification_settings admin_settings
    on admin_settings.user_id = admin_profile.user_id
  where lower(coalesce(admin_profile.role, '')) = 'admin'
    and admin_profile.user_id <> v_user_id
    and admin_profile.user_id is not null
    and coalesce(admin_settings.in_app_notifications, true)
    and coalesce(admin_settings.notification_preferences ->> 'user_login_alerts', 'true') <> 'false';
end;
$$;

revoke all on function public.notify_admin_user_login() from public;
revoke all on function public.notify_admin_user_login() from anon;
revoke all on function public.notify_admin_user_login() from authenticated;
grant execute on function public.notify_admin_user_login() to authenticated;

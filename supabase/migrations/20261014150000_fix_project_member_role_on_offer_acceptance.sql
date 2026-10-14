-- Acceptance trigger must provide the required project_members.role value.
create or replace function public.bytly_handle_offer_acceptance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status is distinct from 'accepted') then
    update public.project_offers
    set status = 'rejected', updated_at = now()
    where project_id = new.project_id
      and id <> new.id
      and status = 'pending';

    insert into public.project_members (project_id, user_id, role, status)
    values (new.project_id, new.engineer_user_id, 'engineer', 'active')
    on conflict (project_id, user_id) do update
      set role = excluded.role, status = 'active';

    update public.projects
    set lifecycle_status = 'assigned', updated_at = now()
    where id = new.project_id;
  end if;
  return new;
end;
$function$;

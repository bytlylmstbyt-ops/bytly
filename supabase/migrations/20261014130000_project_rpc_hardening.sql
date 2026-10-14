-- Keep the stage percentage field and project financial totals in source-controlled migration history.
alter table public.project_milestones
  add column if not exists percentage numeric(5,2) not null default 0;

CREATE OR REPLACE FUNCTION public.create_project_with_stages(p_project jsonb, p_milestones jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_client public.clients%rowtype;
  v_project public.projects%rowtype;
  v_stage jsonb;
  v_stage_row public.project_milestones%rowtype;
  v_financial public.project_financial_milestones%rowtype;
  v_sequence integer := 0;
  v_stage_amount numeric(14,2);
  v_commission_rate numeric(5,2) := 15;
  v_vat_rate numeric(5,2) := 15;
  v_commission numeric(14,2);
  v_vat numeric(14,2);
  v_customer_total numeric(14,2);
  v_stage_count integer;
  v_provider_user_id uuid;
  v_sum_percentage numeric;
  v_stages jsonb := '[]'::jsonb;
  v_project_base numeric(14,2);
  v_project_commission numeric(14,2);
  v_project_vat numeric(14,2);
  v_project_total numeric(14,2);
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_project) <> 'object' then raise exception 'INVALID_PROJECT'; end if;
  if jsonb_typeof(p_milestones) <> 'array' or jsonb_array_length(p_milestones) < 1 then raise exception 'AT_LEAST_ONE_STAGE_REQUIRED'; end if;
  v_stage_count := jsonb_array_length(p_milestones);
  if v_stage_count > 8 then raise exception 'TOO_MANY_STAGES'; end if;
  if nullif(trim(p_project->>'title'), '') is null then raise exception 'PROJECT_TITLE_REQUIRED'; end if;

  select * into v_client from public.clients where user_id = v_user_id limit 1 for update;
  if not found then raise exception 'CLIENT_PROFILE_REQUIRED'; end if;
  select coalesce(sum((value->>'percentage')::numeric),0) into v_sum_percentage from jsonb_array_elements(p_milestones);
  if abs(v_sum_percentage - 100) > 0.01 then raise exception 'STAGE_PERCENTAGES_MUST_TOTAL_100'; end if;

  if nullif(p_project->>'assigned_engineer_id','') is not null then
    select user_id into v_provider_user_id from public.engineers
    where id = (p_project->>'assigned_engineer_id')::uuid and user_id is not null limit 1;
    if v_provider_user_id is null then raise exception 'SELECTED_ENGINEER_ACCOUNT_NOT_LINKED'; end if;
  end if;

  insert into public.projects (
    title, description, category, project_type, service_scope, budget_min, budget_max,
    location, deadline, attachments, client_id, client_user_id, status, lifecycle_status,
    stage_count, total_proposals, is_direct_hire, assigned_engineer_id
  ) values (
    trim(p_project->>'title'), nullif(p_project->>'description',''), nullif(p_project->>'category',''),
    coalesce(nullif(p_project->>'project_type',''),'small'), coalesce(p_project->'service_scope','{}'::jsonb),
    nullif(p_project->>'budget_min','')::numeric, nullif(p_project->>'budget_max','')::numeric,
    nullif(p_project->>'location',''), nullif(p_project->>'deadline','')::date,
    coalesce(p_project->'attachments','[]'::jsonb), v_client.id::text, v_user_id,
    'open','published',v_stage_count,0,coalesce((p_project->>'is_direct_hire')::boolean,false),
    nullif(p_project->>'assigned_engineer_id','')::uuid
  ) returning * into v_project;

  for v_stage in select value from jsonb_array_elements(p_milestones) loop
    v_sequence := v_sequence + 1;
    v_stage_amount := round(coalesce(nullif(p_project->>'budget_max','')::numeric,nullif(p_project->>'budget_min','')::numeric,0) * coalesce((v_stage->>'percentage')::numeric,0) / 100,2);
    v_commission := round(v_stage_amount * v_commission_rate / 100,2);
    v_vat := round(v_stage_amount * v_vat_rate / 100,2);
    v_customer_total := v_stage_amount + v_vat;

    insert into public.project_milestones (
      project_id,title,description,amount,percentage,sequence_no,service_key,
      provider_user_id,provider_type,status,due_date,commission_amount,vat_rate,vat_amount,customer_total_amount
    ) values (
      v_project.id,coalesce(nullif(v_stage->>'title',''),'المرحلة '||v_sequence),
      nullif(v_stage->>'description',''),v_stage_amount,coalesce((v_stage->>'percentage')::numeric,0),v_sequence,
      nullif(v_stage->>'service_key',''),
      case when v_sequence=1 then v_provider_user_id else null end,
      case when v_sequence=1 and v_provider_user_id is not null then 'engineer' else null end,
      'pending',(current_date + make_interval(days => greatest(1,coalesce((v_stage->>'days')::integer,7))))::date,
      v_commission,v_vat_rate,v_vat,v_customer_total
    ) returning * into v_stage_row;

    insert into public.project_financial_milestones (
      project_id,milestone_id,sequence_no,title,gross_amount,platform_commission,allocations,
      escrow_status,release_status,vat_rate,vat_amount,customer_total_amount,commission_rate,commission_amount
    ) values (
      v_project.id,v_stage_row.id,v_sequence,v_stage_row.title,v_stage_amount,v_commission,'[]'::jsonb,
      'unfunded','pending',v_vat_rate,v_vat,v_customer_total,v_commission_rate,v_commission
    ) returning * into v_financial;

    if v_sequence=1 and v_provider_user_id is not null then
      insert into public.project_financial_participants (
        project_id,milestone_id,participant_user_id,participant_type,provider_type,service_key,
        role_label,allocation_type,allocation_value,priority,status
      ) values (
        v_project.id,v_financial.id,v_provider_user_id,'engineer','engineer',v_stage_row.service_key,
        'مقدم خدمة المرحلة','percentage',100,1,'active'
      );
    end if;

    v_stages := v_stages || jsonb_build_array(jsonb_build_object(
      'id',v_stage_row.id,'financial_milestone_id',v_financial.id,'sequence_no',v_stage_row.sequence_no,
      'title',v_stage_row.title,'amount',v_stage_row.amount,'percentage',v_stage_row.percentage,'status',v_stage_row.status
    ));
  end loop;

  select coalesce(sum(amount),0),coalesce(sum(commission_amount),0),
         coalesce(sum(vat_amount),0),coalesce(sum(customer_total_amount),0)
    into v_project_base,v_project_commission,v_project_vat,v_project_total
  from public.project_milestones where project_id=v_project.id;

  update public.projects set
    project_commission_rate=v_commission_rate,
    project_commission_amount=v_project_commission,
    project_taxable_amount=v_project_base,
    project_vat_amount=v_project_vat,
    project_customer_total=v_project_total,
    engineer_payment=greatest(v_project_base-v_project_commission,0),
    platform_commission=v_commission_rate,
    updated_at=now()
  where id=v_project.id returning * into v_project;

  update public.clients set total_projects=coalesce(total_projects,0)+1,updated_at=now() where id=v_client.id;
  return jsonb_build_object('project',to_jsonb(v_project),'milestones',v_stages);
end;
$function$
;

revoke all on function public.create_project_with_stages(jsonb,jsonb) from public, anon;
grant execute on function public.create_project_with_stages(jsonb,jsonb) to authenticated;

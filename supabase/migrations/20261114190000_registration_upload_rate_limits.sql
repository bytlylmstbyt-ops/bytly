-- Private, atomic rate-limit counters for anonymous registration upload URL issuance.
create table if not exists public.registration_upload_rate_limits (
  fingerprint_hash text primary key check (fingerprint_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.registration_upload_rate_limits enable row level security;
revoke all on table public.registration_upload_rate_limits from anon, authenticated;
grant all on table public.registration_upload_rate_limits to service_role;

create or replace function public.consume_registration_upload_rate_limit(
  p_fingerprint_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_blocked_until timestamptz;
begin
  if p_fingerprint_hash !~ '^[0-9a-f]{64}$'
     or p_limit < 1 or p_limit > 100
     or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit arguments';
  end if;

  insert into public.registration_upload_rate_limits as limits
    (fingerprint_hash, window_started_at, request_count, blocked_until, updated_at)
  values (p_fingerprint_hash, v_now, 1, null, v_now)
  on conflict (fingerprint_hash) do update
  set
    window_started_at = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
      else limits.request_count + 1
    end,
    blocked_until = case
      when limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then null
      when limits.blocked_until is not null then limits.blocked_until
      when limits.request_count + 1 > p_limit then v_now + make_interval(secs => p_window_seconds)
      else null
    end,
    updated_at = v_now
  returning request_count, blocked_until into v_count, v_blocked_until;

  return v_count <= p_limit and (v_blocked_until is null or v_blocked_until <= v_now);
end;
$$;

revoke all on function public.consume_registration_upload_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_registration_upload_rate_limit(text, integer, integer) to service_role;

comment on table public.registration_upload_rate_limits is
  'Private HMAC-keyed counters used only by the service role to rate-limit anonymous registration upload URL issuance.';

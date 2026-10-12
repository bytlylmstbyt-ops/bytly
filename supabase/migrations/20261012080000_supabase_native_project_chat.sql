-- Supabase-native chat metadata for the existing Bytly chat UI.
alter table public.conversations
  add column if not exists type text not null default 'direct',
  add column if not exists description text,
  add column if not exists is_archived boolean not null default false,
  add column if not exists is_main_room boolean not null default false,
  add column if not exists participants jsonb not null default '[]'::jsonb,
  add column if not exists participant_roles jsonb not null default '{}'::jsonb,
  add column if not exists last_message text,
  add column if not exists last_message_date timestamptz;

alter table public.messages
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists sender_email text,
  add column if not exists sender_name text,
  add column if not exists sender_role text not null default 'user',
  add column if not exists original_content text,
  add column if not exists has_sensitive_data boolean not null default false,
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists is_system_message boolean not null default false;

create index if not exists conversations_project_id_created_at_idx
  on public.conversations(project_id, created_at desc);
create index if not exists messages_conversation_id_created_at_idx
  on public.messages(conversation_id, created_at asc);

-- Ensure Realtime can deliver message changes; tolerate already-published tables.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;

-- Extend project task compatibility fields used by the Kanban editor.
alter table public.project_tasks
  add column if not exists comments jsonb not null default '[]'::jsonb,
  add column if not exists estimated_hours numeric;


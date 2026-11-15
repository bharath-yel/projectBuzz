-- Where a project stands for its owner: still going, finished, or set aside.
-- Separate from stage (idea / prototype / launched), which says how far it got.
create type public.project_status as enum ('active', 'completed', 'dropped');

alter table public.projects
  add column status public.project_status not null default 'active';

grant update (status) on public.projects to authenticated;

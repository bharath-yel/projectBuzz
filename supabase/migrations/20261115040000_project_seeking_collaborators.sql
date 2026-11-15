-- A simple on/off flag: the owner would welcome collaborators on this project.
-- Deliberately just a badge. No roles, listings or join requests.
alter table public.projects
  add column seeking_collaborators boolean not null default false;

grant update (seeking_collaborators) on public.projects to authenticated;

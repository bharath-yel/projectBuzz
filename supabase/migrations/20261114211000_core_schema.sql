-- ProjectBuzz core schema: tables, row level security, and the create_post RPC.
--
-- Access model
--   * Only signed-in users (role `authenticated`) can read or write anything.
--   * A project is `public` (any signed-in user can see it) or `private`
--     (only its owner and contributors can). Everything attached to a project
--     (members, tags, posts, attachments, reactions, comments) inherits that.
--   * Owners and contributors can edit a project and post to it.
--   * Users manage their own reactions, comments and follows.
--
-- Helper functions used by policies live in the `private` schema, which the
-- Data API does not expose. They are SECURITY DEFINER so a policy on one table
-- can look at another table without recursing through that table's policies.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Enums. Add a value later with: alter type public.<name> add value '<value>';
-- ---------------------------------------------------------------------------

create type public.project_stage as enum ('idea', 'prototype', 'launched');
create type public.project_visibility as enum ('public', 'private');
create type public.post_kind as enum ('ship', 'milestone');
create type public.attachment_type as enum ('photo', 'video', 'pdf', 'link', 'file');
create type public.tag_type as enum ('category', 'class', 'club');
create type public.reaction_type as enum ('kudos', 'use_this', 'can_help', 'tried_this');
create type public.follow_target_type as enum ('user', 'project', 'tag');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  gt_email text not null unique
    check (gt_email ~ '^[a-z0-9._%+-]+@gatech\.edu$'),
  name text not null default '' check (char_length(name) <= 80),
  major text check (char_length(major) <= 80),
  year text check (char_length(year) <= 20),
  bio text check (char_length(bio) <= 500),
  skills text[] not null default '{}' check (cardinality(skills) <= 30),
  avatar_url text,
  created_at timestamptz not null default now()
);
comment on table public.profiles is
  'One row per auth user, created by a trigger on auth.users. gatech.edu only.';

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  problem text check (char_length(problem) <= 2000),
  stage public.project_stage not null default 'idea',
  visibility public.project_visibility not null default 'public',
  cover_url text,
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_label text check (char_length(role_label) <= 60),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
comment on table public.project_members is
  'Contributors added by the project owner. The owner is not listed here.';

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  kind public.post_kind not null default 'ship',
  body text check (char_length(body) <= 5000),
  feedback_question text check (char_length(feedback_question) <= 300),
  created_at timestamptz not null default now()
);
comment on table public.posts is
  'Progress updates. Create them with create_post(): every post needs at least one attachment.';

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  type public.attachment_type not null,
  file_url text not null check (char_length(file_url) between 1 and 2048),
  preview_url text check (char_length(preview_url) <= 2048),
  meta jsonb not null default '{}' check (jsonb_typeof(meta) = 'object'),
  allow_download boolean not null default false,
  sort_order smallint not null default 0
);
comment on column public.attachments.file_url is
  'The original: an object path in the attachments bucket, or the external URL for a link.';
comment on column public.attachments.preview_url is
  'Preview image generated at upload time. The feed renders only this.';
comment on column public.attachments.sort_order is
  'Display order within the post, starting at 0.';

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  type public.tag_type not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (type, name)
);

create table public.project_tags (
  project_id uuid not null references public.projects (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (project_id, tag_id)
);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  type public.reaction_type not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, type)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  parent_id uuid,
  created_at timestamptz not null default now(),
  unique (id, post_id),
  -- A reply must be on the same post as the comment it replies to.
  foreign key (parent_id, post_id)
    references public.comments (id, post_id) on delete cascade
);

create table public.follows (
  follower_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  target_type public.follow_target_type not null,
  target_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, target_type, target_id)
);
comment on column public.follows.target_id is
  'profiles.id, projects.id or tags.id depending on target_type. Rows are removed by trigger when the target is deleted.';

create table public.streak_pauses (
  week_start date primary key check (extract(isodow from week_start) = 1),
  reason text not null
);
comment on table public.streak_pauses is
  'Weeks (identified by their Monday, America/New_York) that do not count against anyone''s streak.';

create table public.streak_freezes (
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  created_at timestamptz not null default now(),
  primary key (user_id, week_start)
);
comment on table public.streak_freezes is
  'A user''s freeze for one week (its Monday). At most 2 per user per semester, enforced by trigger.';

-- ---------------------------------------------------------------------------
-- Indexes (foreign keys and the main feed orderings)
-- ---------------------------------------------------------------------------

create index projects_owner_id_idx on public.projects (owner_id);
create index projects_created_at_idx on public.projects (created_at desc);
create index project_members_user_id_idx on public.project_members (user_id);
create index posts_project_id_created_at_idx on public.posts (project_id, created_at desc);
create index posts_author_id_created_at_idx on public.posts (author_id, created_at desc);
create index posts_created_at_idx on public.posts (created_at desc);
create index attachments_post_id_idx on public.attachments (post_id, sort_order);
create index project_tags_tag_id_idx on public.project_tags (tag_id);
create index reactions_user_id_idx on public.reactions (user_id);
create index comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index comments_parent_id_idx on public.comments (parent_id);
create index comments_author_id_idx on public.comments (author_id);
create index follows_target_idx on public.follows (target_type, target_id);

-- ---------------------------------------------------------------------------
-- Access helpers used by policies
-- ---------------------------------------------------------------------------

create function private.is_project_owner(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = (select auth.uid())
  );
$$;

create function private.is_project_member(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p_project_id and m.user_id = (select auth.uid())
  );
$$;

-- Owner or contributor.
create function private.can_edit_project(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_project_owner(p_project_id)
      or private.is_project_member(p_project_id);
$$;

-- Public project, or the caller is its owner or a contributor.
create function private.can_view_project(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and (
        p.visibility = 'public'
        or p.owner_id = (select auth.uid())
        or private.is_project_member(p.id)
      )
  );
$$;

create function private.can_view_post(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.posts po
    where po.id = p_post_id and private.can_view_project(po.project_id)
  );
$$;

create function private.is_post_author(p_post_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.posts po
    where po.id = p_post_id and po.author_id = (select auth.uid())
  );
$$;

-- A follow must point at something that exists and that the caller can see.
create function private.can_follow(p_type public.follow_target_type, p_target_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case p_type
    when 'user' then p_target_id <> (select auth.uid())
      and exists (select 1 from public.profiles where id = p_target_id)
    when 'project' then private.can_view_project(p_target_id)
    when 'tag' then exists (select 1 from public.tags where id = p_target_id)
  end;
$$;

-- Jan-May is spring, Jun-Jul is summer, Aug-Dec is fall.
create function private.semester_key(p_day date)
returns text
language sql immutable set search_path = ''
as $$
  select extract(year from p_day)::int::text || '-' ||
    case
      when extract(month from p_day) <= 5 then 'spring'
      when extract(month from p_day) <= 7 then 'summer'
      else 'fall'
    end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Signup: only @gatech.edu addresses, and every auth user gets a profile.
-- Raising here aborts the insert into auth.users, so the signup itself fails.
create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_email text := lower(new.email);
begin
  if v_email is null or v_email !~ '^[a-z0-9._%+-]+@gatech\.edu$' then
    raise exception 'Only @gatech.edu email addresses can sign up.'
      using errcode = 'check_violation';
  end if;

  insert into public.profiles (id, gt_email, name)
  values (
    new.id,
    v_email,
    left(
      coalesce(
        nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
        split_part(v_email, '@', 1)
      ),
      80
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Keep profiles.gt_email in step with auth. The check constraint on
-- profiles.gt_email rejects a change to a non-gatech.edu address.
create function private.handle_user_email_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.profiles set gt_email = lower(new.email) where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.handle_user_email_change();

-- Contributors can edit a project, but only the owner can change who sees it.
create function private.guard_project_visibility()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.visibility is distinct from old.visibility
     and (select auth.uid()) is not null
     and (select auth.uid()) <> old.owner_id then
    raise exception 'Only the project owner can change its visibility.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger projects_guard_visibility
  before update of visibility on public.projects
  for each row execute function private.guard_project_visibility();

-- Every post has at least one attachment. Checked at commit, so a post and
-- its attachments must be written in one transaction: use create_post().
create function private.enforce_post_has_attachment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_post_id uuid;
begin
  if tg_table_name = 'posts' then
    v_post_id := new.id;
  else
    v_post_id := old.post_id;
  end if;

  if exists (select 1 from public.posts where id = v_post_id)
     and not exists (select 1 from public.attachments where post_id = v_post_id) then
    raise exception 'A post needs at least one attachment.'
      using errcode = 'check_violation',
            hint = 'Create posts with the create_post() function.';
  end if;
  return null;
end;
$$;

create constraint trigger posts_require_attachment
  after insert on public.posts
  deferrable initially deferred
  for each row execute function private.enforce_post_has_attachment();

create constraint trigger attachments_keep_at_least_one
  after delete on public.attachments
  deferrable initially deferred
  for each row execute function private.enforce_post_has_attachment();

-- follows.target_id has no foreign key (it points at three tables), so clean
-- up by trigger. The target type is passed as the trigger argument.
create function private.delete_follows_for_target()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.follows
  where target_type = tg_argv[0]::public.follow_target_type
    and target_id = old.id;
  return old;
end;
$$;

create trigger profiles_delete_follows
  after delete on public.profiles
  for each row execute function private.delete_follows_for_target('user');

create trigger projects_delete_follows
  after delete on public.projects
  for each row execute function private.delete_follows_for_target('project');

create trigger tags_delete_follows
  after delete on public.tags
  for each row execute function private.delete_follows_for_target('tag');

-- Each user gets 2 streak freezes per semester.
create function private.enforce_streak_freeze_limit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- Serialize a user's freeze inserts so two requests cannot both pass the count.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  if (
    select count(*) from public.streak_freezes f
    where f.user_id = new.user_id
      and private.semester_key(f.week_start) = private.semester_key(new.week_start)
  ) >= 2 then
    raise exception 'You have used both streak freezes for this semester.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger streak_freezes_limit
  before insert on public.streak_freezes
  for each row execute function private.enforce_streak_freeze_limit();

-- ---------------------------------------------------------------------------
-- Privileges. Start from nothing, then grant exactly what each policy needs.
-- Column lists keep ids, owners and timestamps out of client hands (a
-- backdated created_at would fake a streak).
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on
  public.profiles, public.projects, public.project_members, public.posts,
  public.attachments, public.tags, public.project_tags, public.reactions,
  public.comments, public.follows, public.streak_pauses, public.streak_freezes
to authenticated;

-- Profiles are created by trigger; users edit their own details.
grant update (name, major, year, bio, skills, avatar_url)
  on public.profiles to authenticated;

grant insert (id, owner_id, title, problem, stage, visibility, cover_url)
  on public.projects to authenticated;
grant update (title, problem, stage, visibility, cover_url)
  on public.projects to authenticated;
grant delete on public.projects to authenticated;

grant insert (project_id, user_id, role_label) on public.project_members to authenticated;
grant update (role_label) on public.project_members to authenticated;
grant delete on public.project_members to authenticated;

grant insert (id, project_id, author_id, kind, body, feedback_question)
  on public.posts to authenticated;
grant update (kind, body, feedback_question) on public.posts to authenticated;
grant delete on public.posts to authenticated;

grant insert (id, post_id, type, file_url, preview_url, meta, allow_download, sort_order)
  on public.attachments to authenticated;
grant update (preview_url, meta, allow_download, sort_order)
  on public.attachments to authenticated;
grant delete on public.attachments to authenticated;

grant insert (project_id, tag_id) on public.project_tags to authenticated;
grant delete on public.project_tags to authenticated;

grant insert (post_id, user_id, type) on public.reactions to authenticated;
grant delete on public.reactions to authenticated;

grant insert (id, post_id, author_id, body, parent_id) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

grant insert (follower_id, target_type, target_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

grant insert (user_id, week_start) on public.streak_freezes to authenticated;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.posts enable row level security;
alter table public.attachments enable row level security;
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;
alter table public.reactions enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.streak_pauses enable row level security;
alter table public.streak_freezes enable row level security;

-- profiles
create policy "Signed-in users can view profiles"
  on public.profiles for select to authenticated
  using (true);

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- projects
create policy "View public projects and your own"
  on public.projects for select to authenticated
  using (
    visibility = 'public'
    or owner_id = (select auth.uid())
    or private.is_project_member(id)
  );

create policy "Users create projects they own"
  on public.projects for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Owners and contributors edit projects"
  on public.projects for update to authenticated
  using (owner_id = (select auth.uid()) or private.is_project_member(id))
  with check (owner_id = (select auth.uid()) or private.is_project_member(id));

create policy "Owners delete their projects"
  on public.projects for delete to authenticated
  using (owner_id = (select auth.uid()));

-- project_members
create policy "View contributors of visible projects"
  on public.project_members for select to authenticated
  using (private.can_view_project(project_id));

create policy "Owners add contributors"
  on public.project_members for insert to authenticated
  with check (
    private.is_project_owner(project_id)
    and user_id <> (select auth.uid())
  );

create policy "Owners edit contributor labels"
  on public.project_members for update to authenticated
  using (private.is_project_owner(project_id))
  with check (private.is_project_owner(project_id));

create policy "Owners remove contributors, contributors can leave"
  on public.project_members for delete to authenticated
  using (
    private.is_project_owner(project_id)
    or user_id = (select auth.uid())
  );

-- posts
create policy "View posts of visible projects"
  on public.posts for select to authenticated
  using (private.can_view_project(project_id));

create policy "Owners and contributors post to a project"
  on public.posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.can_edit_project(project_id)
  );

create policy "Authors edit their posts"
  on public.posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Authors and project owners delete posts"
  on public.posts for delete to authenticated
  using (
    author_id = (select auth.uid())
    or private.is_project_owner(project_id)
  );

-- attachments
create policy "View attachments of visible posts"
  on public.attachments for select to authenticated
  using (private.can_view_post(post_id));

create policy "Authors add attachments to their posts"
  on public.attachments for insert to authenticated
  with check (private.is_post_author(post_id));

create policy "Authors edit their attachments"
  on public.attachments for update to authenticated
  using (private.is_post_author(post_id))
  with check (private.is_post_author(post_id));

create policy "Authors delete their attachments"
  on public.attachments for delete to authenticated
  using (private.is_post_author(post_id));

-- tags (reference data, managed by migrations and seed)
create policy "Signed-in users can view tags"
  on public.tags for select to authenticated
  using (true);

-- project_tags
create policy "View tags of visible projects"
  on public.project_tags for select to authenticated
  using (private.can_view_project(project_id));

create policy "Owners and contributors tag projects"
  on public.project_tags for insert to authenticated
  with check (private.can_edit_project(project_id));

create policy "Owners and contributors untag projects"
  on public.project_tags for delete to authenticated
  using (private.can_edit_project(project_id));

-- reactions
create policy "View reactions on visible posts"
  on public.reactions for select to authenticated
  using (private.can_view_post(post_id));

create policy "Users react as themselves to posts they can see"
  on public.reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.can_view_post(post_id)
  );

create policy "Users remove their own reactions"
  on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- comments
create policy "View comments on visible posts"
  on public.comments for select to authenticated
  using (private.can_view_post(post_id));

create policy "Users comment as themselves on posts they can see"
  on public.comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and private.can_view_post(post_id)
  );

create policy "Users edit their own comments"
  on public.comments for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Users delete their own comments"
  on public.comments for delete to authenticated
  using (author_id = (select auth.uid()));

-- follows
create policy "Signed-in users can view follows"
  on public.follows for select to authenticated
  using (true);

create policy "Users follow as themselves"
  on public.follows for insert to authenticated
  with check (
    follower_id = (select auth.uid())
    and private.can_follow(target_type, target_id)
  );

create policy "Users unfollow as themselves"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- streak_pauses (reference data)
create policy "Signed-in users can view streak pauses"
  on public.streak_pauses for select to authenticated
  using (true);

-- streak_freezes
create policy "Users view their own streak freezes"
  on public.streak_freezes for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users freeze their own streak"
  on public.streak_freezes for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- create_post: the one way to create a post. Writes the post and its
-- attachments in a single transaction, so the "at least one attachment" rule
-- always holds. Runs as the caller, so every policy above still applies.
--
-- p_attachments is a JSON array, in display order, of objects:
--   { "type": "photo" | "video" | "pdf" | "link" | "file",
--     "file_url": text, "preview_url": text?, "meta": object?,
--     "allow_download": boolean? }
-- ---------------------------------------------------------------------------

create function public.create_post(
  p_project_id uuid,
  p_attachments jsonb,
  p_kind public.post_kind default 'ship',
  p_body text default null,
  p_feedback_question text default null
)
returns public.posts
language plpgsql security invoker set search_path = ''
as $$
declare
  v_post public.posts;
begin
  if (select auth.uid()) is null then
    raise exception 'You must be signed in to post.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_attachments is null
     or jsonb_typeof(p_attachments) <> 'array'
     or jsonb_array_length(p_attachments) = 0 then
    raise exception 'A post needs at least one attachment.'
      using errcode = 'check_violation';
  end if;

  if jsonb_array_length(p_attachments) > 10 then
    raise exception 'A post can have at most 10 attachments.'
      using errcode = 'check_violation';
  end if;

  if not private.can_edit_project(p_project_id) then
    raise exception 'You can only post to projects you own or contribute to.'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.posts (project_id, author_id, kind, body, feedback_question)
  values (
    p_project_id,
    (select auth.uid()),
    coalesce(p_kind, 'ship'),
    nullif(btrim(p_body), ''),
    nullif(btrim(p_feedback_question), '')
  )
  returning * into v_post;

  insert into public.attachments
    (post_id, type, file_url, preview_url, meta, allow_download, sort_order)
  select
    v_post.id,
    (a.item ->> 'type')::public.attachment_type,
    a.item ->> 'file_url',
    a.item ->> 'preview_url',
    coalesce(nullif(a.item -> 'meta', 'null'::jsonb), '{}'::jsonb),
    coalesce((a.item ->> 'allow_download')::boolean, false),
    (a.ord - 1)::smallint
  from jsonb_array_elements(p_attachments) with ordinality as a(item, ord);

  return v_post;
end;
$$;

revoke all on function public.create_post(uuid, jsonb, public.post_kind, text, text)
  from public, anon;
grant execute on function public.create_post(uuid, jsonb, public.post_kind, text, text)
  to authenticated;

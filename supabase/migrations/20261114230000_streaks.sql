-- Weekly streaks, computed from posts. Nothing here stores a counter.
--
-- Rules
--   * A week runs Monday to Sunday in America/New_York and is identified by
--     its Monday.
--   * A week is "active" if it has at least one post.
--   * A streak is the run of active weeks ending at the current week.
--   * The current week is in progress: with no post yet it adds nothing, but
--     it does not break the streak either.
--   * Skipped weeks (streak_pauses, and the user's streak_freezes) neither add
--     to a streak nor break it. A post in a skipped week still counts.
--   * Personal streak: any post by the user, skipping their own freezes.
--   * Project streak: any post in the project, skipping the owner's freezes.

-- The Monday of the New York week containing a moment.
create function private.week_start(p_at timestamptz)
returns date
language sql stable set search_path = ''
as $$
  select date_trunc('week', p_at at time zone 'America/New_York')::date;
$$;

create function private.today_ny()
returns date
language sql stable set search_path = ''
as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- The streak rule itself, as a pure function of its inputs so it can be
-- tested without any tables.
create function private.streak_length(
  p_active_weeks date[],
  p_skipped_weeks date[],
  p_today date
)
returns integer
language plpgsql immutable set search_path = ''
as $$
declare
  v_week date := date_trunc('week', p_today)::date;
  v_first date;
  v_count integer := 0;
begin
  select min(w) into v_first from unnest(p_active_weeks) as w;
  if v_first is null then
    return 0;
  end if;

  -- The current week counts if it has a post; otherwise it is still open.
  if v_week = any (p_active_weeks) then
    v_count := 1;
  end if;

  v_week := v_week - 7;
  while v_week >= v_first loop
    if v_week = any (p_active_weeks) then
      v_count := v_count + 1;
    elsif not (v_week = any (coalesce(p_skipped_weeks, '{}'))) then
      exit; -- a gap: the streak ends here
    end if;
    v_week := v_week - 7;
  end loop;

  return v_count;
end;
$$;

-- Personal streak as of a given day.
create function private.user_streak_at(p_user_id uuid, p_today date)
returns integer
language sql stable security definer set search_path = ''
as $$
  select private.streak_length(
    array(
      select distinct private.week_start(created_at)
      from public.posts where author_id = p_user_id
    ),
    array(
      select week_start from public.streak_pauses
      union
      select week_start from public.streak_freezes where user_id = p_user_id
    ),
    p_today
  );
$$;

-- Project streak as of a given day.
create function private.project_streak_at(p_project_id uuid, p_today date)
returns integer
language sql stable security definer set search_path = ''
as $$
  select private.streak_length(
    array(
      select distinct private.week_start(created_at)
      from public.posts where project_id = p_project_id
    ),
    array(
      select week_start from public.streak_pauses
      union
      select f.week_start
      from public.streak_freezes f
      join public.projects p on p.owner_id = f.user_id
      where p.id = p_project_id
    ),
    p_today
  );
$$;

-- ---------------------------------------------------------------------------
-- Public API. SECURITY DEFINER because a streak counts every post, including
-- ones in private projects the viewer cannot read; only the number is exposed.
-- ---------------------------------------------------------------------------

create function public.user_streak(p_user_id uuid)
returns integer
language sql stable security definer set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then null
    else private.user_streak_at(p_user_id, private.today_ny())
  end;
$$;

-- Streaks for several projects at once (for grids of project cards).
-- Projects the caller cannot see are left out.
create function public.project_streaks(p_project_ids uuid[])
returns table (project_id uuid, streak integer)
language sql stable security definer set search_path = ''
as $$
  select p.id, private.project_streak_at(p.id, private.today_ny())
  from public.projects p
  where p.id = any (p_project_ids)
    and private.can_view_project(p.id);
$$;

-- One row per week for the contribution grid, oldest first, ending with the
-- current week.
create function public.user_activity_weeks(p_user_id uuid, p_weeks integer default 26)
returns table (week_start date, post_count integer, paused boolean, frozen boolean)
language sql stable security definer set search_path = ''
as $$
  with weeks as (
    select (private.week_start(now()) - (n * 7))::date as week_start
    from generate_series(0, least(greatest(coalesce(p_weeks, 26), 1), 104) - 1) as n
  ),
  posted as (
    select private.week_start(created_at) as week_start, count(*)::integer as post_count
    from public.posts
    where author_id = p_user_id
    group by 1
  )
  select
    w.week_start,
    coalesce(p.post_count, 0),
    exists (select 1 from public.streak_pauses sp where sp.week_start = w.week_start),
    exists (
      select 1 from public.streak_freezes sf
      where sf.user_id = p_user_id and sf.week_start = w.week_start
    )
  from weeks w
  left join posted p on p.week_start = w.week_start
  where (select auth.uid()) is not null
  order by w.week_start;
$$;

-- The week a freeze would apply to: last week if it was missed, otherwise
-- the current week if it has no post yet. Null if neither needs one.
create function private.freezable_week(p_user_id uuid, p_today date)
returns date
language sql stable security definer set search_path = ''
as $$
  select w
  from unnest(array[
    date_trunc('week', p_today)::date - 7,
    date_trunc('week', p_today)::date
  ]) with ordinality as candidate(w, ord)
  where not exists (
      select 1 from public.posts
      where author_id = p_user_id and private.week_start(created_at) = w
    )
    and not exists (select 1 from public.streak_pauses where week_start = w)
    and not exists (
      select 1 from public.streak_freezes where user_id = p_user_id and week_start = w
    )
  order by ord
  limit 1;
$$;

-- The caller's own streak, how many freezes they have left this semester,
-- and which week a freeze would cover right now.
create function public.my_streak_status()
returns table (streak integer, freezes_left integer, freezable_week date)
language sql stable security definer set search_path = ''
as $$
  select
    private.user_streak_at(u.id, t.today),
    greatest(0, 2 - (
      select count(*)::integer from public.streak_freezes f
      where f.user_id = u.id
        and private.semester_key(f.week_start) = private.semester_key(t.today)
    )),
    private.freezable_week(u.id, t.today)
  from (select (select auth.uid()) as id) u,
       (select private.today_ny() as today) t
  where u.id is not null;
$$;

-- Spend a freeze on the week it applies to. The 2-per-semester limit is
-- enforced by the trigger on streak_freezes.
create function public.use_streak_freeze()
returns date
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_week date;
begin
  if v_user is null then
    raise exception 'You must be signed in.' using errcode = 'insufficient_privilege';
  end if;

  v_week := private.freezable_week(v_user, private.today_ny());
  if v_week is null then
    raise exception 'There is no week to freeze right now.' using errcode = 'check_violation';
  end if;

  insert into public.streak_freezes (user_id, week_start) values (v_user, v_week);
  return v_week;
end;
$$;

revoke all on function
  public.user_streak(uuid),
  public.project_streaks(uuid[]),
  public.user_activity_weeks(uuid, integer),
  public.my_streak_status(),
  public.use_streak_freeze()
from public, anon;

grant execute on function
  public.user_streak(uuid),
  public.project_streaks(uuid[]),
  public.user_activity_weeks(uuid, integer),
  public.my_streak_status(),
  public.use_streak_freeze()
to authenticated;

revoke all on function
  private.week_start(timestamptz),
  private.today_ny(),
  private.streak_length(date[], date[], date),
  private.user_streak_at(uuid, date),
  private.project_streak_at(uuid, date),
  private.freezable_week(uuid, date)
from public, anon;

-- Streak test cases. Plain SQL: every check is an ASSERT, and the whole file
-- runs in one transaction that is rolled back, so it leaves nothing behind.
--
-- Run against a local database:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/streaks.test.sql
-- It prints "streak tests passed" at the end, or stops at the first failure.
--
-- All dates below are Mondays unless noted. "Today" is passed in explicitly,
-- so the results never depend on when the tests run.
--   2026-10-05, 10-12, 10-19, 10-26, 11-02, 11-09 are consecutive Mondays.
--   2026-11-23 (Thanksgiving) is a seeded pause in real data; the tests add
--   their own pauses so they do not depend on the seed.

begin;

-- ---------------------------------------------------------------------------
-- 1. The rule itself: private.streak_length(active weeks, skipped weeks, today)
-- ---------------------------------------------------------------------------
do $$
declare
  n integer;
begin
  -- No posts at all.
  n := private.streak_length('{}', '{}', '2026-11-11');
  assert n = 0, format('no posts: expected 0, got %s', n);

  -- One post this week.
  n := private.streak_length('{2026-11-09}', '{}', '2026-11-11');
  assert n = 1, format('post this week: expected 1, got %s', n);

  -- Three consecutive weeks including this one. Today is a Sunday: still this week.
  n := private.streak_length('{2026-10-26,2026-11-02,2026-11-09}', '{}', '2026-11-15');
  assert n = 3, format('three weeks, Sunday: expected 3, got %s', n);

  -- Current week in progress: no post yet this week does not break the streak.
  n := private.streak_length('{2026-10-26,2026-11-02}', '{}', '2026-11-11');
  assert n = 2, format('in-progress week: expected 2, got %s', n);

  -- ...but it does not add to it either (Monday morning, nothing posted).
  n := private.streak_length('{2026-11-02}', '{}', '2026-11-09');
  assert n = 1, format('Monday, nothing yet: expected 1, got %s', n);

  -- GAP: missed last week entirely. The streak is gone, whatever came before.
  n := private.streak_length('{2026-10-12,2026-10-19,2026-10-26}', '{}', '2026-11-11');
  assert n = 0, format('gap last week: expected 0, got %s', n);

  -- GAP: a missed week in the middle cuts off everything older.
  n := private.streak_length('{2026-10-05,2026-10-12,2026-10-26,2026-11-02,2026-11-09}', '{}', '2026-11-11');
  assert n = 3, format('gap in the middle: expected 3, got %s', n);

  -- GAP then a fresh start this week.
  n := private.streak_length('{2026-10-05,2026-10-12,2026-11-09}', '{}', '2026-11-11');
  assert n = 1, format('restart after gap: expected 1, got %s', n);

  -- PAUSE: a paused week with no post is bridged and not counted.
  n := private.streak_length('{2026-10-19,2026-11-02,2026-11-09}', '{2026-10-26}', '2026-11-11');
  assert n = 3, format('pause bridged: expected 3, got %s', n);

  -- PAUSE: several paused weeks in a row (winter break) are all bridged.
  n := private.streak_length('{2026-10-05,2026-11-09}', '{2026-10-12,2026-10-19,2026-10-26,2026-11-02}', '2026-11-11');
  assert n = 2, format('long pause bridged: expected 2, got %s', n);

  -- PAUSE: posting during a paused week still counts.
  n := private.streak_length('{2026-10-19,2026-10-26,2026-11-02}', '{2026-10-26}', '2026-11-04');
  assert n = 3, format('post in paused week counts: expected 3, got %s', n);

  -- PAUSE: last week paused, nothing posted this week yet.
  n := private.streak_length('{2026-10-19,2026-10-26}', '{2026-11-02}', '2026-11-11');
  assert n = 2, format('last week paused: expected 2, got %s', n);

  -- PAUSE does not rescue a real gap next to it.
  n := private.streak_length('{2026-10-12,2026-11-09}', '{2026-10-26}', '2026-11-11');
  assert n = 1, format('gap beside a pause: expected 1, got %s', n);

  -- FREEZE: behaves like a pause for the weeks it covers.
  n := private.streak_length('{2026-10-19,2026-10-26}', '{2026-11-02}', '2026-11-13');
  assert n = 2, format('frozen last week: expected 2, got %s', n);

  -- FREEZE and PAUSE back to back.
  n := private.streak_length('{2026-10-12,2026-11-09}', '{2026-10-19,2026-10-26,2026-11-02}', '2026-11-11');
  assert n = 2, format('freeze + pause: expected 2, got %s', n);

  -- Skipped weeks older than the first post are irrelevant.
  n := private.streak_length('{2026-11-02,2026-11-09}', '{2026-09-28,2026-10-05}', '2026-11-11');
  assert n = 2, format('old skipped weeks: expected 2, got %s', n);

  -- A null skipped list is treated as empty.
  n := private.streak_length('{2026-11-02,2026-11-09}', null, '2026-11-11');
  assert n = 2, format('null skipped: expected 2, got %s', n);
end $$;

-- ---------------------------------------------------------------------------
-- 2. Week boundaries are New York time, Monday to Sunday.
-- ---------------------------------------------------------------------------
do $$
begin
  -- Sunday 11:30 pm in New York is already Monday in UTC: still the old week.
  assert private.week_start('2026-11-09 04:30:00+00') = '2026-11-02',
    'Sunday night New York must belong to the week that is ending';
  -- Monday 12:30 am New York: the new week.
  assert private.week_start('2026-11-09 05:30:00+00') = '2026-11-09',
    'Monday just after midnight New York must start the new week';
  -- A Wednesday.
  assert private.week_start('2026-11-11 17:00:00+00') = '2026-11-09', 'midweek';
  -- Across the daylight saving change (Nov 1, 2026): Sunday 11:30 pm EST.
  assert private.week_start('2026-11-02 04:30:00+00') = '2026-10-26', 'DST: Sunday night';
  assert private.week_start('2026-11-02 05:30:00+00') = '2026-11-02', 'DST: Monday morning';
end $$;

-- ---------------------------------------------------------------------------
-- 3. Against real tables: personal streaks, project streaks, pauses, freezes.
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('a0000000-0000-4000-8000-000000000001', 'streak-owner@gatech.edu'),
  ('a0000000-0000-4000-8000-000000000002', 'streak-helper@gatech.edu');

insert into public.projects (id, owner_id, title) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Streak test project'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Quiet project');

insert into public.project_members (project_id, user_id) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002');

-- Remove seeded pauses so only the ones added below apply.
delete from public.streak_pauses;

-- Owner posts in the weeks of Oct 12 and Oct 19 (two posts that week), then
-- nothing in the week of Oct 26, then the week of Nov 2.
-- Helper posts to the same project in the week of Oct 26 only.
-- (Attachments are skipped: the transaction is rolled back before that
--  rule is checked at commit.)
insert into public.posts (project_id, author_id, created_at) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-10-14 15:00-04'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-10-20 15:00-04'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-10-23 15:00-04'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', '2026-10-28 15:00-04'),
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '2026-11-04 15:00-05');

do $$
declare
  owner uuid := 'a0000000-0000-4000-8000-000000000001';
  helper uuid := 'a0000000-0000-4000-8000-000000000002';
  project uuid := 'b0000000-0000-4000-8000-000000000001';
  quiet uuid := 'b0000000-0000-4000-8000-000000000002';
  today date := '2026-11-11'; -- Wednesday of the week of Nov 9; nobody has posted yet
  n integer;
begin
  -- GAP: the owner missed the week of Oct 26, so only Nov 2 counts.
  n := private.user_streak_at(owner, today);
  assert n = 1, format('owner personal, gap: expected 1, got %s', n);

  -- The project had a post every week from Oct 12 to Nov 2 (the helper covered Oct 26).
  n := private.project_streak_at(project, today);
  assert n = 4, format('project, covered by contributor: expected 4, got %s', n);

  -- The helper posted once, two weeks ago, and missed last week.
  n := private.user_streak_at(helper, today);
  assert n = 0, format('helper personal: expected 0, got %s', n);

  -- A project with no posts.
  n := private.project_streak_at(quiet, today);
  assert n = 0, format('quiet project: expected 0, got %s', n);

  -- PAUSE: pausing the week of Oct 26 bridges the owner's gap.
  insert into public.streak_pauses values ('2026-10-26', 'test pause');
  n := private.user_streak_at(owner, today);
  assert n = 3, format('owner personal, pause bridges gap: expected 3, got %s', n);
  -- The project already had a post that week; the pause changes nothing.
  n := private.project_streak_at(project, today);
  assert n = 4, format('project with pause: expected 4, got %s', n);
  delete from public.streak_pauses;

  -- FREEZE: the owner freezing the week of Oct 26 bridges it the same way...
  insert into public.streak_freezes (user_id, week_start) values (owner, '2026-10-26');
  n := private.user_streak_at(owner, today);
  assert n = 3, format('owner personal, freeze bridges gap: expected 3, got %s', n);
  -- ...but one person's freeze does nothing for someone else.
  n := private.user_streak_at(helper, today);
  assert n = 0, format('helper unaffected by owner freeze: expected 0, got %s', n);
  delete from public.streak_freezes;

  -- FREEZE: the helper freezes last week (Nov 2) and keeps the Oct 26 week alive.
  insert into public.streak_freezes (user_id, week_start) values (helper, '2026-11-02');
  n := private.user_streak_at(helper, today);
  assert n = 1, format('helper freezes last week: expected 1, got %s', n);
  delete from public.streak_freezes;

  -- Later the same week, a post lands: the current week now counts.
  insert into public.posts (project_id, author_id, created_at)
  values (project, owner, '2026-11-12 10:00-05');
  n := private.user_streak_at(owner, '2026-11-12');
  assert n = 2, format('owner after posting this week: expected 2, got %s', n);
  n := private.project_streak_at(project, '2026-11-12');
  assert n = 5, format('project after posting this week: expected 5, got %s', n);

  -- Two weeks on with nothing new: both streaks are over.
  n := private.user_streak_at(owner, '2026-11-25');
  assert n = 0, format('owner two weeks later: expected 0, got %s', n);
  n := private.project_streak_at(project, '2026-11-25');
  assert n = 0, format('project two weeks later: expected 0, got %s', n);

  -- Unless the project owner froze the missed week: project streaks honour
  -- the owner's freezes.
  insert into public.streak_freezes (user_id, week_start) values (owner, '2026-11-16');
  n := private.project_streak_at(project, '2026-11-25');
  assert n = 5, format('project with owner freeze: expected 5, got %s', n);
  delete from public.streak_freezes;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Which week a freeze applies to, and the two-per-semester limit.
-- ---------------------------------------------------------------------------
do $$
declare
  helper uuid := 'a0000000-0000-4000-8000-000000000002';
  owner uuid := 'a0000000-0000-4000-8000-000000000001';
  w date;
  failed boolean := false;
begin
  -- The helper missed last week (Nov 2): that is the week a freeze covers.
  w := private.freezable_week(helper, '2026-11-11');
  assert w = '2026-11-02', format('freezable: expected last week, got %s', w);

  -- Once last week is frozen, the next freeze would cover this week.
  insert into public.streak_freezes (user_id, week_start) values (helper, '2026-11-02');
  w := private.freezable_week(helper, '2026-11-11');
  assert w = '2026-11-09', format('freezable: expected this week, got %s', w);

  -- A paused week never needs a freeze.
  insert into public.streak_pauses values ('2026-11-09', 'test pause');
  w := private.freezable_week(helper, '2026-11-11');
  assert w is null, format('freezable: expected none, got %s', w);
  delete from public.streak_pauses;

  -- The owner posted last week and this week (in section 3): nothing to freeze.
  w := private.freezable_week(owner, '2026-11-12');
  assert w is null, format('freezable for owner: expected none, got %s', w);

  -- LIMIT: a second freeze this semester is fine, a third is refused.
  insert into public.streak_freezes (user_id, week_start) values (helper, '2026-11-09');
  begin
    insert into public.streak_freezes (user_id, week_start) values (helper, '2026-11-16');
  exception when check_violation then
    failed := true;
  end;
  assert failed, 'a third freeze in one semester must be refused';

  -- A new semester starts a new allowance.
  insert into public.streak_freezes (user_id, week_start) values (helper, '2027-01-18');
end $$;

select 'streak tests passed' as result;

rollback;

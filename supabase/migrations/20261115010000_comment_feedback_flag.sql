-- Tell apart answers to a post's feedback question from ordinary comments.
-- Only top-level comments can be feedback; replies never are.
alter table public.comments
  add column is_feedback boolean not null default false,
  add constraint comments_feedback_is_top_level
    check (not is_feedback or parent_id is null);

-- Until now every top-level comment on a post with a feedback question was
-- shown as an answer. Keep them that way.
update public.comments c
set is_feedback = true
from public.posts p
where p.id = c.post_id
  and p.feedback_question is not null
  and c.parent_id is null;

grant insert (is_feedback) on public.comments to authenticated;

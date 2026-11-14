-- Storage buckets and their access policies.
--
-- Object paths (the app must follow these; the policies read them):
--   avatars      {user_id}/{file}                 public bucket
--   covers       {project_id}/{file}              public bucket
--   attachments  {project_id}/{user_id}/{file}    private bucket
--
-- Public buckets serve files to anyone who has the URL, with no policy check,
-- so avatars and project covers load fast everywhere. Post attachments are in
-- a private bucket and follow project visibility: only people who can see the
-- project can read its files (the app signs URLs for them).
--
-- `allow_download` on an attachment is a display rule (whether to offer a
-- download button). Anyone who can view a post can load its files.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('covers', 'covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  -- 25 MB per file, any type (CAD and other files upload as generic attachments).
  ('attachments', 'attachments', false, 26214400, null)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The uuid in the nth folder of an object path, or null if it is not a uuid.
create function private.path_uuid(p_name text, p_segment int)
returns uuid
language sql immutable set search_path = ''
as $$
  select case
    when s ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then s::uuid
  end
  from (select split_part(p_name, '/', p_segment) as s) as t;
$$;

revoke all on function private.path_uuid(text, int) from public, anon;
grant execute on function private.path_uuid(text, int) to authenticated;

-- avatars: each user manages the files in their own folder.
create policy "Avatars: users read their own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and private.path_uuid(name, 1) = (select auth.uid()));

create policy "Avatars: users upload to their own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and private.path_uuid(name, 1) = (select auth.uid()));

create policy "Avatars: users replace their own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and private.path_uuid(name, 1) = (select auth.uid()))
  with check (bucket_id = 'avatars' and private.path_uuid(name, 1) = (select auth.uid()));

create policy "Avatars: users delete their own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and private.path_uuid(name, 1) = (select auth.uid()));

-- covers: a project's owner and contributors manage its cover folder.
create policy "Covers: project editors read cover files"
  on storage.objects for select to authenticated
  using (bucket_id = 'covers' and private.can_edit_project(private.path_uuid(name, 1)));

create policy "Covers: project editors upload covers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and private.can_edit_project(private.path_uuid(name, 1)));

create policy "Covers: project editors replace covers"
  on storage.objects for update to authenticated
  using (bucket_id = 'covers' and private.can_edit_project(private.path_uuid(name, 1)))
  with check (bucket_id = 'covers' and private.can_edit_project(private.path_uuid(name, 1)));

create policy "Covers: project editors delete covers"
  on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and private.can_edit_project(private.path_uuid(name, 1)));

-- attachments: readable by anyone who can see the project. Editors upload
-- into their own folder inside the project. Files are never overwritten, so
-- there is no update policy.
create policy "Attachments: read files of visible projects"
  on storage.objects for select to authenticated
  using (bucket_id = 'attachments' and private.can_view_project(private.path_uuid(name, 1)));

create policy "Attachments: project editors upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and private.can_edit_project(private.path_uuid(name, 1))
    and private.path_uuid(name, 2) = (select auth.uid())
  );

create policy "Attachments: uploaders and project owners delete files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (
      private.path_uuid(name, 2) = (select auth.uid())
      or private.is_project_owner(private.path_uuid(name, 1))
    )
  );

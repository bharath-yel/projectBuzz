-- Optional LinkedIn profile link, shown on the profile card.
alter table public.profiles
  add column linkedin_url text
    check (
      linkedin_url is null
      or (
        char_length(linkedin_url) <= 200
        and linkedin_url ~ '^https://www\.linkedin\.com/in/[A-Za-z0-9_%-]+$'
      )
    );

grant update (linkedin_url) on public.profiles to authenticated;

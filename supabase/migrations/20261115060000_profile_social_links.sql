-- Optional GitHub and personal website links, shown as icons on the profile card.
alter table public.profiles
  add column github_url text
    check (
      github_url is null
      or (
        char_length(github_url) <= 200
        and github_url ~ '^https://github\.com/[A-Za-z0-9-]+$'
      )
    ),
  add column website_url text
    check (
      website_url is null
      or (
        char_length(website_url) <= 200
        and website_url ~ '^https?://[^\s]+$'
      )
    );

grant update (github_url, website_url) on public.profiles to authenticated;

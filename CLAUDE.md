# ProjectBuzz

ProjectBuzz is a mobile-first web app where Georgia Tech students post about their passion projects to get feedback, meet collaborators organically, and build a portfolio. Think "Strava for building things": the core unit is the **project**, and posts are progress updates attached to a project.

Built for the GT Campus Solutions Hackathon. Optimize for a working, polished mobile web demo over completeness. Keep v1 simple; more complex features come later.

## Product rules (do not change without asking)

- **Project is the core unit.** Profiles show a grid of projects. Posts always belong to a project.
- **Every post needs at least one attachment.** Allowed types: photo, video, PDF, link, file. No text-only posts.
- **Weekly streaks, not daily.** One post per week (Mon–Sun, America/New_York) keeps a streak alive. Personal and per-project streaks. Streaks pause automatically during weeks in `streak_pauses` (finals, breaks). Each user gets 2 streak freezes per semester.
- **gatech.edu only.** Only `@gatech.edu` emails can sign up.
- **Tags** have a type: `category`, `class`, or `club`. Projects can have many tags.
- **Reactions:** `kudos` is the basic one-tap like and the most prominent reaction. Alongside it are three signal reactions: `use_this` ("I'd use this"), `can_help` ("I can help"), and `tried_this` ("I've tried this").
- **Feedback requests:** a post can include an optional `feedback_question`. Show it prominently and frame comments as answers to it.
- **Contributor tagging:** a project owner can add other users as contributors. The project then appears on their profiles too.
- **Out of scope. Do NOT build:** role or job postings, "looking for" listings, join requests, monthly challenges, DMs, revenue metrics.

## Later (planned, but do NOT build yet)

- **3D CAD viewer** (STEP/STL rendering in the browser). For now, CAD files upload as generic `file` attachments.
- **Similar-builders matching** (pgvector + an embeddings API).
- Don't add dependencies, tables or UI for these until asked. Just don't design anything that would block adding them later. For example, keep the attachment `type` easy to extend.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Supabase: Postgres, Auth (email OTP), Storage, Row Level Security
- pdf.js (`pdfjs-dist`) for PDF first-page previews
- Hosted on Vercel, served on a custom GoDaddy domain (DNS points to Vercel). Don't hardcode the domain; use an env var (`NEXT_PUBLIC_SITE_URL`) for absolute URLs.
- Mobile web app: installable PWA (manifest + icons). Design mobile-first at 390px wide, with touch-friendly targets and a bottom nav. Desktop only needs to look acceptable.

## Architecture rules

- **Generate previews in the browser at upload time.** Every attachment stores `file_url` (the original) and `preview_url` (an image).
  - Photo: resize and compress in the browser before upload (max 1600px on the long edge)
  - PDF: render page 1 with pdf.js, upload it as a PNG
  - Video: capture a frame from the video, upload it as a PNG
  - Link: a server route (`/api/link-preview`) fetches Open Graph tags; GitHub repo links use the GitHub API for a repo card. If there's no image, fall back to a styled card with the site's icon and the page title.
  - Other files (including CAD for now): show a card with the file-type icon, name and size
- **The feed only renders `preview_url`.** Never load full video/PDF files in the feed.
- `allow_download` on an attachment controls whether others can download the original file.
- Upload size cap: 25 MB per file.
- Compute streaks from posts in SQL (a view or function). Never store a streak counter.
- All database access goes through Supabase with RLS enabled on every table. Project `visibility` is `public` (anyone signed in) or `private` (owner + contributors only).

## Data model

```
profiles        id (= auth.users.id), gt_email, name, major, year, bio, skills text[], avatar_url, created_at
projects        id, owner_id, title, problem, stage (idea|prototype|launched), visibility (public|private), cover_url, created_at
project_members project_id, user_id, role_label            -- contributors
posts           id, project_id, author_id, kind (ship|milestone), body, feedback_question, created_at
attachments     id, post_id, type (photo|video|pdf|link|file), file_url, preview_url, meta jsonb, allow_download bool
tags            id, type (category|class|club), name, slug
project_tags    project_id, tag_id
reactions       post_id, user_id, type (kudos|use_this|can_help|tried_this)   -- unique (post_id, user_id, type)
comments        id, post_id, author_id, body, parent_id, created_at
follows         follower_id, target_type (user|project|tag), target_id
streak_pauses   week_start date, reason
streak_freezes  user_id, week_start date
```

## Conventions

- Server Components by default. Use Client Components only where you need interactivity (uploaders, reactions, composer).
- Database changes go in `supabase/migrations/` as SQL files. Seed data goes in `supabase/seed.sql`.
- Generate Supabase TypeScript types into `src/lib/database.types.ts` after schema changes.
- Keep components small and in `src/components/`. Put feature logic in `src/lib/`.
- No new dependencies without saying why.
- UI: clean, modern and image-forward. GT colors as accents (Tech Gold `#B3A369`, navy `#003057`). Show empty states with friendly copy that encourages posting rough work in progress.

## Workflow

- For each task: propose a short plan first, then implement.
- After changes, run `npm run typecheck` and `npm run lint` and fix any errors before reporting done.
- Test every screen at a 390px-wide mobile viewport.
- End each task with a short list of what to test by hand.
- Make small, focused commits with clear messages.

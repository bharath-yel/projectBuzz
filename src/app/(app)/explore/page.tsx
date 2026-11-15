import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProjectCards } from "@/components/profile/ProjectGrid";
import { buttonSecondary, inputClass } from "@/components/ui/styles";
import type { Enums } from "@/lib/database.types";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicProjects, searchPeople } from "@/lib/explore/queries";
import { TAG_TYPE_LABEL } from "@/lib/projects/constants";
import { getAllTags, type Tag } from "@/lib/projects/queries";
import { withProjectStreaks } from "@/lib/streaks/queries";

export const metadata: Metadata = { title: "Explore" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const GROUPS: Enums<"tag_type">[] = ["category", "class", "club"];

/** Tags shown per group before the rest fold behind "Show more". */
const TAGS_SHOWN = 6;

function TagChips({ tags }: { tags: Tag[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag.id}>
          <Link
            href={`/tags/${tag.slug}`}
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-background px-4 text-sm text-foreground transition-colors hover:border-gt-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
          >
            {tag.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Explore" subtitle="Find projects and people across campus" />
      <Suspense
        fallback={<div className="h-96 animate-pulse rounded-2xl border border-border bg-background" aria-busy="true" />}
      >
        {searchParams.then((query) => (
          <Explore search={typeof query.q === "string" ? query.q.slice(0, 80) : ""} />
        ))}
      </Suspense>
    </>
  );
}

async function Explore({ search }: { search: string }) {
  await getCurrentUser();
  const [tags, people, projects] = await Promise.all([
    getAllTags(),
    searchPeople(search || null),
    getPublicProjects(search || null).then(withProjectStreaks),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="mb-3 text-lg font-semibold text-gt-navy">
          {search ? `Results for "${search}"` : "Newest projects"}
        </h2>
        <form action="/explore" role="search" className="mb-4 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={search}
            aria-label="Search projects and people"
            placeholder="Search projects and people"
            className={`${inputClass} min-w-0`}
          />
          <button type="submit" className={`${buttonSecondary} shrink-0`}>
            Search
          </button>
        </form>
        {search ? (
          <div className="mb-2">
            <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">People</h3>
            {people.length > 0 ? (
              <ul className="grid gap-x-4 sm:grid-cols-2">
                {people.map((person) => (
                  <li key={person.id}>
                    <Link
                      href={`/u/${person.id}`}
                      className="group flex min-h-14 items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                    >
                      <Avatar src={person.avatar_url} name={person.name} size={40} />
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold text-gt-navy group-hover:underline">
                          {person.name}
                        </span>
                        <span className="block truncate text-sm text-muted">
                          {[person.major, person.year].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No people match that name.</p>
            )}
            <h3 className="mt-6 text-xs font-semibold tracking-wide text-muted uppercase">Projects</h3>
          </div>
        ) : null}
        {projects.length > 0 ? (
          <ProjectCards projects={projects} />
        ) : search ? (
          <div className="flex flex-col items-center gap-4">
            <EmptyState icon="🔍" title="No projects found">
              No project titles match. Try fewer words, or browse the tags below.
            </EmptyState>
            <Link href="/explore" className={buttonSecondary}>
              Clear search
            </Link>
          </div>
        ) : (
          <EmptyState icon="🧭" title="Nothing to explore yet">
            Projects from across campus will appear here once people start
            posting. Yours could be the first.
          </EmptyState>
        )}
      </section>

      <section aria-labelledby="tags-heading">
        <h2 id="tags-heading" className="mb-3 text-lg font-semibold text-gt-navy">
          Browse by tag
        </h2>
        <div className="flex flex-col gap-5">
          {GROUPS.map((type) => {
            const group = tags.filter((tag) => tag.type === type);
            if (group.length === 0) return null;
            const rest = group.slice(TAGS_SHOWN);
            return (
              <div key={type}>
                <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                  {TAG_TYPE_LABEL[type]}
                </h3>
                <TagChips tags={group.slice(0, TAGS_SHOWN)} />
                {rest.length > 0 ? (
                  <details className="group mt-2">
                    <summary className="inline-flex min-h-11 cursor-pointer list-none items-center rounded-lg px-1 text-sm font-semibold text-gt-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy [&::-webkit-details-marker]:hidden">
                      <span className="group-open:hidden">Show {rest.length} more</span>
                      <span className="hidden group-open:inline">Show fewer</span>
                    </summary>
                    <div className="mt-1">
                      <TagChips tags={rest} />
                    </div>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

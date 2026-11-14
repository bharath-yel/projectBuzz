import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ProjectCards } from "@/components/profile/ProjectGrid";
import { buttonSecondary, inputClass } from "@/components/ui/styles";
import type { Enums } from "@/lib/database.types";
import { getCurrentUser } from "@/lib/auth/session";
import { getPublicProjects } from "@/lib/explore/queries";
import { TAG_TYPE_LABEL } from "@/lib/projects/constants";
import { getAllTags } from "@/lib/projects/queries";

export const metadata: Metadata = { title: "Explore" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const GROUPS: Enums<"tag_type">[] = ["category", "class", "club"];

export default function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Explore" subtitle="Browse projects by category, class and club" />
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
  const [tags, projects] = await Promise.all([getAllTags(), getPublicProjects(search || null)]);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="projects-heading">
        <h2 id="projects-heading" className="mb-3 text-lg font-semibold text-gt-navy">
          {search ? `Projects matching "${search}"` : "Newest projects"}
        </h2>
        <form action="/explore" role="search" className="mb-4 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={search}
            aria-label="Search projects by title"
            placeholder="Search projects by title"
            className={`${inputClass} min-w-0`}
          />
          <button type="submit" className={`${buttonSecondary} shrink-0`}>
            Search
          </button>
        </form>
        {projects.length > 0 ? (
          <ProjectCards projects={projects} />
        ) : search ? (
          <div className="flex flex-col items-center gap-4">
            <EmptyState icon="🔍" title="No projects found">
              Nothing matches that title. Try fewer words, or browse the tags below.
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
          {GROUPS.map((type) => (
            <div key={type}>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                {TAG_TYPE_LABEL[type]}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {tags
                  .filter((tag) => tag.type === type)
                  .map((tag) => (
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

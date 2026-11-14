import Image from "next/image";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import type { Enums } from "@/lib/database.types";
import { STAGE_LABEL } from "@/lib/projects/constants";

export type ProjectCardData = {
  id: string;
  title: string;
  stage: Enums<"project_stage">;
  visibility: Enums<"project_visibility">;
  cover_url: string | null;
  /** Set on profiles, where a card may be a project the person contributes to. */
  role?: "owner" | "contributor";
  roleLabel?: string | null;
};

function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-colors hover:border-gt-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
    >
      <div className="relative aspect-[4/3] bg-surface">
        {project.cover_url ? (
          <Image
            src={project.cover_url}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 1024px) 190px, 50vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gt-navy to-gt-navy/70 text-4xl font-bold text-gt-gold"
          >
            {project.title.trim().charAt(0).toUpperCase()}
          </div>
        )}
        {project.visibility === "private" ? (
          <span className="absolute top-2 left-2 rounded-full bg-gt-navy/85 px-2 py-0.5 text-[11px] font-semibold text-white">
            Private
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-gt-navy">
          {project.title}
        </h3>
        <p className="mt-auto flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
          <span className="rounded-full bg-gt-gold/25 px-2 py-0.5 font-medium text-gt-navy">
            {STAGE_LABEL[project.stage]}
          </span>
          {project.role === "contributor" ? (
            <span>{project.roleLabel ? `Contributor · ${project.roleLabel}` : "Contributor"}</span>
          ) : null}
        </p>
      </div>
    </Link>
  );
}

/** Project cards, two across on phones and three on desktop. */
export function ProjectCards({ projects }: { projects: ProjectCardData[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}

type ProjectGridProps = {
  projects: ProjectCardData[];
  isOwn: boolean;
};

/** A profile's projects, with an empty state. */
export function ProjectGrid({ projects, isOwn }: ProjectGridProps) {
  if (projects.length === 0) {
    return isOwn ? (
      <EmptyState icon="🌱" title="No projects yet">
        Your projects will live here. Start with an idea or a rough prototype and
        build your portfolio as you go.
      </EmptyState>
    ) : (
      <EmptyState icon="🌱" title="No projects yet">
        Nothing to show here yet. Check back soon.
      </EmptyState>
    );
  }

  return <ProjectCards projects={projects} />;
}

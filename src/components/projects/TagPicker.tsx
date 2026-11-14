"use client";

import { useMemo, useState } from "react";
import { inputClass } from "@/components/ui/styles";
import type { Enums } from "@/lib/database.types";
import { PROJECT_LIMITS, TAG_TYPE_LABEL } from "@/lib/projects/constants";
import type { Tag } from "@/lib/projects/queries";

type TagPickerProps = {
  id: string;
  tags: Tag[];
  value: string[];
  /** Receives an updater, so quick successive taps never work from stale state. */
  onChange: (update: (current: string[]) => string[]) => void;
};

const GROUP_ORDER: Enums<"tag_type">[] = ["category", "class", "club"];
/** Classes and clubs are long lists: show a few until the user searches. */
const COLLAPSED_COUNT = 8;

/** Searchable tag picker, grouped into categories, classes and clubs. */
export function TagPicker({ id, tags, value, onChange }: TagPickerProps) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const selected = useMemo(() => new Set(value), [value]);
  const full = value.length >= PROJECT_LIMITS.tags;

  const search = query.trim().toLowerCase();
  const matches = (tag: Tag) =>
    !search ||
    tag.name.toLowerCase().includes(search) ||
    tag.slug.includes(search.replace(/\s+/g, "-"));

  function toggle(tagId: string) {
    onChange((current) => {
      if (current.includes(tagId)) return current.filter((item) => item !== tagId);
      return current.length >= PROJECT_LIMITS.tags ? current : [...current, tagId];
    });
  }

  const chosen = value
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag));

  const groups = GROUP_ORDER.map((type) => ({
    type,
    tags: tags.filter((tag) => tag.type === type && matches(tag)),
  })).filter((group) => group.tags.length > 0);

  return (
    <div>
      {chosen.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Selected tags">
          {chosen.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => toggle(tag.id)}
                aria-label={`Remove ${tag.name}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gt-navy pr-3 pl-4 text-sm font-medium text-white transition-colors hover:bg-gt-navy/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
              >
                {tag.name}
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        id={id}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        placeholder="Search categories, classes and clubs"
        autoComplete="off"
        className={inputClass}
      />
      <p className="mt-1.5 text-xs text-muted" aria-live="polite">
        {full
          ? `That's the maximum of ${PROJECT_LIMITS.tags}. Remove one to add another.`
          : `${value.length} of ${PROJECT_LIMITS.tags} selected`}
      </p>

      <div className="mt-3 flex flex-col gap-4">
        {groups.length === 0 ? (
          <p className="text-sm text-muted">No tags match &ldquo;{query.trim()}&rdquo;.</p>
        ) : null}
        {groups.map((group) => {
          const showAll = Boolean(search) || expanded.has(group.type) || group.tags.length <= COLLAPSED_COUNT;
          const visible = showAll ? group.tags : group.tags.slice(0, COLLAPSED_COUNT);
          return (
            <fieldset key={group.type}>
              <legend className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
                {TAG_TYPE_LABEL[group.type]}
              </legend>
              <ul className="flex flex-wrap gap-2">
                {visible.map((tag) => {
                  const isSelected = selected.has(tag.id);
                  return (
                    <li key={tag.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        disabled={full && !isSelected}
                        onClick={() => toggle(tag.id)}
                        className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy disabled:cursor-not-allowed disabled:opacity-45 ${
                          isSelected
                            ? "border-gt-navy bg-gt-navy font-medium text-white"
                            : "border-border bg-background text-foreground hover:border-gt-navy"
                        }`}
                      >
                        {tag.name}
                      </button>
                    </li>
                  );
                })}
                {!showAll ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => setExpanded(new Set(expanded).add(group.type))}
                      className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-gt-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                    >
                      Show all {group.tags.length}
                    </button>
                  </li>
                ) : null}
              </ul>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Avatar } from "@/components/Avatar";
import { Field } from "@/components/ui/Field";
import { buttonPrimary, buttonSecondary, buttonText, inputClass } from "@/components/ui/styles";
import {
  addContributor,
  removeContributor,
  searchUsersForProject,
  type UserResult,
} from "@/lib/projects/contributor-actions";

type Contributor = { id: string; name: string; avatar_url: string | null; role_label: string | null };

type ContributorManagerProps = {
  projectId: string;
  contributors: Contributor[];
};

/** For the project owner: find Georgia Tech users and add or remove them as contributors. */
export function ContributorManager({ projectId, contributors }: ContributorManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<UserResult | null>(null);
  const [roleLabel, setRoleLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const latestSearch = useRef(0);

  // Search a moment after typing stops; ignore answers to older searches.
  useEffect(() => {
    const term = query.trim();
    if (picked || term.length < 2) return;
    const id = ++latestSearch.current;
    const timer = window.setTimeout(() => {
      setSearching(true);
      searchUsersForProject(projectId, term)
        .then((found) => {
          if (latestSearch.current === id) setResults(found);
        })
        .catch(() => {
          if (latestSearch.current === id) setResults([]);
        })
        .finally(() => {
          if (latestSearch.current === id) setSearching(false);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, picked, projectId]);

  function reset() {
    setQuery("");
    setResults(null);
    setPicked(null);
    setRoleLabel("");
    setError(null);
  }

  function add() {
    if (!picked) return;
    setError(null);
    startTransition(async () => {
      const result = await addContributor({ projectId, userId: picked.id, roleLabel }).catch(() => null);
      if (!result) setError("We couldn't add them. Check your connection.");
      else if (!result.ok) setError(result.message);
      else {
        reset();
        router.refresh();
      }
    });
  }

  function remove(contributor: Contributor) {
    setError(null);
    startTransition(async () => {
      const result = await removeContributor(projectId, contributor.id).catch(() => null);
      if (!result || !result.ok) setError(result?.message ?? "We couldn't remove them. Check your connection.");
      else router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={`${buttonSecondary} mt-4`}>
        {contributors.length > 0 ? "Manage contributors" : "Add contributors"}
      </button>
    );
  }

  const term = query.trim();
  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4" aria-label="Manage contributors">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-gt-navy">Contributors</h3>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className={buttonText}
        >
          Done
        </button>
      </div>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        Contributors can post updates and edit the project. It also appears on their profile.
      </p>

      {contributors.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {contributors.map((contributor) => (
            <li key={contributor.id} className="flex items-center gap-2.5 rounded-xl bg-background px-3 py-2">
              <Avatar src={contributor.avatar_url} name={contributor.name} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gt-navy">{contributor.name}</span>
                <span className="block truncate text-xs text-muted">
                  {contributor.role_label ?? "Contributor"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(contributor)}
                disabled={pending}
                aria-label={`Remove ${contributor.name}`}
                className={buttonText}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-4">
        {picked ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-background px-3 py-2">
              <Avatar src={picked.avatar_url} name={picked.name} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gt-navy">{picked.name}</span>
                <span className="block truncate text-xs text-muted">{picked.gt_email}</span>
              </span>
              <button type="button" onClick={() => setPicked(null)} className={buttonText}>
                Change
              </button>
            </div>
            <Field htmlFor="role-label" label="Role" hint="Optional">
              <input
                id="role-label"
                type="text"
                value={roleLabel}
                maxLength={60}
                placeholder="Firmware, design, testing…"
                onChange={(event) => setRoleLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    add();
                  }
                }}
                className={inputClass}
              />
            </Field>
            <button type="button" onClick={add} disabled={pending} className={`${buttonPrimary} w-full`}>
              {pending ? "Adding…" : `Add ${picked.name}`}
            </button>
          </div>
        ) : (
          <>
            <Field htmlFor="contributor-search" label="Add someone">
              <input
                id="contributor-search"
                type="search"
                value={query}
                autoComplete="off"
                placeholder="Search by name or GT email"
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (event.target.value.trim().length < 2) setResults(null);
                }}
                className={inputClass}
              />
            </Field>
            {term.length >= 2 ? (
              <div className="mt-2" aria-live="polite">
                {results === null || searching ? (
                  <p className="px-1 py-2 text-sm text-muted">Searching…</p>
                ) : results.length === 0 ? (
                  <p className="px-1 py-2 text-sm leading-relaxed text-muted">
                    No one found for &ldquo;{term}&rdquo;. They need to have signed in to
                    ProjectBuzz at least once.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {results.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => setPicked(user)}
                          className="flex min-h-12 w-full items-center gap-2.5 rounded-xl bg-background px-3 py-2 text-left transition-colors hover:bg-gt-gold/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                        >
                          <Avatar src={user.avatar_url} name={user.name} size={36} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-gt-navy">{user.name}</span>
                            <span className="block truncate text-xs text-muted">
                              {[user.major, user.gt_email].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </>
        )}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}

/** For a contributor: leave the project. */
export function LeaveProjectButton({ projectId, userId }: { projectId: string; userId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function leave() {
    startTransition(async () => {
      const result = await removeContributor(projectId, userId).catch(() => null);
      if (!result || !result.ok) setError(result?.message ?? "We couldn't do that. Check your connection.");
      else router.refresh();
    });
  }

  return (
    <div className="mt-4">
      {confirming ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-sm text-muted">Leave this project? Your posts stay.</span>
          <button type="button" onClick={leave} disabled={pending} className={buttonSecondary}>
            {pending ? "Leaving…" : "Leave"}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={buttonText}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className={`${buttonText} text-muted`}>
          Leave project
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

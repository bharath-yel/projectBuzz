"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setSeekingCollaborators } from "@/lib/projects/actions";

/** The owner's switch for the "Looking for collaborators" badge. */
export function CollaboratorToggle({ projectId, initial }: { projectId: string; initial: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (pending) return;
    const next = !on;
    setOn(next);
    setFailed(false);
    startTransition(async () => {
      const result = await setSeekingCollaborators(projectId, next).catch(() => ({ ok: false }));
      if (result.ok) router.refresh();
      else {
        setOn(!next);
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
      >
        <span>
          <span className="block text-sm font-semibold text-gt-navy">Looking for collaborators</span>
          <span className="block text-sm text-muted">
            Shows a badge on this project and on your profile.
          </span>
        </span>
        <span
          aria-hidden
          className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors ${
            on ? "bg-gt-navy" : "bg-border"
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
              on ? "translate-x-5" : ""
            }`}
          />
        </span>
      </button>
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          That didn&apos;t save. Check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}

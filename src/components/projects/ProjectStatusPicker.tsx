"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Enums } from "@/lib/database.types";
import { setProjectStatus } from "@/lib/projects/actions";
import { STATUS_BOX, STATUS_DOT, STATUSES } from "@/lib/projects/constants";

type Status = Enums<"project_status">;

/** The owner's control for marking a project active, completed or dropped. */
export function ProjectStatusPicker({ projectId, initial }: { projectId: string; initial: Status }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(next: Status) {
    if (next === status || pending) return;
    const previous = status;
    setStatus(next);
    setFailed(false);
    startTransition(async () => {
      const result = await setProjectStatus(projectId, next).catch(() => ({ ok: false }));
      if (result.ok) router.refresh();
      else {
        setStatus(previous);
        setFailed(true);
      }
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p id="status-label" className="text-sm font-semibold text-gt-navy">
        Project status
      </p>
      <div role="group" aria-labelledby="status-label" className="mt-2 grid grid-cols-3 gap-2">
        {STATUSES.map((option) => {
          const active = status === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => choose(option.value)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
                active
                  ? `${STATUS_BOX[option.value]} font-semibold text-gt-navy`
                  : "border-border bg-background text-muted hover:border-gt-navy hover:text-gt-navy"
              }`}
            >
              <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[option.value]}`} />
              {option.label}
            </button>
          );
        })}
      </div>
      {failed ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          That didn&apos;t save. Check your connection and try again.
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { spendStreakFreeze } from "@/lib/streaks/actions";

type FreezeControlProps = {
  freezesLeft: number;
  /** The Monday (YYYY-MM-DD) a freeze would cover, or null if none needs one. */
  freezableWeek: string | null;
  /** The Monday of the current week, to tell "this week" from "last week". */
  currentWeek: string;
};

/** Your streak freezes: how many are left, and a button to use one. */
export function FreezeControl({ freezesLeft, freezableWeek, currentWeek }: FreezeControlProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const which = freezableWeek === currentWeek ? "this week" : "last week";

  function freeze() {
    setError(null);
    startTransition(async () => {
      const result = await spendStreakFreeze().catch(() => null);
      if (!result) setError("We couldn't use a freeze. Check your connection.");
      else if (!result.ok) setError(result.message);
      else router.refresh();
    });
  }

  const canFreeze = freezesLeft > 0 && freezableWeek !== null;

  return (
    <div className="mt-2 border-t border-border pt-2 text-xs leading-relaxed text-muted">
      <div className="flex flex-wrap items-center justify-between gap-x-3">
        <p>
          <span className="font-semibold text-gt-navy">
            {freezesLeft} streak {freezesLeft === 1 ? "freeze" : "freezes"}
          </span>{" "}
          left this semester
        </p>
        {canFreeze ? (
          <button type="button" onClick={freeze} disabled={pending} className="inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-gt-navy underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy disabled:cursor-not-allowed disabled:text-muted disabled:no-underline">
            {pending ? "Freezing…" : `Freeze ${which}`}
          </button>
        ) : null}
      </div>
      {canFreeze ? <p>A freeze keeps your streak alive through a week with no post.</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

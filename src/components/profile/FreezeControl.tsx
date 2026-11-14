"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { buttonSecondary } from "@/components/ui/styles";
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

  return (
    <div className="mt-3 rounded-2xl border border-border bg-background p-4">
      <p className="text-sm font-semibold text-gt-navy">
        {freezesLeft} streak {freezesLeft === 1 ? "freeze" : "freezes"} left this semester
      </p>
      <p className="mt-0.5 text-sm leading-relaxed text-muted">
        {freezesLeft === 0
          ? "You've used both. You get two more next semester."
          : freezableWeek
            ? `A freeze keeps your streak alive through a week with no post. You can use one on ${which}.`
            : "A freeze keeps your streak alive through a week with no post. You don't need one right now."}
      </p>
      {freezesLeft > 0 && freezableWeek ? (
        <button type="button" onClick={freeze} disabled={pending} className={`${buttonSecondary} mt-3`}>
          {pending ? "Freezing…" : `Freeze ${which}`}
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

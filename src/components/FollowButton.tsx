"use client";

import { useState, useTransition } from "react";
import { setFollow } from "@/lib/follows/actions";

type FollowButtonProps = {
  type: "user" | "project" | "tag";
  targetId: string;
  initialFollowing: boolean;
  /** What is being followed, for screen readers: "Follow RoboJackets". */
  label: string;
};

/** Follow or unfollow a person, project or tag. Updates at once; undoes itself if saving fails. */
export function FollowButton({ type, targetId, initialFollowing, label }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !following;
    setFollowing(next);
    setFailed(false);
    startTransition(async () => {
      const result = await setFollow(type, targetId, next);
      if (!result.ok) {
        setFollowing(!next);
        setFailed(true);
      }
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={following}
        aria-label={`${following ? "Unfollow" : "Follow"} ${label}`}
        className={`inline-flex min-h-11 min-w-24 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy ${
          following
            ? "border-border bg-background text-gt-navy hover:bg-surface"
            : "border-gt-navy bg-gt-navy text-white hover:bg-gt-navy/90"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      {failed ? (
        <span role="alert" className="text-xs text-red-700">
          Couldn&apos;t save. Try again.
        </span>
      ) : null}
    </span>
  );
}

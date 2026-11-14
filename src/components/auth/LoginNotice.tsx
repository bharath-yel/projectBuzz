"use client";

import { useSearchParams } from "next/navigation";

/** Explains why someone landed back on the login page (?error=link). */
export function LoginNotice() {
  const error = useSearchParams().get("error");
  if (error !== "link") return null;

  return (
    <p
      role="alert"
      className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"
    >
      That sign-in link didn&apos;t work. It may have expired, already been used, or
      been opened in a different browser than the one you asked from. Request a new
      link below.
    </p>
  );
}

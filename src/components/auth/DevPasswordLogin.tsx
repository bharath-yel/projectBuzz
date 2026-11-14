"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Field } from "@/components/ui/Field";
import { buttonSecondary, inputClass } from "@/components/ui/styles";
import { devPasswordSignIn } from "@/lib/auth/dev-actions";

/** Local testing only. Rendered by the login page only under `npm run dev`. */
export function DevPasswordLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const next = new URLSearchParams(window.location.search).get("next");
      // Success redirects away, so anything returned is a failure.
      const result = await devPasswordSignIn({ email, password, next });
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 flex flex-col gap-4 rounded-xl border border-dashed border-border bg-surface p-4"
    >
      <div>
        <p className="text-sm font-semibold text-gt-navy">Local testing only</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          Sign in as a test user created in the Supabase dashboard. No email is sent.
          This box does not appear on the live site.
        </p>
      </div>
      <Field htmlFor="dev-email" label="Test user email">
        <input
          id="dev-email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="tester1@gatech.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field htmlFor="dev-password" label="Password" error={error ?? undefined}>
        <input
          id="dev-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "dev-password-error" : undefined}
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={pending} className={`${buttonSecondary} w-full`}>
        {pending ? "Signing in…" : "Sign in with password"}
      </button>
    </form>
  );
}

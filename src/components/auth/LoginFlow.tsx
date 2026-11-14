"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { Field } from "@/components/ui/Field";
import { buttonPrimary, buttonText, inputClass } from "@/components/ui/styles";
import { sendLoginEmail, verifyLoginCode } from "@/lib/auth/actions";
import { GT_EMAIL_ERROR, isGatechEmail, normalizeEmail } from "@/lib/auth/email";

/**
 * Sign-in is two steps: enter your email, then either type the code from the
 * email or open the link in it. Both end at the same place.
 */
type Step = { name: "email" } | { name: "sent"; email: string };

const RESEND_WAIT_SECONDS = 60;

/** Where the visitor was headed before being sent to /login. */
function nextFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("next");
}

export function LoginFlow() {
  const [step, setStep] = useState<Step>({ name: "email" });

  if (step.name === "sent") {
    return (
      <CheckEmailStep
        email={step.email}
        onChangeEmail={() => setStep({ name: "email" })}
      />
    );
  }
  return <EmailStep onSent={(email) => setStep({ name: "sent", email })} />;
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = normalizeEmail(email);
    if (!value) {
      setError("Enter your Georgia Tech email.");
      return;
    }
    if (!isGatechEmail(value)) {
      setError(GT_EMAIL_ERROR);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await sendLoginEmail({ email: value, next: nextFromUrl() });
      if (result.ok) onSent(result.email);
      else setError(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1 className="text-2xl font-bold tracking-tight text-gt-navy">Sign in</h1>
      <p className="mt-1.5 mb-6 text-sm leading-relaxed text-muted">
        Use your Georgia Tech email. We&apos;ll send you a sign-in link, so there&apos;s
        no password to remember.
      </p>

      <Field htmlFor="email" label="Georgia Tech email" error={error ?? undefined}>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="gburdell3@gatech.edu"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "email-error" : undefined}
          className={inputClass}
        />
      </Field>

      <button type="submit" disabled={pending} className={`${buttonPrimary} mt-5 w-full`}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}

function CheckEmailStep({
  email,
  onChangeEmail,
}: {
  email: string;
  onChangeEmail: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(RESEND_WAIT_SECONDS);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, startVerify] = useTransition();

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length < 6) {
      setCodeError("Enter the full code from the email.");
      return;
    }
    setCodeError(null);
    startVerify(async () => {
      // Success redirects away, so anything returned is a failure.
      const result = await verifyLoginCode({ email, code, next: nextFromUrl() });
      if (result && !result.ok) setCodeError(result.message);
    });
  }

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  function resend() {
    setNotice(null);
    startTransition(async () => {
      const result = await sendLoginEmail({ email, next: nextFromUrl() });
      if (result.ok) {
        setSecondsLeft(RESEND_WAIT_SECONDS);
        setNotice({ tone: "ok", text: "Sent again. Check your inbox." });
      } else {
        setNotice({ tone: "error", text: result.message });
      }
    });
  }

  return (
    <div>
      <div
        aria-hidden
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gt-gold/20 text-2xl"
      >
        ✉️
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-gt-navy">Check your email</h1>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">
        We sent a sign-in email to{" "}
        <span className="font-semibold break-all text-foreground">{email}</span>. Enter
        the code from it below.
      </p>

      <form onSubmit={verify} noValidate className="mt-5">
        <Field htmlFor="code" label="Sign-in code" error={codeError ?? undefined}>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="123456"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ""));
              if (codeError) setCodeError(null);
            }}
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "code-error" : undefined}
            className={`${inputClass} text-center text-xl font-semibold tracking-[0.3em]`}
          />
        </Field>
        <button type="submit" disabled={verifying} className={`${buttonPrimary} mt-4 w-full`}>
          {verifying ? "Checking…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        You can also open the link in the email, in this same browser. Nothing yet?
        It can take a minute. Check your spam folder too.
      </p>

      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mt-4 text-sm ${notice.tone === "error" ? "text-red-700" : "text-gt-navy"}`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-4">
        <button
          type="button"
          onClick={resend}
          disabled={pending || secondsLeft > 0}
          className={buttonText}
        >
          {pending
            ? "Sending…"
            : secondsLeft > 0
              ? `Resend email in ${secondsLeft}s`
              : "Resend email"}
        </button>
        <button type="button" onClick={onChangeEmail} className={buttonText}>
          Use a different email
        </button>
      </div>
    </div>
  );
}

"use server";

import { redirect } from "next/navigation";
import { GT_EMAIL_ERROR, isGatechEmail, normalizeEmail } from "@/lib/auth/email";
import { getPostSignInPath } from "@/lib/auth/post-sign-in";
import { safeNextPath } from "@/lib/auth/redirects";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type SendLoginEmailResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

/**
 * Step 1 of signing in: email a one-time login to a @gatech.edu address.
 *
 * The email carries a magic link (lands on /auth/callback) and, if the email
 * template includes `{{ .Token }}`, a one-time code for verifyLoginCode below.
 */
export async function sendLoginEmail(input: {
  email: string;
  next?: string | null;
}): Promise<SendLoginEmailResult> {
  const email = normalizeEmail(String(input.email ?? ""));
  if (!isGatechEmail(email)) {
    return { ok: false, message: GT_EMAIL_ERROR };
  }

  const next = safeNextPath(input.next);
  const callback = new URL("/auth/callback", siteUrl);
  if (next) callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback.toString(), shouldCreateUser: true },
  });

  if (error) {
    console.error("sendLoginEmail failed:", error.code, error.message);
    if (
      error.code === "over_email_send_rate_limit" ||
      error.code === "over_request_rate_limit" ||
      error.status === 429
    ) {
      return {
        ok: false,
        message: "Too many sign-in emails just now. Wait a minute, then try again.",
      };
    }
    if (error.code === "email_address_not_authorized") {
      return {
        ok: false,
        message:
          "We can't send email to that address yet. Email delivery is still being set up.",
      };
    }
    return {
      ok: false,
      message: "We couldn't send the sign-in email. Try again in a moment.",
    };
  }

  return { ok: true, email };
}

/**
 * Step 2, code path: sign in with the one-time code from the email. Unlike
 * the link, a code works on any device. On success this redirects and never
 * returns; on failure it returns a message to show.
 */
export async function verifyLoginCode(input: {
  email: string;
  code: string;
  next?: string | null;
}): Promise<{ ok: false; message: string }> {
  const email = normalizeEmail(String(input.email ?? ""));
  const code = String(input.code ?? "").replace(/\D/g, "");
  if (!isGatechEmail(email)) {
    return { ok: false, message: GT_EMAIL_ERROR };
  }
  if (code.length < 6 || code.length > 10) {
    return { ok: false, message: "Enter the full code from the email." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error || !data.user) {
    console.error("verifyLoginCode failed:", error?.code, error?.message);
    return {
      ok: false,
      message:
        error?.status === 429
          ? "Too many tries. Wait a minute, then try again."
          : "That code didn't work. It may have expired or been mistyped. Check it, or request a new one.",
    };
  }

  redirect(await getPostSignInPath(supabase, data.user.id, safeNextPath(input.next)));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

"use server";

import { redirect } from "next/navigation";
import { GT_EMAIL_ERROR, isGatechEmail, normalizeEmail } from "@/lib/auth/email";
import { safeNextPath } from "@/lib/auth/redirects";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

export type SendLoginEmailResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

/**
 * Step 1 of signing in: email a one-time login to a @gatech.edu address.
 *
 * Today the email carries a magic link that lands on /auth/callback. The same
 * `signInWithOtp` call also issues a 6-digit code, so a code screen only needs
 * a second action that calls `verifyOtp({ email, token, type: "email" })` and
 * then redirects to `getPostSignInPath(...)`. Nothing here has to change.
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

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

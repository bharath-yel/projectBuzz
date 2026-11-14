"use server";

import { redirect } from "next/navigation";
import { GT_EMAIL_ERROR, isGatechEmail, normalizeEmail } from "@/lib/auth/email";
import { getPostSignInPath } from "@/lib/auth/post-sign-in";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

/**
 * Local testing only: sign in with a password, for test users created in the
 * Supabase dashboard. Lets you test without sending any email. Refuses to run
 * outside `npm run dev`, so it does not exist in production.
 */
export async function devPasswordSignIn(input: {
  email: string;
  password: string;
  next?: string | null;
}): Promise<{ ok: false; message: string }> {
  if (process.env.NODE_ENV !== "development") {
    return { ok: false, message: "Password sign-in is only available in local development." };
  }
  const email = normalizeEmail(String(input.email ?? ""));
  const password = String(input.password ?? "");
  if (!isGatechEmail(email)) return { ok: false, message: GT_EMAIL_ERROR };
  if (!password) return { ok: false, message: "Enter the test user's password." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    console.error("devPasswordSignIn failed:", error?.code, error?.message);
    return {
      ok: false,
      message:
        error?.code === "email_not_confirmed"
          ? "That user isn't confirmed. Recreate it in the dashboard with Auto Confirm User ticked."
          : "Wrong email or password, or that user doesn't exist in the Supabase dashboard yet.",
    };
  }
  redirect(await getPostSignInPath(supabase, data.user.id, safeNextPath(input.next)));
}

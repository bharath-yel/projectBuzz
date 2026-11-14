import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getPostSignInPath } from "@/lib/auth/post-sign-in";
import { safeNextPath } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the emailed sign-in link lands. Turns the one-time credential in the
 * URL into a session cookie, then sends new users to onboarding and returning
 * users to the feed (or the page they were trying to open).
 *
 * Handles both link formats Supabase can send:
 *   ?code=...                 the default link. The code can only be exchanged
 *                             in the browser that asked for the email.
 *   ?token_hash=...&type=...  used when the email template links here directly.
 *                             Works from any device.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  const fail = (reason: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", reason);
    if (next) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  };

  // Supabase reports an expired or already-used link with ?error=...
  if (searchParams.get("error")) {
    return fail("link");
  }

  const supabase = await createClient();
  let userId: string | undefined;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth callback: code exchange failed:", error.code, error.message);
      return fail("link");
    }
    userId = data.user?.id;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      console.error("auth callback: token verification failed:", error.code, error.message);
      return fail("link");
    }
    userId = data.user?.id;
  }

  if (!userId) {
    return fail("link");
  }

  const path = await getPostSignInPath(supabase, userId, next);
  return NextResponse.redirect(new URL(path, request.url));
}

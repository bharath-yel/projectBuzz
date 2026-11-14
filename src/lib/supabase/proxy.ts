import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isPublicPath } from "@/lib/auth/redirects";
import type { Database } from "@/lib/database.types";

/**
 * Runs on every page request:
 *   1. Refreshes the Supabase session cookie so Server Components always see
 *      a current session.
 *   2. Sends signed-out visitors to /login, and signed-in visitors away from it.
 *
 * This is the first gate, not the only one: signed-in pages check the session
 * again when they load data, and row level security guards the data itself.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Let the app render without Supabase configured (fresh clone).
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Responses that set auth cookies must not be cached by a CDN.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Do not run code between createServerClient and getClaims: this call is
  // what validates the token and triggers the cookie refresh.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search, searchParams } = request.nextUrl;

  // A redirect must carry any refreshed session cookies with it.
  const redirectTo = (target: URL) => {
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "cache-control") redirect.headers.set(key, value);
    });
    return redirect;
  };

  // If /auth/callback is not in Supabase's allowed redirect URLs, Supabase
  // sends the sign-in link to the site root instead. Forward it.
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("error_code"))) {
    const target = new URL("/auth/callback", request.url);
    target.search = search;
    return redirectTo(target);
  }

  // API routes check the session themselves and answer with JSON.
  if (!signedIn && !isPublicPath(pathname) && !pathname.startsWith("/api/")) {
    const target = new URL("/login", request.url);
    if (pathname !== "/") target.searchParams.set("next", pathname + search);
    return redirectTo(target);
  }

  if (signedIn && pathname === "/login") {
    return redirectTo(new URL("/", request.url));
  }

  return response;
}

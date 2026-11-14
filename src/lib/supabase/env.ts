/**
 * Supabase connection settings from the environment.
 * The property accesses are written out literally so Next.js can inline the
 * NEXT_PUBLIC_ values into the browser bundle.
 */
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill them in.",
    );
  }

  return { url, anonKey };
}

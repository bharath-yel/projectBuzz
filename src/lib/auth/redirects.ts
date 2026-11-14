/** Paths anyone can open without a session. */
export function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/auth/");
}

/**
 * Returns `value` only if it is a path on this site, so a crafted
 * `?next=https://evil.example` can never send someone elsewhere after login.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  if (isPublicPath(value.split(/[?#]/)[0])) return null;
  return value;
}

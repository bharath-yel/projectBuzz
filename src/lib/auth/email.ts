/**
 * Georgia Tech email rules. Shared by the login form (instant feedback) and
 * the server action (the check that counts). The database also enforces this
 * with a trigger on auth.users, so nothing here is the last line of defence.
 */
export const GT_EMAIL_DOMAIN = "gatech.edu";

const GT_EMAIL_PATTERN = /^[a-z0-9._%+-]+@gatech\.edu$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isGatechEmail(value: string): boolean {
  return GT_EMAIL_PATTERN.test(normalizeEmail(value));
}

export const GT_EMAIL_ERROR =
  "ProjectBuzz is for Georgia Tech students. Use your @gatech.edu email.";

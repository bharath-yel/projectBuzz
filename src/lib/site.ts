/**
 * Absolute base URL of the site. Set NEXT_PUBLIC_SITE_URL per environment;
 * never hardcode the production domain.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const siteName = "ProjectBuzz";

export const siteDescription =
  "Share what you're building at Georgia Tech. Post progress, get feedback, and meet collaborators.";

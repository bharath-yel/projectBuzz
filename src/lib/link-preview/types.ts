/** What /api/link-preview returns, and what a link attachment stores in `meta`. */
export type LinkPreview = {
  url: string;
  /** "github" renders as a repo card; "page" as an image card or icon-and-title card. */
  kind: "page" | "github";
  title: string;
  description: string | null;
  siteName: string | null;
  /** Open Graph image, if the page has one. */
  image: string | null;
  /** The site's icon, for the fallback card. */
  icon: string | null;
  github: {
    fullName: string;
    stars: number;
    forks: number;
    language: string | null;
    ownerAvatar: string | null;
  } | null;
};

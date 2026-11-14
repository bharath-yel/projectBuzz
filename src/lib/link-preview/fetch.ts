import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { LinkPreview } from "@/lib/link-preview/types";

/**
 * Server-side link preview: Open Graph tags for ordinary pages, the GitHub
 * API for repositories, and a title-and-icon fallback when a page offers
 * nothing better.
 *
 * This fetches URLs that users type, so it refuses anything that is not a
 * public web address (no localhost, no private network ranges), caps how
 * much it reads, and gives up quickly.
 */

const TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_REDIRECTS = 4;
const USER_AGENT = "ProjectBuzzLinkPreview/1.0";

export class LinkPreviewError extends Error {}

function isPrivateAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const [a, b] = address.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }
  if (version === 6) {
    const lower = address.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      /^fe[89ab]/.test(lower) ||
      lower.startsWith("ff")
    );
  }
  return true;
}

/** Throws unless the URL is http(s) and resolves only to public addresses. */
async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new LinkPreviewError("Only http and https links are supported.");
  }
  if (url.username || url.password) {
    throw new LinkPreviewError("Links with credentials are not supported.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host)) {
    if (isPrivateAddress(host)) throw new LinkPreviewError("That address is not public.");
    return;
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || !host.includes(".")) {
    throw new LinkPreviewError("That address is not public.");
  }
  let addresses;
  try {
    addresses = await lookup(host, { all: true });
  } catch {
    throw new LinkPreviewError("We couldn't find that site.");
  }
  if (addresses.length === 0 || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new LinkPreviewError("That address is not public.");
  }
}

/** GET with manual redirects so every hop is checked, not just the first. */
async function safeFetch(start: URL, accept: string): Promise<{ response: Response; url: URL }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": USER_AGENT, accept },
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel();
      url = new URL(location, url);
      continue;
    }
    return { response, url };
  }
  throw new LinkPreviewError("That link redirects too many times.");
}

async function readCapped(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  return new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks));
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match);
}

function clean(value: string | undefined | null): string | null {
  if (!value) return null;
  const text = decodeEntities(value).replace(/\s+/g, " ").trim();
  return text || null;
}

/** Reads attributes of every <meta> and <link> tag in the document head. */
function parseTags(html: string, tag: "meta" | "link"): Record<string, string>[] {
  const tags: Record<string, string>[] = [];
  const tagPattern = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
  for (const match of html.matchAll(tagPattern)) {
    const attributes: Record<string, string> = {};
    for (const attr of match[1].matchAll(/([a-zA-Z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) {
      attributes[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? "";
    }
    tags.push(attributes);
  }
  return tags;
}

function absoluteUrl(value: string | null | undefined, base: URL): string | null {
  if (!value) return null;
  try {
    const url = new URL(decodeEntities(value.trim()), base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function fallbackPreview(url: URL): LinkPreview {
  return {
    url: url.toString(),
    kind: "page",
    title: url.hostname.replace(/^www\./, "") + (url.pathname === "/" ? "" : url.pathname),
    description: null,
    siteName: url.hostname.replace(/^www\./, ""),
    image: null,
    icon: new URL("/favicon.ico", url).toString(),
    github: null,
  };
}

async function pagePreview(start: URL): Promise<LinkPreview> {
  let response: Response;
  let url: URL;
  try {
    ({ response, url } = await safeFetch(start, "text/html,application/xhtml+xml"));
  } catch (error) {
    if (error instanceof LinkPreviewError) throw error;
    // Timeouts and network failures: the link may still be fine to post.
    return fallbackPreview(start);
  }

  const fallback = fallbackPreview(url);
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !/html/i.test(contentType)) {
    await response.body?.cancel();
    return { ...fallback, url: start.toString() };
  }

  const html = await readCapped(response);
  const meta = new Map<string, string>();
  for (const tag of parseTags(html, "meta")) {
    const key = (tag.property ?? tag.name ?? "").toLowerCase();
    if (key && tag.content && !meta.has(key)) meta.set(key, tag.content);
  }
  const icons = parseTags(html, "link").filter((tag) =>
    /(^|\s)(icon|apple-touch-icon)(\s|$)/i.test(tag.rel ?? ""),
  );
  const icon =
    icons.find((tag) => /apple-touch-icon/i.test(tag.rel ?? ""))?.href ?? icons[0]?.href;
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];

  return {
    url: start.toString(),
    kind: "page",
    title:
      clean(meta.get("og:title")) ??
      clean(meta.get("twitter:title")) ??
      clean(titleTag) ??
      fallback.title,
    description:
      clean(meta.get("og:description")) ??
      clean(meta.get("twitter:description")) ??
      clean(meta.get("description")),
    siteName: clean(meta.get("og:site_name")) ?? fallback.siteName,
    image: absoluteUrl(meta.get("og:image") ?? meta.get("twitter:image"), url),
    icon: absoluteUrl(icon, url) ?? fallback.icon,
    github: null,
  };
}

type GitHubRepo = {
  full_name?: string;
  description?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  language?: string | null;
  html_url?: string;
  owner?: { avatar_url?: string };
};

/** github.com/{owner}/{repo}[/...] gets a repo card from the GitHub API. */
async function githubPreview(url: URL): Promise<LinkPreview | null> {
  const [owner, repo] = url.pathname.split("/").filter(Boolean);
  if (!owner || !repo || !/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) return null;

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}`,
      {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "user-agent": USER_AGENT,
          accept: "application/vnd.github+json",
          "x-github-api-version": "2022-11-28",
        },
      },
    );
    if (!response.ok) return null; // private, missing, or rate limited: use the page instead
    const data = (await response.json()) as GitHubRepo;
    if (!data.full_name) return null;
    return {
      url: url.toString(),
      kind: "github",
      title: data.full_name,
      description: data.description?.trim() || null,
      siteName: "GitHub",
      image: null,
      icon: "https://github.com/favicon.ico",
      github: {
        fullName: data.full_name,
        stars: data.stargazers_count ?? 0,
        forks: data.forks_count ?? 0,
        language: data.language ?? null,
        ownerAvatar: data.owner?.avatar_url ?? null,
      },
    };
  } catch {
    return null;
  }
}

/** Accepts "example.com/page" as well as full URLs. */
export function parseLinkInput(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

export async function getLinkPreview(input: string): Promise<LinkPreview> {
  const url = parseLinkInput(input);
  if (!url) throw new LinkPreviewError("That doesn't look like a web address.");
  await assertPublicUrl(url);

  if (url.hostname === "github.com" || url.hostname === "www.github.com") {
    const repo = await githubPreview(url);
    if (repo) return repo;
  }
  return pagePreview(url);
}

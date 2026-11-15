"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Create actions: "solid" is the main one, "outline" sits beside it. */
  primary?: "solid" | "outline";
};

const iconProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const items: NavItem[] = [
  {
    href: "/",
    label: "Buzzing Now",
    icon: (
      <svg {...iconProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
    ),
  },
  {
    href: "/explore",
    label: "Explore",
    icon: (
      <svg {...iconProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    href: "/post",
    label: "New Post",
    primary: "solid",
    icon: (
      <svg {...iconProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/projects/new",
    label: "New Project",
    primary: "outline",
    icon: (
      <svg {...iconProps}>
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M12 11v6" />
        <path d="M9 14h6" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppNav() {
  const pathname = usePathname();
  return <AppNavView pathname={pathname} />;
}

/** Rendered while the pathname is not yet known: same nav, no active item. */
export function AppNavFallback() {
  return <AppNavView pathname={null} />;
}

/**
 * Primary navigation. One component, three shapes:
 * bottom bar below 768px, icon-only left sidebar from 768px,
 * labeled left sidebar from 1024px.
 */
function AppNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:inset-x-auto md:top-0 md:bottom-auto md:flex md:h-dvh md:w-20 md:shrink-0 md:flex-col md:border-t-0 md:border-r md:bg-transparent md:px-3 md:py-4 md:backdrop-blur-none lg:w-60"
    >
      <Link
        href="/"
        aria-label="ProjectBuzz home"
        className="mb-4 hidden h-12 items-center justify-center gap-2.5 rounded-xl text-xl font-bold tracking-tight text-gt-navy md:flex lg:justify-start lg:px-3"
      >
        <LogoMark />
        <span className="hidden lg:inline">
          <Wordmark />
        </span>
      </Link>

      <ul className="grid h-16 grid-cols-5 md:flex md:h-auto md:flex-col md:gap-1.5">
        {items.map((item) => {
          const active = pathname !== null && isActive(pathname, item.href);
          const tone =
            item.primary === "solid"
              ? "md:bg-gt-gold md:text-gt-navy md:hover:bg-gt-gold/85"
              : item.primary === "outline"
                ? "md:border md:border-gt-gold md:text-gt-navy md:hover:bg-gt-gold/20"
                : active
                  ? "md:bg-gt-gold/20 md:hover:bg-gt-gold/30"
                  : "hover:text-gt-navy md:hover:bg-gt-navy/5";
          return (
            <li
              key={item.href}
              className={
                item.primary === "solid"
                  ? "md:order-last md:mt-3"
                  : item.primary === "outline"
                    ? "md:order-last"
                    : undefined
              }
            >
              <Link
                href={item.href}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors md:mx-auto md:h-12 md:w-12 md:flex-row md:rounded-xl lg:w-full lg:justify-start lg:gap-3 lg:px-3 lg:text-[15px] ${
                  active ? "text-gt-navy" : "text-muted"
                } ${tone} ${item.primary ? "lg:justify-center lg:font-semibold" : ""}`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full md:h-auto md:w-auto md:bg-transparent ${
                    item.primary === "solid"
                      ? "bg-gt-gold text-gt-navy"
                      : item.primary === "outline"
                        ? "border border-gt-gold text-gt-navy md:border-0"
                        : active
                          ? "bg-gt-gold/25"
                          : ""
                  }`}
                >
                  {item.icon}
                </span>
                <span className={`md:sr-only lg:not-sr-only ${active ? "font-semibold" : ""}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

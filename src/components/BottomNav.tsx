"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  primary?: boolean;
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
    label: "Feed",
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
    label: "Post",
    primary: true,
    icon: (
      <svg {...iconProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
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

export function BottomNav() {
  const pathname = usePathname();
  return <BottomNavView pathname={pathname} />;
}

/** Rendered while the pathname is not yet known: same nav, no active tab. */
export function BottomNavFallback() {
  return <BottomNavView pathname={null} />;
}

function BottomNavView({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="grid h-16 grid-cols-4">
        {items.map((item) => {
          const active = pathname !== null && isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full min-h-12 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active ? "text-gt-navy" : "text-muted"
                }`}
              >
                <span
                  className={
                    item.primary
                      ? "flex h-8 w-12 items-center justify-center rounded-full bg-gt-gold text-gt-navy"
                      : `flex h-8 w-12 items-center justify-center rounded-full ${
                          active ? "bg-gt-gold/25" : ""
                        }`
                  }
                >
                  {item.icon}
                </span>
                <span className={active ? "font-semibold" : undefined}>
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

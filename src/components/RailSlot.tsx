"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Hides the right rail on profiles, where the page is about one person and
 * the main column widens into that space.
 */
export function RailSlot({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onProfile = pathname === "/profile" || pathname.startsWith("/u/");
  if (onProfile) return null;
  return children;
}

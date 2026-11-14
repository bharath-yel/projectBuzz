import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AppNav, AppNavFallback } from "@/components/AppNav";
import { RightRail } from "@/components/RightRail";

/**
 * Shell for the signed-in app.
 * - Below 768px: top bar, single column, bottom nav.
 * - 768px and up: icon-only left sidebar, centered column.
 * - 1024px and up: labeled left sidebar, centered column, right rail.
 * Screens that should not show the nav (sign-in, onboarding) belong outside
 * this route group.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[1240px]">
      {/* usePathname suspends on routes with unknown dynamic params. */}
      <Suspense fallback={<AppNavFallback />}>
        <AppNav />
      </Suspense>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
          <div className="flex h-14 items-center px-4">
            <Link
              href="/"
              className="flex min-h-12 items-center text-lg font-bold tracking-tight text-gt-navy"
            >
              Project<span className="text-gt-gold">Buzz</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[600px] px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-6 md:pt-8 md:pb-10">
          {children}
        </main>
      </div>

      <RightRail />
    </div>
  );
}

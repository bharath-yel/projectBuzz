import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { BottomNav, BottomNavFallback } from "@/components/BottomNav";

/**
 * Shell for the signed-in app: a phone-width column with a top bar and the
 * bottom nav. Screens that should not show the nav (sign-in, onboarding)
 * belong outside this route group.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-surface shadow-sm">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="flex h-14 items-center px-4">
          <Link
            href="/"
            className="flex min-h-12 items-center text-lg font-bold tracking-tight text-gt-navy"
          >
            Project<span className="text-gt-gold">Buzz</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {/* usePathname suspends on routes with unknown dynamic params. */}
      <Suspense fallback={<BottomNavFallback />}>
        <BottomNav />
      </Suspense>
    </div>
  );
}

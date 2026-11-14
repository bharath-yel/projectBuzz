import type { ReactNode } from "react";
import { LogoMark, Wordmark } from "@/components/Logo";

/**
 * Focused screens with no app navigation: sign-in and onboarding.
 * A single centered column on every screen size.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))] md:justify-center md:py-12">
      <div className="mb-6 flex items-center justify-center gap-2.5 text-2xl font-bold tracking-tight text-gt-navy">
        <LogoMark size={32} />
        <span>
          <Wordmark />
        </span>
      </div>
      <main className="rounded-2xl border border-border bg-background p-5 sm:p-7">
        {children}
      </main>
    </div>
  );
}

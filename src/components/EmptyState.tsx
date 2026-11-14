import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  children: ReactNode;
};

/** Friendly placeholder for screens and lists that have nothing to show yet. */
export function EmptyState({ icon, title, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center">
      <div
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gt-gold/20 text-2xl"
      >
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gt-navy">{title}</h2>
      <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-muted">
        {children}
      </p>
    </div>
  );
}

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  /** Shown right after the title, e.g. the logo. */
  after?: ReactNode;
  centered?: boolean;
  /** Drop the bottom margin, for when a wrapper supplies the spacing. */
  flush?: boolean;
  /** White text, for a dark background. */
  inverse?: boolean;
  /** A louder title: all caps and 1.2x the usual size. */
  loud?: boolean;
};

export function PageHeader({
  title,
  subtitle,
  after,
  centered,
  flush,
  inverse,
  loud,
}: PageHeaderProps) {
  return (
    <header
      className={`${flush ? "" : "mb-5"} ${centered ? "text-center" : ""}`}
    >
      <h1
        className={`flex items-center gap-2 font-bold ${
          loud
            ? "text-[1.8rem] leading-tight tracking-normal uppercase"
            : "text-2xl tracking-tight"
        } ${
          inverse ? "text-white text-shadow-sm" : "text-gt-navy"
        } ${centered ? "justify-center" : ""}`}
      >
        {title}
        {after}
      </h1>
      {subtitle ? (
        <p
          className={`mt-1 text-sm ${inverse ? "font-medium text-white text-shadow-sm" : "text-muted"}`}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

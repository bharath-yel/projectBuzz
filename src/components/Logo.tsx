/** The ProjectBuzz hexagon mark. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden>
      <path d="M14 2 24.4 8v12L14 26 3.6 20V8Z" className="fill-gt-gold" />
      <path
        d="M9 16.5l3.2-3.2 2.6 2 3.6-4.6"
        fill="none"
        className="stroke-gt-navy"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <>
      Project<span className="text-gt-gold">Buzz</span>
    </>
  );
}

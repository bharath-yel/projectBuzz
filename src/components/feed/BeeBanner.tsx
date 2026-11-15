import type { CSSProperties, ReactNode } from "react";

/**
 * Each bee flies along its own lane. Lanes hug the top and bottom edges so the
 * bees pass around the heading instead of over it. `start` is where the bee
 * sits when the viewer has asked for reduced motion.
 */
const BEES = [
  {
    top: "6%",
    size: 24,
    seconds: 3.1,
    delay: -0.1,
    start: "2%",
    reverse: false,
  },
  { top: "82%", size: 22, seconds: 3, delay: -0.2, start: "7%", reverse: true },
  {
    top: "10%",
    size: 20,
    seconds: 2.9,
    delay: -1.2,
    start: "11%",
    reverse: false,
  },
  {
    top: "70%",
    size: 14,
    seconds: 4,
    delay: -3.3,
    start: "16%",
    reverse: false,
  },
  {
    top: "2%",
    size: 24,
    seconds: 3.3,
    delay: -1.9,
    start: "21%",
    reverse: true,
  },
  {
    top: "67%",
    size: 14,
    seconds: 4.1,
    delay: -4,
    start: "25%",
    reverse: false,
  },
  {
    top: "0%",
    size: 18,
    seconds: 4.7,
    delay: -2,
    start: "30%",
    reverse: false,
  },
  {
    top: "76%",
    size: 22,
    seconds: 4.1,
    delay: -3.3,
    start: "34%",
    reverse: true,
  },
  {
    top: "3%",
    size: 24,
    seconds: 4.1,
    delay: -0.8,
    start: "39%",
    reverse: false,
  },
  {
    top: "67%",
    size: 22,
    seconds: 4.4,
    delay: -0.3,
    start: "43%",
    reverse: false,
  },
  {
    top: "4%",
    size: 20,
    seconds: 4.3,
    delay: -3.3,
    start: "48%",
    reverse: true,
  },
  {
    top: "75%",
    size: 18,
    seconds: 4.8,
    delay: -1.4,
    start: "53%",
    reverse: false,
  },
  {
    top: "15%",
    size: 16,
    seconds: 4.3,
    delay: -0.4,
    start: "57%",
    reverse: false,
  },
  {
    top: "72%",
    size: 18,
    seconds: 3.9,
    delay: -2.8,
    start: "62%",
    reverse: true,
  },
  {
    top: "5%",
    size: 14,
    seconds: 5,
    delay: -2.6,
    start: "66%",
    reverse: false,
  },
  {
    top: "69%",
    size: 20,
    seconds: 3.6,
    delay: -1.5,
    start: "71%",
    reverse: false,
  },
  {
    top: "19%",
    size: 22,
    seconds: 3,
    delay: -1.7,
    start: "75%",
    reverse: true,
  },
  {
    top: "83%",
    size: 24,
    seconds: 3.5,
    delay: -1.2,
    start: "80%",
    reverse: false,
  },
  {
    top: "9%",
    size: 14,
    seconds: 4.6,
    delay: -3.9,
    start: "85%",
    reverse: false,
  },
  {
    top: "84%",
    size: 24,
    seconds: 3.8,
    delay: -0.2,
    start: "89%",
    reverse: true,
  },
  {
    top: "14%",
    size: 22,
    seconds: 3.5,
    delay: -3.5,
    start: "94%",
    reverse: false,
  },
];

/**
 * A Tech Gold to navy banner with little bees flying across it. The content
 * sits on top and should use light text: the middle of the gradient is dark.
 */
export function BeeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="relative mb-5 overflow-hidden rounded-2xl bg-linear-to-r from-gt-gold to-gt-navy to-90% px-4 py-8">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {BEES.map((bee, index) => (
          <div
            key={index}
            className="absolute inset-x-0 motion-safe:animate-[bee-fly_linear_infinite]"
            style={
              {
                top: bee.top,
                animationDuration: `${bee.seconds}s`,
                animationDelay: `${bee.delay}s`,
                animationDirection: bee.reverse ? "reverse" : "normal",
                "--bee-start": bee.start,
              } as CSSProperties
            }
          >
            <div
              className="w-fit motion-safe:animate-[bee-bob_1.6s_ease-in-out_infinite] motion-reduce:ml-[var(--bee-start)]"
              style={{ animationDelay: `${bee.delay}s` }}
            >
              <Bee size={bee.size} flipped={bee.reverse} />
            </div>
          </div>
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

/** A striped bee in the style of the logo, facing right unless flipped. */
function Bee({ size, flipped }: { size: number; flipped: boolean }) {
  return (
    <svg
      width={size}
      height={(size * 40) / 48}
      viewBox="0 0 48 40"
      style={flipped ? { transform: "scaleX(-1)" } : undefined}
    >
      <g transform="rotate(-20 20 10)">
        <ellipse
          cx="20"
          cy="10"
          rx="6.5"
          ry="9"
          fill="#fff"
          stroke="#cfd8e3"
          strokeWidth="1"
          className="origin-bottom [transform-box:fill-box] motion-safe:animate-[bee-wing_0.18s_linear_infinite]"
        />
      </g>
      <g stroke="#000" strokeWidth="2" strokeLinecap="round">
        <path d="M15 33v5M24 35v4M33 33v5" />
      </g>
      <ellipse cx="24" cy="24" rx="18" ry="12" fill="#f8e21c" />
      <rect x="12" y="15.1" width="5" height="17.8" />
      <rect x="21" y="12.2" width="5" height="23.6" />
      <rect x="30" y="14.6" width="5" height="18.8" />
      <circle cx="38.5" cy="21.5" r="1.6" />
    </svg>
  );
}

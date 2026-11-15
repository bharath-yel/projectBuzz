import Image from "next/image";

/** The ProjectBuzz mark: a lightbulb with three yellow jackets. The file is public/logo.png. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return <Image src="/logo.png" alt="" width={size} height={size} priority />;
}

export function Wordmark() {
  return (
    <span className="font-display text-[0.85em]">
      Project<span className="text-gt-gold">Buzz</span>
    </span>
  );
}

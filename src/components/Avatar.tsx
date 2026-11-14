import Image from "next/image";

type AvatarProps = {
  src: string | null | undefined;
  /** Used for the initials shown when there is no photo. */
  name: string;
  /** Width and height in pixels. */
  size?: number;
};

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/**
 * A round profile photo, or initials when there is none. Decorative: always
 * shown next to the person's name, so it has no alt text of its own.
 */
export function Avatar({ src, name, size = 40 }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        // Avatars are resized in the browser before upload; serve them as-is.
        unoptimized
        className="shrink-0 rounded-full bg-surface object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-gt-navy font-semibold text-white select-none"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initialsOf(name)}
    </span>
  );
}

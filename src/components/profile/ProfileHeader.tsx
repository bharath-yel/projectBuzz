import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { buttonSecondary, buttonText } from "@/components/ui/styles";
import { signOut } from "@/lib/auth/actions";
import type { Profile } from "@/lib/auth/session";

type ProfileHeaderProps = {
  profile: Profile;
  /** True when the viewer is looking at their own profile. */
  isOwn: boolean;
};

export function ProfileHeader({ profile, isOwn }: ProfileHeaderProps) {
  return (
    <header className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.name} size={80} />
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight break-words text-gt-navy">
            {profile.name || "Unnamed Yellow Jacket"}
          </h1>
          {profile.major || profile.year ? (
            <p className="mt-0.5 text-sm text-muted">
              {profile.major}
              {profile.major && profile.year ? " · " : null}
              {profile.year ? (
                <span className="whitespace-nowrap">{profile.year}</span>
              ) : null}
            </p>
          ) : null}
          {isOwn ? (
            <p className="mt-0.5 truncate text-sm text-muted">{profile.gt_email}</p>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-4 text-[15px] leading-relaxed whitespace-pre-line text-foreground">
          {profile.bio}
        </p>
      ) : isOwn ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Add a short bio so people know what you&apos;re into.
        </p>
      ) : null}

      {isOwn ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/profile/edit" className={buttonSecondary}>
            Edit profile
          </Link>
          <form action={signOut}>
            <button type="submit" className={buttonText}>
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </header>
  );
}

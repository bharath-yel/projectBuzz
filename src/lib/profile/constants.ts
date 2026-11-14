/** Limits mirror the check constraints on public.profiles. */
export const PROFILE_LIMITS = {
  name: 80,
  major: 80,
  bio: 500,
  skills: 30,
  skillLength: 30,
} as const;

export const YEAR_OPTIONS = [
  "First-year",
  "Second-year",
  "Third-year",
  "Fourth-year",
  "Fifth-year+",
  "Graduate",
] as const;

/** Suggestions for the major field. Any text is accepted. */
export const MAJOR_SUGGESTIONS = [
  "Aerospace Engineering",
  "Applied Languages and Intercultural Studies",
  "Applied Physics",
  "Architecture",
  "Atmospheric and Oceanic Sciences",
  "Biochemistry",
  "Biology",
  "Biomedical Engineering",
  "Building Construction",
  "Business Administration",
  "Chemical and Biomolecular Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computational Media",
  "Computer Engineering",
  "Computer Science",
  "Earth and Atmospheric Sciences",
  "Economics",
  "Electrical Engineering",
  "Environmental Engineering",
  "History, Technology, and Society",
  "Industrial Design",
  "Industrial Engineering",
  "International Affairs",
  "Literature, Media, and Communication",
  "Materials Science and Engineering",
  "Mathematics",
  "Mechanical Engineering",
  "Music Technology",
  "Neuroscience",
  "Nuclear and Radiological Engineering",
  "Physics",
  "Psychology",
  "Public Policy",
] as const;

export const AVATAR_BUCKET = "avatars";

/** Public URL prefix for one user's avatar folder. */
export function avatarUrlPrefix(userId: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${AVATAR_BUCKET}/${userId}/`;
}

/** Trim, drop empties and case-insensitive duplicates, cap count and length. */
export function cleanSkills(values: readonly unknown[]): string[] {
  const seen = new Set<string>();
  const skills: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const skill = value.trim().replace(/\s+/g, " ").slice(0, PROFILE_LIMITS.skillLength);
    const key = skill.toLowerCase();
    if (!skill || seen.has(key)) continue;
    seen.add(key);
    skills.push(skill);
    if (skills.length === PROFILE_LIMITS.skills) break;
  }
  return skills;
}

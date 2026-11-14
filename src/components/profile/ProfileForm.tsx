"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { SkillsInput } from "@/components/profile/SkillsInput";
import { Field } from "@/components/ui/Field";
import { buttonPrimary, buttonSecondary, inputClass } from "@/components/ui/styles";
import { saveProfile, type ProfileFormState } from "@/lib/profile/actions";
import {
  MAJOR_SUGGESTIONS,
  PROFILE_LIMITS,
  YEAR_OPTIONS,
} from "@/lib/profile/constants";

export type ProfileFormValues = {
  name: string;
  major: string;
  year: string;
  bio: string;
  skills: string[];
  avatarUrl: string | null;
};

type ProfileFormProps = {
  /** "onboarding" continues to the feed; "edit" returns to the profile. */
  mode: "onboarding" | "edit";
  userId: string;
  initial: ProfileFormValues;
};

const initialState: ProfileFormState = { errors: {} };

export function ProfileForm({ mode, userId, initial }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(saveProfile, initialState);
  const [name, setName] = useState(initial.name);
  const [major, setMajor] = useState(initial.major);
  const [year, setYear] = useState(initial.year);
  const [bio, setBio] = useState(initial.bio);
  const [skills, setSkills] = useState(initial.skills);
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [uploading, setUploading] = useState(false);

  const { errors } = state;
  const describedBy = (field: string, hasError: boolean) =>
    hasError ? `${field}-error` : undefined;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="skills" value={JSON.stringify(skills)} />
      <input type="hidden" name="avatar_url" value={avatarUrl ?? ""} />

      <AvatarUpload
        userId={userId}
        name={name}
        value={avatarUrl}
        onChange={setAvatarUrl}
        onUploadingChange={setUploading}
      />

      <Field htmlFor="name" label="Name" error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={PROFILE_LIMITS.name}
          placeholder="George P. Burdell"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy("name", Boolean(errors.name))}
          className={inputClass}
        />
      </Field>

      <Field htmlFor="major" label="Major" error={errors.major}>
        <input
          id="major"
          name="major"
          type="text"
          list="major-suggestions"
          autoComplete="off"
          maxLength={PROFILE_LIMITS.major}
          placeholder="Mechanical Engineering"
          value={major}
          onChange={(event) => setMajor(event.target.value)}
          aria-invalid={errors.major ? true : undefined}
          aria-describedby={describedBy("major", Boolean(errors.major))}
          className={inputClass}
        />
        <datalist id="major-suggestions">
          {MAJOR_SUGGESTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </Field>

      <Field htmlFor="year" label="Year" error={errors.year}>
        <select
          id="year"
          name="year"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          aria-invalid={errors.year ? true : undefined}
          aria-describedby={describedBy("year", Boolean(errors.year))}
          className={inputClass}
        >
          <option value="" disabled>
            Pick your year
          </option>
          {YEAR_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>

      <Field
        htmlFor="bio"
        label="Bio"
        hint={`Optional · ${bio.length}/${PROFILE_LIMITS.bio}`}
        error={errors.bio}
      >
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={PROFILE_LIMITS.bio}
          placeholder="What are you building, or what do you want to build?"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          aria-invalid={errors.bio ? true : undefined}
          aria-describedby={describedBy("bio", Boolean(errors.bio))}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </Field>

      <Field htmlFor="skills" label="Skills" hint="Optional">
        <SkillsInput id="skills" value={skills} onChange={setSkills} />
      </Field>

      {errors.form ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={pending || uploading}
          className={`${buttonPrimary} w-full sm:w-auto sm:flex-1`}
        >
          {pending
            ? "Saving…"
            : uploading
              ? "Uploading photo…"
              : mode === "edit"
                ? "Save changes"
                : "Finish and go to the feed"}
        </button>
        {mode === "edit" ? (
          <Link href="/profile" className={`${buttonSecondary} w-full sm:w-auto`}>
            Cancel
          </Link>
        ) : null}
      </div>
    </form>
  );
}

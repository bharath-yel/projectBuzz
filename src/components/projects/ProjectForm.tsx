"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { TagPicker } from "@/components/projects/TagPicker";
import { Field } from "@/components/ui/Field";
import { buttonPrimary, buttonSecondary, buttonText, inputClass } from "@/components/ui/styles";
import { resizeImage } from "@/lib/images/resize";
import { createProject, setProjectCover } from "@/lib/projects/actions";
import { COVER_BUCKET, PROJECT_LIMITS, STAGES } from "@/lib/projects/constants";
import type { Tag } from "@/lib/projects/queries";
import { createClient } from "@/lib/supabase/client";

const COVER_MAX_EDGE = 1600;

type Errors = Partial<Record<"title" | "problem" | "cover" | "form", string>>;

const VISIBILITY = [
  { value: "public", label: "Public", hint: "Any signed-in Georgia Tech student can see it." },
  { value: "private", label: "Private", hint: "Only you and contributors you add." },
] as const;

export function ProjectForm({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const coverInputId = useId();
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [stage, setStage] = useState<string>("idea");
  const [visibility, setVisibility] = useState<string>("public");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [cover, setCover] = useState<{ blob: Blob; url: string } | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Free the preview image when it is replaced or the form goes away.
  useEffect(() => {
    return () => {
      if (cover) URL.revokeObjectURL(cover.url);
    };
  }, [cover]);

  async function handleCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const blob = await resizeImage(file, { maxEdge: COVER_MAX_EDGE });
      setCover({ blob, url: URL.createObjectURL(blob) });
      setErrors((current) => ({ ...current, cover: undefined }));
    } catch {
      setErrors((current) => ({
        ...current,
        cover: "We couldn't read that image. Try a JPG or PNG.",
      }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) {
      setErrors({ title: "Give your project a title." });
      return;
    }
    setErrors({});
    startTransition(async () => {
      setStatus("Creating project…");
      const result = await createProject({ title, problem, stage, visibility, tagIds });
      if (!result.ok) {
        setErrors(result.errors);
        setStatus(null);
        return;
      }

      if (cover) {
        setStatus("Uploading cover…");
        const supabase = createClient();
        const path = `${result.id}/cover.jpg`;
        const { error } = await supabase.storage
          .from(COVER_BUCKET)
          .upload(path, cover.blob, { upsert: true, contentType: "image/jpeg" });
        if (!error) {
          const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
          await setProjectCover(result.id, `${data.publicUrl}?v=${Date.now()}`);
        }
        // A failed cover upload should not lose the project: carry on without it.
      }
      router.push(`/projects/${result.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field htmlFor="title" label="Title" error={errors.title}>
        <input
          id="title"
          type="text"
          value={title}
          maxLength={PROJECT_LIMITS.title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Low-cost prosthetic hand"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={inputClass}
        />
      </Field>

      <Field
        htmlFor="problem"
        label="What problem are you working on?"
        hint="Optional"
        error={errors.problem}
      >
        <textarea
          id="problem"
          rows={3}
          value={problem}
          maxLength={PROJECT_LIMITS.problem}
          onChange={(event) => setProblem(event.target.value)}
          placeholder="Who is it for, and what's hard about it? A rough answer is fine."
          aria-invalid={errors.problem ? true : undefined}
          aria-describedby={errors.problem ? "problem-error" : undefined}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-gt-navy">Stage</legend>
        <div className="grid grid-cols-3 gap-2">
          {STAGES.map((option) => (
            <label
              key={option.value}
              className="flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-background px-2 py-2 text-center transition-colors hover:border-gt-navy has-checked:border-gt-navy has-checked:bg-gt-navy has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gt-navy"
            >
              <input
                type="radio"
                name="stage"
                value={option.value}
                checked={stage === option.value}
                onChange={() => setStage(option.value)}
                className="sr-only"
              />
              <span className="text-[15px] font-semibold">{option.label}</span>
              <span className="text-xs opacity-75">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-gt-navy">Who can see it</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {VISIBILITY.map((option) => (
            <label
              key={option.value}
              className="flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border border-border bg-background px-4 py-2.5 transition-colors hover:border-gt-navy has-checked:border-gt-navy has-checked:bg-gt-gold/20 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gt-navy"
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={visibility === option.value}
                onChange={() => setVisibility(option.value)}
                className="sr-only"
              />
              <span className="text-[15px] font-semibold text-gt-navy">{option.label}</span>
              <span className="text-xs leading-snug text-muted">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-gt-navy">Cover image</span>
          <span className="text-xs text-muted">Optional</span>
        </div>
        {cover ? (
          <div className="relative mb-2 aspect-[16/9] overflow-hidden rounded-xl border border-border bg-surface">
            <Image src={cover.url} alt="Cover preview" fill unoptimized className="object-cover" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <label
            htmlFor={coverInputId}
            className={`${buttonSecondary} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gt-navy`}
          >
            {cover ? "Change image" : "Add a cover image"}
            <input
              id={coverInputId}
              type="file"
              accept="image/*"
              onChange={handleCover}
              className="sr-only"
            />
          </label>
          {cover ? (
            <button type="button" onClick={() => setCover(null)} className={buttonText}>
              Remove
            </button>
          ) : (
            <span className="text-xs text-muted">A sketch or a messy bench photo works.</span>
          )}
        </div>
        {errors.cover ? (
          <p role="alert" className="mt-1.5 text-sm text-red-700">
            {errors.cover}
          </p>
        ) : null}
      </div>

      <Field htmlFor="tags" label="Tags" hint="Optional">
        <TagPicker id="tags" tags={tags} value={tagIds} onChange={setTagIds} />
      </Field>

      {errors.form ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {errors.form}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <button type="submit" disabled={pending} className={`${buttonPrimary} w-full sm:w-auto sm:flex-1`}>
          {pending ? (status ?? "Creating project…") : "Create project"}
        </button>
        <Link href="/profile" className={`${buttonSecondary} w-full sm:w-auto`}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

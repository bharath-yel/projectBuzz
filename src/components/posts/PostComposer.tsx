"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { FileCard } from "@/components/posts/FileCard";
import { LinkCard } from "@/components/posts/LinkCard";
import { Field } from "@/components/ui/Field";
import { buttonPrimary, buttonSecondary, inputClass } from "@/components/ui/styles";
import {
  classifyFile,
  formatBytes,
  MAX_FILE_BYTES,
  safeExtension,
  type FileMeta,
} from "@/lib/attachments/kinds";
import { pdfFirstPage, videoFrame } from "@/lib/attachments/previews";
import { resizeImage } from "@/lib/images/resize";
import type { LinkPreview } from "@/lib/link-preview/types";
import { createPost, type NewAttachment } from "@/lib/posts/actions";
import {
  ATTACHMENT_BUCKET,
  attachmentFolder,
  PHOTO_MAX_EDGE,
  PHOTO_PREVIEW_EDGE,
  POST_LIMITS,
} from "@/lib/posts/constants";
import { projectSlug } from "@/lib/projects/constants";
import { createClient } from "@/lib/supabase/client";

type ProjectOption = { id: string; title: string };

type Draft =
  | { key: string; type: "photo"; full: Blob; preview: Blob; url: string }
  | { key: string; type: "link"; preview: LinkPreview }
  | {
      key: string;
      type: "pdf" | "video" | "file";
      file: File;
      /** Preview image made in the browser; null if it could not be made. */
      preview: Blob | null;
      url: string | null;
      meta: FileMeta;
      allowDownload: boolean;
    };

type PostComposerProps = {
  userId: string;
  projects: ProjectOption[];
  /** Project to start on, e.g. when arriving from a project page. */
  initialProjectId: string | null;
};

const KINDS = [
  { value: "ship", label: "Ship", hint: "Something you made or got working" },
  { value: "milestone", label: "Milestone", hint: "A moment worth marking" },
] as const;

/** The `#word` being typed just before the caret, if any. */
function mentionAt(text: string, caret: number): { start: number; query: string } | null {
  const match = /(^|\s)#([\w-]*)$/.exec(text.slice(0, caret));
  if (!match) return null;
  return { start: caret - match[2].length - 1, query: match[2].toLowerCase() };
}

export function PostComposer({ userId, projects, initialProjectId }: PostComposerProps) {
  const router = useRouter();
  const photoInputId = useId();
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [projectId, setProjectId] = useState(
    projects.some((project) => project.id === initialProjectId)
      ? (initialProjectId as string)
      : projects.length === 1
        ? projects[0].id
        : "",
  );
  const [kind, setKind] = useState<string>("ship");
  const [body, setBody] = useState("");
  const [question, setQuestion] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [mention, setMention] = useState<{ start: number; query: string } | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Release photo previews when the composer goes away.
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  useEffect(() => {
    return () => {
      for (const draft of draftsRef.current) {
        if (draft.type !== "link" && draft.url) URL.revokeObjectURL(draft.url);
      }
    };
  }, []);

  const room = POST_LIMITS.attachments - drafts.length;
  const selectedProject = projects.find((project) => project.id === projectId);
  const suggestions = mention
    ? projects
        .filter((project) => projectSlug(project.title).includes(mention.query))
        .slice(0, 5)
    : [];

  function handleBodyChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const text = event.target.value;
    setBody(text);
    setMention(mentionAt(text, event.target.selectionStart ?? text.length));
  }

  /** Picking a `#project` sets the project and removes the handle from the text. */
  function pickMention(project: ProjectOption) {
    if (!mention) return;
    const caret = bodyRef.current?.selectionStart ?? body.length;
    const next = (body.slice(0, mention.start) + body.slice(caret)).replace(/ {2,}/g, " ");
    setBody(next);
    setProjectId(project.id);
    setMention(null);
    setError(null);
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(mention.start, mention.start);
    });
  }

  function handleBodyKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!mention) return;
    if (event.key === "Escape") {
      setMention(null);
    } else if ((event.key === "Enter" || event.key === "Tab") && suggestions.length > 0) {
      event.preventDefault();
      pickMention(suggestions[0]);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (picked.length === 0) return;
    setPhotoBusy(true);
    setError(null);

    const problems: string[] = [];
    if (picked.length > room) {
      problems.push(`Only ${room} more ${room === 1 ? "attachment fits" : "attachments fit"}; the rest were skipped.`);
    }
    const added: Draft[] = [];
    for (const file of picked.slice(0, room)) {
      const kind = classifyFile(file);
      const key = crypto.randomUUID();

      if (kind === "photo") {
        try {
          // Compress here, in the browser, so the original never leaves the device.
          const full = await resizeImage(file, { maxEdge: PHOTO_MAX_EDGE });
          const preview = await resizeImage(full, { maxEdge: PHOTO_PREVIEW_EDGE, quality: 0.8 });
          added.push({ key, type: "photo", full, preview, url: URL.createObjectURL(preview) });
        } catch {
          problems.push(`We couldn't read ${file.name}. Try a JPG or PNG.`);
        }
        continue;
      }

      if (file.size > MAX_FILE_BYTES) {
        problems.push(`${file.name} is ${formatBytes(file.size)}. Files can be up to 25 MB.`);
        continue;
      }
      if (file.size === 0) {
        problems.push(`${file.name} is empty.`);
        continue;
      }

      const meta: FileMeta = {
        name: file.name,
        size: file.size,
        mime: file.type || "application/octet-stream",
      };
      let preview: Blob | null = null;
      if (kind === "pdf") {
        const result = await pdfFirstPage(file);
        preview = result.preview;
        if (result.pages) meta.pages = result.pages;
      } else if (kind === "video") {
        const result = await videoFrame(file);
        preview = result.preview;
        if (result.duration) meta.duration = result.duration;
      }
      added.push({
        key,
        type: kind,
        file,
        preview,
        url: preview ? URL.createObjectURL(preview) : null,
        meta,
        // PDFs and videos can be viewed in the app; other files are only useful downloaded.
        allowDownload: kind === "file",
      });
    }

    setDrafts((current) => [...current, ...added]);
    if (problems.length > 0) setError(problems.join(" "));
    setPhotoBusy(false);
  }

  function setAllowDownload(key: string, allowDownload: boolean) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key && draft.type !== "photo" && draft.type !== "link"
          ? { ...draft, allowDownload }
          : draft,
      ),
    );
  }

  async function addLink() {
    const value = linkInput.trim();
    if (!value || linkLoading || room <= 0) return;
    setLinkError(null);
    setLinkLoading(true);
    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(value)}`);
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok || !data || typeof data !== "object" || "error" in data) {
        const message =
          data && typeof data === "object" && "error" in data ? String(data.error) : null;
        setLinkError(message ?? "We couldn't load a preview for that link.");
        return;
      }
      setDrafts((current) => [
        ...current,
        { key: crypto.randomUUID(), type: "link", preview: data as LinkPreview },
      ]);
      setLinkInput("");
      setError(null);
    } catch {
      setLinkError("We couldn't reach the preview service. Check your connection.");
    } finally {
      setLinkLoading(false);
    }
  }

  function removeDraft(key: string) {
    setDrafts((current) => {
      const draft = current.find((item) => item.key === key);
      if (draft && draft.type !== "link" && draft.url) URL.revokeObjectURL(draft.url);
      return current.filter((item) => item.key !== key);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectId) {
      setError("Pick a project to post to.");
      return;
    }
    if (drafts.length === 0) {
      setError("Add at least one photo, file or link. Every post shows something.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const supabase = createClient();
      const folder = attachmentFolder(projectId, userId);
      const attachments: NewAttachment[] = [];

      const bucket = supabase.storage.from(ATTACHMENT_BUCKET);
      const uploadCount = drafts.filter((draft) => draft.type !== "link").length;
      let uploaded = 0;
      // "Duplicate" means an earlier attempt already uploaded this file.
      const failure = (results: { error: { message: string } | null }[]) =>
        results.find((result) => result.error && !/exists|duplicate/i.test(result.error.message))
          ?.error;

      for (const draft of drafts) {
        if (draft.type === "link") {
          attachments.push({ type: "link", preview: draft.preview });
          continue;
        }
        uploaded += 1;
        setStatus(`Uploading ${uploaded} of ${uploadCount}…`);

        let failed;
        if (draft.type === "photo") {
          const filePath = `${folder}${draft.key}.jpg`;
          const previewPath = `${folder}${draft.key}-preview.jpg`;
          failed = failure(
            await Promise.all([
              bucket.upload(filePath, draft.full, { contentType: "image/jpeg" }),
              bucket.upload(previewPath, draft.preview, { contentType: "image/jpeg" }),
            ]),
          );
          attachments.push({ type: "photo", filePath, previewPath });
        } else {
          const filePath = `${folder}${draft.key}.${safeExtension(draft.file.name)}`;
          const previewPath = draft.preview ? `${folder}${draft.key}-preview.png` : null;
          failed = failure(
            await Promise.all([
              bucket.upload(filePath, draft.file, { contentType: draft.meta.mime }),
              ...(draft.preview && previewPath
                ? [bucket.upload(previewPath, draft.preview, { contentType: "image/png" })]
                : []),
            ]),
          );
          attachments.push({
            type: draft.type,
            filePath,
            previewPath,
            meta: draft.meta,
            allowDownload: draft.allowDownload,
          });
        }

        if (failed) {
          console.error("Upload failed:", failed.message);
          setError("A file didn't upload. Check your connection and try again.");
          setStatus(null);
          return;
        }
      }

      setStatus("Posting…");
      const result = await createPost({
        projectId,
        kind,
        body,
        feedbackQuestion: question,
        attachments,
      });
      if (!result.ok) {
        setError(result.message);
        setStatus(null);
        return;
      }
      router.push(`/projects/${projectId}`);
    });
  }

  const cannotPost = drafts.length === 0 || !projectId;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <Field htmlFor="project" label="Project">
        <select
          id="project"
          value={projectId}
          onChange={(event) => {
            setProjectId(event.target.value);
            setError(null);
          }}
          className={inputClass}
        >
          <option value="" disabled>
            Pick a project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-gt-navy">Kind of update</legend>
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((option) => (
            <label
              key={option.value}
              className="flex min-h-14 cursor-pointer flex-col justify-center rounded-xl border border-border bg-background px-3.5 py-2 transition-colors hover:border-gt-navy has-checked:border-gt-navy has-checked:bg-gt-navy has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gt-navy"
            >
              <input
                type="radio"
                name="kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              <span className="text-[15px] font-semibold">{option.label}</span>
              <span className="text-xs leading-snug opacity-75">{option.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        htmlFor="body"
        label="What happened?"
        hint={`Optional · ${body.length}/${POST_LIMITS.body}`}
      >
        <textarea
          id="body"
          ref={bodyRef}
          rows={4}
          value={body}
          maxLength={POST_LIMITS.body}
          onChange={handleBodyChange}
          onKeyDown={handleBodyKeyDown}
          onBlur={() => window.setTimeout(() => setMention(null), 150)}
          placeholder="Rough progress counts. Type # to pick a project."
          aria-describedby="body-help"
          className={`${inputClass} resize-y leading-relaxed`}
        />
        {mention ? (
          <div className="mt-2 rounded-xl border border-border bg-background p-1.5" role="listbox" aria-label="Projects">
            {suggestions.length > 0 ? (
              suggestions.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  role="option"
                  aria-selected={index === 0}
                  // Keep focus in the textarea so the tap is not lost to its blur.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pickMention(project)}
                  className={`flex min-h-11 w-full flex-col justify-center rounded-lg px-3 py-1.5 text-left hover:bg-surface ${index === 0 ? "bg-surface" : ""}`}
                >
                  <span className="text-[15px] font-medium text-gt-navy">{project.title}</span>
                  <span className="text-xs text-muted">#{projectSlug(project.title)}</span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted">No project matches #{mention.query}.</p>
            )}
          </div>
        ) : null}
        <p id="body-help" className="mt-1.5 text-xs text-muted">
          {selectedProject
            ? `Posting to #${projectSlug(selectedProject.title)}`
            : "Tip: type # and a few letters of a project name to choose it."}
        </p>
      </Field>

      <Field
        htmlFor="question"
        label="Ask for feedback"
        hint={`Optional · ${question.length}/${POST_LIMITS.feedbackQuestion}`}
      >
        <input
          id="question"
          type="text"
          value={question}
          maxLength={POST_LIMITS.feedbackQuestion}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Does this gearing look right to you?"
          className={inputClass}
        />
      </Field>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-gt-navy">Attachments</span>
          <span className="text-xs text-muted">
            At least one · {drafts.length}/{POST_LIMITS.attachments}
          </span>
        </div>

        {drafts.length > 0 ? (
          <ul className="mb-3 flex flex-col gap-2.5">
            {drafts.map((draft) => (
              <li key={draft.key} className="relative">
                {draft.type === "photo" ? (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface">
                    <Image src={draft.url} alt="Photo to post" fill unoptimized className="object-cover" />
                  </div>
                ) : draft.type === "link" ? (
                  <LinkCard preview={draft.preview} />
                ) : (
                  <div className="rounded-xl border border-border bg-background">
                    {draft.url ? (
                      <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-surface">
                        <Image
                          src={draft.url}
                          alt={`Preview of ${draft.meta.name}`}
                          fill
                          unoptimized
                          className={draft.type === "pdf" ? "object-contain" : "object-cover"}
                        />
                      </div>
                    ) : null}
                    <div className="pr-12 [&>div]:border-0">
                      <FileCard
                        kind={draft.type}
                        name={draft.meta.name}
                        size={draft.meta.size}
                        detail={draft.meta.pages ? `${draft.meta.pages} ${draft.meta.pages === 1 ? "page" : "pages"}` : null}
                      />
                    </div>
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 border-t border-border px-3.5 py-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={draft.allowDownload}
                        onChange={(event) => setAllowDownload(draft.key, event.target.checked)}
                        className="h-5 w-5 accent-gt-navy"
                      />
                      Let others download the original
                    </label>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeDraft(draft.key)}
                  aria-label={
                    draft.type === "photo"
                      ? "Remove photo"
                      : draft.type === "link"
                        ? "Remove link"
                        : `Remove ${draft.meta.name}`
                  }
                  className="absolute top-1.5 right-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-gt-navy/85 text-white transition-colors hover:bg-gt-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                >
                  <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden>
                    <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-3 rounded-xl border border-dashed border-border bg-background px-4 py-5 text-center text-sm leading-relaxed text-muted">
            Every post needs a photo, file or link. A blurry bench photo is plenty.
          </p>
        )}

        {room > 0 ? (
          <div className="flex flex-col gap-2.5">
            <label
              htmlFor={photoInputId}
              aria-disabled={photoBusy}
              className={`${buttonSecondary} w-full cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gt-navy aria-disabled:pointer-events-none aria-disabled:opacity-60`}
            >
              {photoBusy ? "Preparing…" : "Add photos or files"}
              <input
                id={photoInputId}
                type="file"
                multiple
                disabled={photoBusy}
                onChange={handleFiles}
                className="sr-only"
              />
            </label>
            <p className="-mt-1 text-center text-xs text-muted">
              Photos, videos, PDFs, CAD and other files. Up to 25 MB each.
            </p>
            <div>
              <div className="flex gap-2">
                <input
                  type="url"
                  inputMode="url"
                  value={linkInput}
                  aria-label="Link to attach"
                  aria-invalid={linkError ? true : undefined}
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="Paste a link (GitHub, demo, doc…)"
                  onChange={(event) => {
                    setLinkInput(event.target.value);
                    if (linkError) setLinkError(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void addLink();
                    }
                  }}
                  className={`${inputClass} min-w-0`}
                />
                <button
                  type="button"
                  onClick={() => void addLink()}
                  disabled={!linkInput.trim() || linkLoading}
                  className={`${buttonSecondary} shrink-0`}
                >
                  {linkLoading ? "Loading…" : "Add link"}
                </button>
              </div>
              {linkError ? (
                <p role="alert" className="mt-1.5 text-sm text-red-700">
                  {linkError}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            That&apos;s the maximum of {POST_LIMITS.attachments} attachments.
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={pending || photoBusy}
          aria-disabled={cannotPost || undefined}
          className={`${buttonPrimary} w-full ${cannotPost ? "opacity-60" : ""}`}
        >
          {pending ? (status ?? "Posting…") : "Post update"}
        </button>
        {cannotPost && !pending ? (
          <p className="mt-2 text-center text-xs text-muted">
            {!projectId ? "Pick a project" : "Add a photo, file or link"} to post.
          </p>
        ) : null}
      </div>
    </form>
  );
}

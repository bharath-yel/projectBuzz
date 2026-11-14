"use client";

import { useId, useState, type ChangeEvent } from "react";
import { Avatar } from "@/components/Avatar";
import { buttonSecondary, buttonText } from "@/components/ui/styles";
import { resizeImage } from "@/lib/images/resize";
import { AVATAR_BUCKET } from "@/lib/profile/constants";
import { createClient } from "@/lib/supabase/client";

type AvatarUploadProps = {
  userId: string;
  /** Name used for the initials shown when there is no photo. */
  name: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Lets the form hold off submitting while a photo is still uploading. */
  onUploadingChange: (uploading: boolean) => void;
};

const AVATAR_SIZE = 512;

/**
 * Picks a photo, crops it to a 512px square in the browser, and uploads it to
 * the user's own folder in the avatars bucket. The profile row only changes
 * when the form is saved.
 */
export function AvatarUpload({
  userId,
  name,
  value,
  onChange,
  onUploadingChange,
}: AvatarUploadProps) {
  const inputId = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setBusy(busy: boolean) {
    setUploading(busy);
    onUploadingChange(busy);
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow picking the same file again
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      let image: Blob;
      try {
        image = await resizeImage(file, { maxEdge: AVATAR_SIZE, crop: "square" });
      } catch {
        setError("We couldn't read that image. Try a JPG or PNG.");
        return;
      }

      const supabase = createClient();
      const path = `${userId}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, image, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "3600",
        });
      if (uploadError) {
        console.error("Avatar upload failed:", uploadError.message);
        setError("The upload didn't go through. Check your connection and try again.");
        return;
      }

      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      // The path never changes, so add a version to get past cached copies.
      onChange(`${data.publicUrl}?v=${Date.now()}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={value} name={name} size={80} />
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-white/75">
              <span
                aria-hidden
                className="h-6 w-6 animate-spin rounded-full border-2 border-gt-navy border-t-transparent"
              />
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <label
            htmlFor={inputId}
            aria-disabled={uploading}
            className={`${buttonSecondary} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-gt-navy aria-disabled:pointer-events-none aria-disabled:opacity-60`}
          >
            {uploading ? "Uploading…" : value ? "Change photo" : "Add a photo"}
            <input
              id={inputId}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={handleFile}
              className="sr-only"
            />
          </label>
          {value && !uploading ? (
            <button type="button" onClick={() => onChange(null)} className={buttonText}>
              Remove
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import { formatBytes } from "@/lib/attachments/kinds";

type FileCardProps = {
  kind: "pdf" | "video" | "file";
  name: string;
  size?: number | null;
  /** Extra detail, e.g. "12 pages". */
  detail?: string | null;
};

const KIND_LABEL = { pdf: "PDF", video: "Video", file: "File" } as const;

/** File-type card: an extension badge, the file name and its size. */
export function FileCard({ kind, name, size, detail }: FileCardProps) {
  const extension = /\.([a-z0-9]{1,5})$/i.exec(name)?.[1]?.toUpperCase() ?? KIND_LABEL[kind].toUpperCase();
  const facts = [KIND_LABEL[kind], size ? formatBytes(size) : null, detail].filter(Boolean);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5 text-left">
      <span
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gt-navy text-[11px] font-bold tracking-wide text-gt-gold"
      >
        {extension}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold text-gt-navy">{name}</span>
        <span className="block truncate text-xs text-muted">{facts.join(" · ")}</span>
      </span>
    </div>
  );
}

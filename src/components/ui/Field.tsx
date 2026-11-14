import type { ReactNode } from "react";

type FieldProps = {
  /** id of the control inside, for the label. */
  htmlFor: string;
  label: string;
  /** Shown after the label, e.g. "Optional". */
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Label, control and error message. The error element id is `${htmlFor}-error`. */
export function Field({ htmlFor, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-gt-navy">
          {label}
        </label>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

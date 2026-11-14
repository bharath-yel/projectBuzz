"use client";

import { useState, type KeyboardEvent } from "react";
import { cleanSkills, PROFILE_LIMITS } from "@/lib/profile/constants";

type SkillsInputProps = {
  id: string;
  value: string[];
  onChange: (skills: string[]) => void;
};

const SUGGESTIONS = [
  "Python",
  "CAD",
  "React",
  "3D printing",
  "PCB design",
  "Machine learning",
  "Figma",
  "Embedded C",
];

/**
 * Tag-style input. Type a skill and press Enter or comma to add it; tap a
 * tag to remove it. Works without a hover or a hardware keyboard.
 */
export function SkillsInput({ id, value, onChange }: SkillsInputProps) {
  const [draft, setDraft] = useState("");
  const full = value.length >= PROFILE_LIMITS.skills;

  function add(raw: string) {
    const next = cleanSkills([...value, ...raw.split(",")]);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  }

  function remove(skill: string) {
    onChange(value.filter((item) => item !== skill));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      // Never let Enter in this field submit the whole form.
      event.preventDefault();
      if (draft.trim()) add(draft);
    } else if (event.key === "Backspace" && !draft && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  const suggestions = SUGGESTIONS.filter(
    (skill) => !value.some((item) => item.toLowerCase() === skill.toLowerCase()),
  );

  return (
    <div>
      {value.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Your skills">
          {value.map((skill) => (
            <li key={skill}>
              <button
                type="button"
                onClick={() => remove(skill)}
                aria-label={`Remove ${skill}`}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gt-gold/25 pr-3 pl-4 text-sm font-medium text-gt-navy transition-colors hover:bg-gt-gold/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
              >
                {skill}
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                  <path
                    d="M3 3l8 8M11 3l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={draft}
          disabled={full}
          maxLength={PROFILE_LIMITS.skillLength * 4}
          enterKeyHint="done"
          autoCapitalize="none"
          placeholder={full ? "That's the maximum" : "Add a skill, then press Enter"}
          onChange={(event) => {
            const text = event.target.value;
            // Some mobile keyboards never fire a keydown for the comma.
            if (text.includes(",")) add(text);
            else setDraft(text);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) add(draft);
          }}
          className="block min-h-12 w-full min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 focus:border-gt-navy focus:ring-2 focus:ring-gt-navy/15 focus:outline-none disabled:bg-surface"
        />
        <button
          type="button"
          onClick={() => draft.trim() && add(draft)}
          disabled={full || !draft.trim()}
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl border border-border bg-background px-4 text-[15px] font-semibold text-gt-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
        >
          Add
        </button>
      </div>

      {suggestions.length > 0 && !full ? (
        <div className="mt-3">
          <p className="mb-1.5 text-xs text-muted">Or tap to add:</p>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((skill) => (
              <li key={skill}>
                <button
                  type="button"
                  onClick={() => add(skill)}
                  className="inline-flex min-h-11 items-center rounded-full border border-dashed border-border bg-background px-4 text-sm text-muted transition-colors hover:border-gt-navy hover:text-gt-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gt-navy"
                >
                  + {skill}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

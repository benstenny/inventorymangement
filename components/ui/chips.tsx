"use client";

import { labelClass } from "./styles";

type Option = { value: string; label: string };

type Props = {
  name: string;
  label: string;
  options: readonly Option[];
  defaultValue?: string | null;
  error?: string;
  onChange?: (value: string) => void;
};

/**
 * Single-choice chips. Native radio buttons underneath, so they work with
 * plain form submission and keyboard navigation (see DESIGN.md > Chip).
 */
export function Chips({ name, label, options, defaultValue, error, onChange }: Props) {
  const errorId = `${name}-error`;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`${labelClass} mb-2`}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={(defaultValue ?? "") === option.value}
              onChange={() => onChange?.(option.value)}
              aria-describedby={error ? errorId : undefined}
              className="peer absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="flex min-h-touch items-center rounded-pill border border-border bg-surface px-4 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-focus">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

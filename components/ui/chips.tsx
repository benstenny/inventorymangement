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

const chipClass =
  "flex min-h-touch items-center rounded-pill border border-border bg-surface px-4 peer-checked:border-accent peer-checked:bg-accent peer-checked:text-on-accent peer-focus-visible:outline-2 peer-focus-visible:outline-focus";

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
            <span className={chipClass}>{option.label}</span>
          </label>
        ))}
      </div>
      <ChipError id={errorId} error={error} />
    </fieldset>
  );
}

type MultiProps = Omit<Props, "defaultValue" | "onChange"> & {
  defaultValues?: readonly string[];
  hint?: string;
};

/** Pick-any chips. Native checkboxes underneath; the form sends one value per ticked chip. */
export function MultiChips({ name, label, options, defaultValues = [], error, hint }: MultiProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className={`${labelClass} mb-2`}>{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={defaultValues.includes(option.value)}
              aria-describedby={error ? errorId : undefined}
              className="peer absolute inset-0 cursor-pointer opacity-0"
            />
            <span className={chipClass}>{option.label}</span>
          </label>
        ))}
      </div>
      {error ? <ChipError id={errorId} error={error} /> : hint && <p className="text-sm text-muted">{hint}</p>}
    </fieldset>
  );
}

function ChipError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="text-sm text-danger" role="alert">
      {error}
    </p>
  );
}

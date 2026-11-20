"use client";

import { inputClass } from "./styles";
import { centsToInput, parseMoneyToCents } from "@/lib/money";

type Props = {
  id: string;
  name: string;
  invalid: boolean;
  /** Uncontrolled: the starting amount in cents. */
  cents?: number | null;
  onCentsChange?: (cents: number | null) => void;
  /** Controlled: the text in the field (for amounts that fill themselves in, like fees). */
  value?: string;
  onValueChange?: (text: string) => void;
};

/** A money field with a "$" in front. What she types is parsed to cents on the server. */
export function MoneyInput({ id, name, invalid, cents, onCentsChange, value, onValueChange }: Props) {
  const controlled = value !== undefined;
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-muted">
        $
      </span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        {...(controlled
          ? { value }
          : { defaultValue: cents === null || cents === undefined ? "" : centsToInput(cents) })}
        placeholder="0"
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          onValueChange?.(e.target.value);
          onCentsChange?.(e.target.value.trim() ? parseMoneyToCents(e.target.value) : null);
        }}
        className={`${inputClass} tabular pl-8`}
      />
    </div>
  );
}

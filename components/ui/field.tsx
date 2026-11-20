import type { ReactNode } from "react";
import { labelClass } from "./styles";

type Props = {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

/** Label above, input, then a hint or error below (see DESIGN.md > Input). */
export function Field({ label, htmlFor, error, hint, children, className = "" }: Props) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

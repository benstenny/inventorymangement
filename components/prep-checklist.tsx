import { PREP_STEPS, type PrepStep } from "@/lib/items/prep";

/** Washed · Measured · Photographed · Listed, ticked off as she goes. */
export function PrepChecklist({ done, className = "" }: { done: Record<PrepStep, boolean>; className?: string }) {
  return (
    <ul aria-label="Prep checklist" className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${className}`}>
      {PREP_STEPS.map(({ step, label }) => (
        <li key={step} className={done[step] ? "text-success" : "text-muted"}>
          <span aria-hidden>{done[step] ? "✓" : "○"}</span> {label}
          <span className="sr-only">{done[step] ? " (done)" : " (to do)"}</span>
        </li>
      ))}
    </ul>
  );
}

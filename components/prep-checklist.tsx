import { GelCircle, GelTick } from "@/components/icons";
import { PREP_STEPS, type PrepStep } from "@/lib/items/prep";

/** Washed · Measured · Photographed · Listed, ticked off in aqua gel ink as she goes. */
export function PrepChecklist({ done, className = "" }: { done: Record<PrepStep, boolean>; className?: string }) {
  return (
    <ul aria-label="Prep checklist" className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {PREP_STEPS.map(({ step, label }) => (
        <li
          key={step}
          className={`flex items-center gap-1.5 text-[15px] font-semibold ${done[step] ? "text-ink-aqua" : "text-muted"}`}
        >
          {done[step] ? <GelTick size={18} /> : <GelCircle size={16} className="opacity-70" />}
          {label}
          <span className="sr-only">{done[step] ? " (done)" : " (to do)"}</span>
        </li>
      ))}
    </ul>
  );
}

import { GelCircle, GelTick } from "@/components/icons";
import { PREP_STEPS, type PrepStep } from "@/lib/items/prep";

/**
 * Washed · Measured · Photographed · Listed. Done steps get a mint gel tick and a plum label
 * (mint text is too faint on the page; the tick is an icon, so 3:1 is enough).
 */
export function PrepChecklist({ done, className = "" }: { done: Record<PrepStep, boolean>; className?: string }) {
  return (
    <ul aria-label="Prep checklist" className={`flex flex-wrap gap-x-4 gap-y-2 ${className}`}>
      {PREP_STEPS.map(({ step, label }) => (
        <li
          key={step}
          className={`flex items-center gap-1.5 text-[15px] font-semibold ${done[step] ? "text-text" : "text-muted"}`}
        >
          {done[step] ? <GelTick size={18} className="text-ink-aqua" /> : <GelCircle size={16} className="opacity-70" />}
          {label}
          <span className="sr-only">{done[step] ? " (done)" : " (to do)"}</span>
        </li>
      ))}
    </ul>
  );
}

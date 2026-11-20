import { groupClass } from "@/components/ui/styles";

/** Placeholder shapes while the list loads: search, chips and a few rows. */
export function ListSkeleton() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-touch w-full rounded-control bg-surface-muted" />
      <div className="mt-3 flex gap-2">
        <div className="h-touch w-16 rounded-pill bg-surface-muted" />
        <div className="h-touch w-32 rounded-pill bg-surface-muted" />
        <div className="h-touch w-20 rounded-pill bg-surface-muted" />
      </div>
      <div className={`${groupClass} mt-4 divide-y divide-hairline px-4`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 py-3">
            <div className="aspect-[4/5] w-[72px] rounded-control bg-surface-muted" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-4 w-3/4 rounded-pill bg-surface-muted" />
              <div className="h-3 w-1/2 rounded-pill bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

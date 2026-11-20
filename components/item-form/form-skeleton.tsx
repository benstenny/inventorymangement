/** Placeholder shapes while the form's data loads: same layout as the real form. */
export function FormSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-10"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-2 lg:gap-3">
        <div className="aspect-[4/5] rounded-card bg-surface-muted lg:col-span-2" />
        <div className="aspect-[4/5] rounded-card bg-surface-muted" />
        <div className="aspect-[4/5] rounded-card bg-surface-muted" />
      </div>
      <div className="flex flex-col gap-6">
        <div className="h-touch w-full rounded-control bg-surface-muted" />
        <div className="flex gap-2">
          <div className="h-touch w-20 rounded-pill bg-surface-muted" />
          <div className="h-touch w-24 rounded-pill bg-surface-muted" />
          <div className="h-touch w-20 rounded-pill bg-surface-muted" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-touch rounded-control bg-surface-muted" />
          <div className="h-touch rounded-control bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}

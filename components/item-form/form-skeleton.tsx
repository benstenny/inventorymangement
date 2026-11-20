/** Grey placeholder shapes while the form's data loads. */
export function FormSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-busy="true" aria-label="Loading">
      <div className="aspect-[4/3] w-full rounded-card bg-surface-muted" />
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
  );
}

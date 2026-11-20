"use client";

import { archiveItemAction } from "@/app/(app)/items/actions";

/** Soft delete: hides the item from the list but keeps its history. */
export function ArchiveButton({ id }: { id: string }) {
  return (
    <form
      action={archiveItemAction}
      onSubmit={(e) => {
        if (!window.confirm("Archive this item? It'll be hidden from your list. Its sale history is kept.")) {
          e.preventDefault();
        }
      }}
      className="mt-8 flex justify-center lg:justify-start"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="min-h-touch rounded-control px-4 font-semibold text-danger transition-colors hover:bg-surface-muted">
        Archive item
      </button>
    </form>
  );
}

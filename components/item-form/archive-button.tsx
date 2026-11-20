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
      className="mt-6 flex justify-center"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="min-h-touch px-4 text-sm text-danger">
        Archive item
      </button>
    </form>
  );
}

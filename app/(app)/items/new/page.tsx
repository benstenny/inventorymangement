import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Add item" };

// Phase 2 replaces this with the add-item form.
export default function NewItemPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Add item</h1>
      <EmptyState message="Adding items arrives in the next update. Check back soon." />
    </>
  );
}

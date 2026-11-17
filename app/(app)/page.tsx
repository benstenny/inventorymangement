import { EmptyState } from "@/components/empty-state";

// Phase 3 replaces this with the photo-first inventory list.
export default function ItemsPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Items</h1>
      <EmptyState
        message="No items yet. Add your first one."
        action={{ href: "/items/new", label: "Add item" }}
      />
    </>
  );
}

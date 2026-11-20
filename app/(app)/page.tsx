import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

// Phase 3 replaces the empty state with the photo-first inventory list.
export default function ItemsPage() {
  return (
    <div className="mx-auto w-full max-w-wide">
      <PageHeader title="inventory" />
      <EmptyState
        message="Nothing in your bins yet."
        hint="Add your first find. You can take its photos now or later."
        action={{ href: "/items/new", label: "Add item" }}
      />
    </div>
  );
}

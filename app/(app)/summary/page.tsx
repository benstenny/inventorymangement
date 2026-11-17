import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";

export const metadata: Metadata = { title: "Summary" };

// Phase 6 replaces this with stock count, money in, profit and CSV export.
export default function SummaryPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Summary</h1>
      <EmptyState
        message="Your totals show up here once you've sold something. Start by adding items."
        action={{ href: "/items/new", label: "Add item" }}
      />
    </>
  );
}

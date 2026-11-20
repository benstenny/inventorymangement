import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/inventory/list-skeleton";
import { PackCard } from "@/components/pack/pack-card";
import { PageHeader } from "@/components/page-header";
import { getPackList } from "@/lib/items/data";

export const metadata: Metadata = { title: "Pack today" };

export default function PackPage() {
  return (
    <div className="mx-auto w-full max-w-page">
      <PageHeader title="pack today" />
      <Suspense fallback={<ListSkeleton />}>
        <PackList />
      </Suspense>
    </div>
  );
}

async function PackList() {
  // Her sales and the Supabase session are per request: never prerender this part.
  await connection();
  const items = await getPackList();

  if (items.length === 0) {
    return (
      <EmptyState
        message="Nothing to pack."
        hint="When something sells on Depop or Instagram, it shows up here until you mark it shipped."
      />
    );
  }

  return (
    <>
      <p className="tabular -mt-2 mb-4 text-[15px] font-semibold text-muted">
        {items.length === 1 ? "1 to ship" : `${items.length} to ship`} · oldest first
      </p>
      <ul aria-label="To ship" className="flex flex-col gap-4">
        {items.map((item, i) => (
          // Only the most urgent one gets the strong button: one primary action per screen.
          <PackCard key={item.id} item={item} primary={i === 0} />
        ))}
      </ul>
    </>
  );
}

import { Suspense } from "react";
import { InventoryList } from "@/components/inventory/inventory-list";
import { ListSkeleton } from "@/components/inventory/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getInventory } from "@/lib/items/data";
import { parseFilter } from "@/lib/items/list";

export default function ItemsPage({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto w-full max-w-wide">
      <PageHeader title="inventory" />
      <Suspense fallback={<ListSkeleton />}>
        <Inventory searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Inventory({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const [params, { items, staleDays }] = await Promise.all([searchParams, getInventory()]);
  const q = typeof params.q === "string" ? params.q.slice(0, 100) : "";
  return <InventoryList items={items} staleDays={staleDays} initialFilter={parseFilter(params.show)} initialQuery={q} />;
}

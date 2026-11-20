import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ArchiveButton } from "@/components/item-form/archive-button";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { ItemForm } from "@/components/item-form/item-form";
import { getCategories, getItem, getLastUsed } from "@/lib/items/data";
import { STATUS_LABELS } from "@/lib/items/options";

export const metadata: Metadata = { title: "Edit item" };

export default function EditItemPage({ params }: PageProps<"/items/[id]">) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <EditItem params={params} />
    </Suspense>
  );
}

async function EditItem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [found, categories, lastUsed] = await Promise.all([getItem(id), getCategories(), getLastUsed()]);
  if (!found) notFound();
  const { item, photoUrl } = found;

  // Sold, shipped and returned items keep their status; the form only offers the early ones.
  const editableStatus = ["SOURCED", "NEEDS_PHOTOS", "LISTED"].includes(item.status);

  return (
    <>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Edit item</h1>
        <span className="font-mono text-sm text-muted">{item.sku}</span>
      </div>

      {item.archived_at && (
        <p className="mb-4 rounded-card border border-border bg-surface p-3 text-sm text-warning">
          This item is archived. It won&apos;t show in your list.
        </p>
      )}
      <ItemForm
        mode="edit"
        categories={categories}
        lastPlatform={lastUsed.platform}
        lockedStatusLabel={editableStatus ? undefined : STATUS_LABELS[item.status]}
        defaults={{
          id: item.id,
          sku: item.sku,
          title: item.title,
          categoryId: item.category_id,
          sourceCost: item.source_cost,
          storageLocation: item.storage_location,
          brand: item.brand,
          size: item.size,
          color: item.color,
          condition: item.condition,
          description: item.description,
          source: item.source,
          acquiredDate: item.acquired_date,
          status: item.status,
          listedOn: item.listed_on,
          listPrice: item.list_price,
          photoPath: item.photo_path,
          photoUrl,
        }}
      />

      {!item.archived_at && <ArchiveButton id={item.id} />}
    </>
  );
}

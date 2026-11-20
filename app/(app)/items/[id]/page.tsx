import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ArchiveButton } from "@/components/item-form/archive-button";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { ItemForm } from "@/components/item-form/item-form";
import { PageHeader } from "@/components/page-header";
import { PrepChecklist } from "@/components/prep-checklist";
import { getCategories, getFormSettings, getItem } from "@/lib/items/data";
import { STATUS_LABELS } from "@/lib/items/options";
import { prepChecklist } from "@/lib/items/prep";
import { worstCaseFees } from "@/lib/pricing";

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

  const [found, categories, settings] = await Promise.all([getItem(id), getCategories(), getFormSettings()]);
  if (!found) notFound();
  const { item, photoUrls } = found;

  // Sold, shipped and returned items keep their status; the form only offers the early ones.
  const editableStatus = ["SOURCED", "NEEDS_PHOTOS", "LISTED"].includes(item.status);

  const checklist = prepChecklist({
    washed: item.washed,
    skuPrefix: categories.find((c) => c.id === item.category_id)?.skuPrefix,
    measurements: item.measurements,
    photos: { front: item.photo_front_path, back: item.photo_back_path, styled: item.photo_styled_path },
    status: item.status,
  });

  return (
    <div className="mx-auto w-full max-w-page lg:max-w-wide">
      <PageHeader
        title={item.title}
        back={{ href: "/", label: "Inventory" }}
        trailing={<span className="tabular font-mono text-[15px] text-muted">{item.sku}</span>}
      >
        <PrepChecklist done={checklist} className="mb-6" />
      </PageHeader>

      {item.archived_at && (
        <p className="mb-5 rounded-card bg-surface-muted p-4 text-[15px] font-medium text-warning">
          This item is archived. It won&apos;t show in your list.
        </p>
      )}
      <ItemForm
        mode="edit"
        categories={categories}
        sources={settings.sources}
        storageSpots={settings.storageSpots}
        pricing={settings.pricing}
        fees={worstCaseFees(settings.feePresets)}
        lastPlatforms={settings.lastUsed.platforms}
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
          flaws: item.flaws,
          description: item.description,
          measurements: item.measurements,
          washed: item.washed,
          source: item.source,
          acquiredDate: item.acquired_date,
          status: item.status,
          listedOn: item.listed_on,
          listPrice: item.list_price,
          photos: {
            front: { path: item.photo_front_path, url: photoUrls.front },
            back: { path: item.photo_back_path, url: photoUrls.back },
            styled: { path: item.photo_styled_path, url: photoUrls.styled },
          },
        }}
      />

      {!item.archived_at && <ArchiveButton id={item.id} />}
    </div>
  );
}

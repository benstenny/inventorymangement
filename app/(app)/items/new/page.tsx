import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemForm } from "@/components/item-form/item-form";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { getCategories, getFormSettings } from "@/lib/items/data";
import { worstCaseFees } from "@/lib/pricing";

export const metadata: Metadata = { title: "Add item" };

export default function NewItemPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Add item</h1>
      <Suspense fallback={<FormSkeleton />}>
        <NewItemForm />
      </Suspense>
    </>
  );
}

async function NewItemForm() {
  const [categories, settings] = await Promise.all([getCategories(), getFormSettings()]);
  return (
    <ItemForm
      mode="create"
      categories={categories}
      sources={settings.sources}
      storageSpots={settings.storageSpots}
      pricing={settings.pricing}
      fees={worstCaseFees(settings.feePresets)}
      lastPlatform={settings.lastUsed.platform}
      defaults={{
        source: settings.lastUsed.source ?? null,
        storageLocation: settings.lastUsed.storageLocation ?? null,
        status: "SOURCED",
      }}
    />
  );
}

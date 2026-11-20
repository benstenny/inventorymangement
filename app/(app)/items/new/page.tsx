import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemForm } from "@/components/item-form/item-form";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { PageHeader } from "@/components/page-header";
import { getCategories, getFormSettings } from "@/lib/items/data";
import { worstCaseFees } from "@/lib/pricing";

export const metadata: Metadata = { title: "Add item" };

export default function NewItemPage() {
  return (
    <div className="mx-auto w-full max-w-page lg:max-w-wide">
      <PageHeader title="add a find" back={{ href: "/", label: "Inventory" }} />
      <Suspense fallback={<FormSkeleton />}>
        <NewItemForm />
      </Suspense>
    </div>
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
      lastPlatforms={settings.lastUsed.platforms}
      defaults={{
        source: settings.lastUsed.source ?? null,
        storageLocation: settings.lastUsed.storageLocation ?? null,
        status: "SOURCED",
      }}
    />
  );
}

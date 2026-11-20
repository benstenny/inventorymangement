import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemForm } from "@/components/item-form/item-form";
import { FormSkeleton } from "@/components/item-form/form-skeleton";
import { getCategories, getLastUsed } from "@/lib/items/data";

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
  const [categories, lastUsed] = await Promise.all([getCategories(), getLastUsed()]);
  return (
    <ItemForm
      mode="create"
      categories={categories}
      lastPlatform={lastUsed.platform}
      defaults={{
        source: lastUsed.source ?? null,
        storageLocation: lastUsed.storageLocation ?? null,
        status: "SOURCED",
      }}
    />
  );
}

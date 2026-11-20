"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { archiveItem, createItem, updateItem } from "@/lib/items/data";
import { formDataToInput, parseItemForm, type FieldErrors } from "@/lib/items/schema";

export type SaveItemState = {
  /** Bumps on every successful save so the form knows to reset. */
  savedCount: number;
  saved?: { id: string; sku: string; title: string };
  errors?: FieldErrors;
  formError?: string;
  /** Remembered values for the next blank form after adding an item. */
  carryOver?: { source: string | null; storageLocation: string | null };
};

const idSchema = z.uuid();

/** Create (no id) or update (with id) an item from the add/edit form. */
export async function saveItem(prev: SaveItemState, formData: FormData): Promise<SaveItemState> {
  const parsed = parseItemForm(formDataToInput(formData));
  if (!parsed.ok) {
    return { savedCount: prev.savedCount, errors: parsed.errors, carryOver: prev.carryOver };
  }

  const rawId = formData.get("id");
  try {
    if (rawId) {
      const id = idSchema.parse(rawId);
      await updateItem(id, parsed.values);
      return { savedCount: prev.savedCount + 1, saved: { id, sku: "", title: parsed.values.title } };
    }
    const { id, sku } = await createItem(parsed.values);
    return {
      savedCount: prev.savedCount + 1,
      saved: { id, sku, title: parsed.values.title },
      carryOver: {
        source: parsed.values.source ?? prev.carryOver?.source ?? null,
        storageLocation: parsed.values.storageLocation ?? prev.carryOver?.storageLocation ?? null,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      savedCount: prev.savedCount,
      formError: "Couldn't save. Check your internet connection and try again.",
      carryOver: prev.carryOver,
    };
  }
}

export async function archiveItemAction(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  await archiveItem(id);
  redirect("/");
}

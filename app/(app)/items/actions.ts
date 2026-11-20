"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { applyQuickStep, archiveItem, createItem, getItemCost, markShipped, markSold, updateItem } from "@/lib/items/data";
import { shipFormSchema } from "@/lib/items/shipping";
import { SALE_FORM_FIELDS, parseSaleForm, saleProfit, type SaleFieldErrors } from "@/lib/items/sale";
import { QUICK_STEPS } from "@/lib/items/status";
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

export type QuickStepState = { error?: string };

const quickStepSchema = z.object({ id: z.uuid(), step: z.enum(QUICK_STEPS) });

/** "Mark washed" / "Mark listed" straight from the inventory list. */
export async function quickStepAction(_prev: QuickStepState, formData: FormData): Promise<QuickStepState> {
  const parsed = quickStepSchema.safeParse({ id: formData.get("id"), step: formData.get("step") });
  if (!parsed.success) return { error: "Something went wrong. Open the item to change it." };
  try {
    const result = await applyQuickStep(parsed.data.id, parsed.data.step);
    if (!result.ok) return { error: result.message };
  } catch (err) {
    console.error(err);
    return { error: "Couldn't save. Check your internet connection and try again." };
  }
  refresh();
  return {};
}

export async function archiveItemAction(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  await archiveItem(id);
  redirect("/");
}

export type MarkSoldState = {
  errors?: SaleFieldErrors;
  formError?: string;
  /** Set once the sale is saved: what to show on the "Sold!" screen. */
  sold?: { profit: number; soldPrice: number; handedOver: boolean };
};

/** "Mark as sold": validates again on the server, records the sale and shows the profit. */
export async function markSoldAction(_prev: MarkSoldState, formData: FormData): Promise<MarkSoldState> {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) return { formError: "Something went wrong. Go back to the item and try again." };
  const input = Object.fromEntries(SALE_FORM_FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const parsed = parseSaleForm(input);
  if (!parsed.ok) return { errors: parsed.errors };

  try {
    const result = await markSold(id.data, parsed.values);
    if (!result.ok) return { formError: result.message };
    const cost = await getItemCost(id.data);
    const { patch } = result;
    refresh();
    return {
      sold: {
        profit: saleProfit({ soldPrice: patch.soldPrice, cost, fees: patch.platformFees, shipping: patch.shippingCost }),
        soldPrice: patch.soldPrice,
        handedOver: patch.status === "SHIPPED",
      },
    };
  } catch (err) {
    console.error(err);
    return { formError: "Couldn't save the sale. Check your internet connection and try again." };
  }
}

export type MarkShippedState = { error?: string; shipped?: boolean };

/** "Mark shipped" from Pack today. The proof photo is required (checked again here). */
export async function markShippedAction(_prev: MarkShippedState, formData: FormData): Promise<MarkShippedState> {
  const parsed = shipFormSchema.safeParse({
    id: formData.get("id"),
    proofPath: formData.get("proofPath") ?? "",
    shippedDate: formData.get("shippedDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Something went wrong. Reload and try again." };
  try {
    const result = await markShipped(parsed.data);
    if (!result.ok) return { error: result.message };
  } catch (err) {
    console.error(err);
    return { error: "Couldn't save. Check your internet connection and try again." };
  }
  refresh();
  return { shipped: true };
}

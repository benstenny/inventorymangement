"use server";

import { refresh } from "next/cache";
import { saveShopSettings } from "@/lib/settings-data";
import { SETTINGS_FORM_FIELDS, parseSettingsForm, type SettingsFieldErrors } from "@/lib/settings";

export type SettingsFormState = { errors?: SettingsFieldErrors; formError?: string; savedCount: number };

/** "Save settings": validates again on the server, then saves the whole settings row. */
export async function saveSettingsAction(prev: SettingsFormState, formData: FormData): Promise<SettingsFormState> {
  const parsed = parseSettingsForm(Object.fromEntries(SETTINGS_FORM_FIELDS.map((f) => [f, String(formData.get(f) ?? "")])));
  if (!parsed.ok) return { errors: parsed.errors, savedCount: prev.savedCount };
  try {
    await saveShopSettings(parsed.values);
  } catch (err) {
    console.error(err);
    return { formError: "Couldn't save. Check your internet connection and try again.", savedCount: prev.savedCount };
  }
  refresh();
  return { savedCount: prev.savedCount + 1 };
}

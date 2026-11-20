import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";
import { MEASUREMENT_KEYS, measurementField, parseInches, type Measurements } from "./measurements";
import { CONDITIONS, FORM_STATUSES, LISTED_ON } from "./options";

/**
 * Validates the add/edit item form. Used in the browser (instant feedback)
 * and again in the server action (the real check). Input is the raw form
 * strings; output is clean values ready for the database, money in cents.
 */

/** Empty or whitespace-only text becomes null. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { message: `Keep this under ${max} characters.` })
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional()
    .transform((v) => v ?? null);

/** Money typed as text ("12.50", "$12") -> integer cents. */
const money = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") return null;
      const cents = parseMoneyToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `Enter ${label} like 12 or 12.50.` });
        return z.NEVER;
      }
      return cents;
    });

/** A measurement typed as text ("19.5", "19 1/2") -> inches, or null when blank. */
const inches = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const parsed = parseInches(v ?? "");
    if (parsed === undefined) {
      ctx.addIssue({ code: "custom", message: "Enter inches, like 19 or 19.5." });
      return z.NEVER;
    }
    return parsed;
  });

const isoDate = z.iso.date({ message: "Pick a date." });

/** Storage path of an uploaded photo: items/<uuid>.webp or .jpg. Blocks path tricks. */
export const PHOTO_PATH = /^items\/[0-9a-f-]{36}\.(webp|jpg)$/;

const photoPath = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.string().regex(PHOTO_PATH, { message: "That photo didn't upload properly. Try again." }).nullable());

/** Turns "" into undefined so optional enums treat an empty select as "not set". */
const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const measurementShape = Object.fromEntries(MEASUREMENT_KEYS.map((key) => [measurementField(key), inches])) as Record<
  ReturnType<typeof measurementField>,
  typeof inches
>;

export const itemFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { message: "Give it a title, like \"Levi's 501 jeans\"." })
      .max(120, { message: "Keep the title under 120 characters." }),
    categoryId: z.uuid({ message: "Pick a category." }),
    sourceCost: money("the cost").transform((v) => v ?? 0),
    storageLocation: optionalText(60),

    brand: optionalText(60),
    size: optionalText(30),
    color: optionalText(40),
    condition: z.preprocess(emptyToUndefined, z.enum(CONDITIONS).optional()).transform((v) => v ?? null),
    flaws: optionalText(500),
    description: optionalText(2000),
    washed: z
      .string()
      .optional()
      .transform((v) => v === "on" || v === "true"),
    source: optionalText(80),
    acquiredDate: isoDate,
    status: z.enum(FORM_STATUSES, { message: "Pick a status." }),
    listedOn: z.preprocess(emptyToUndefined, z.enum(LISTED_ON).optional()).transform((v) => v ?? null),
    listPrice: money("the price"),

    photoFrontPath: photoPath,
    photoBackPath: photoPath,
    photoStyledPath: photoPath,

    ...measurementShape,
  })
  .superRefine((item, ctx) => {
    if (item.status === "LISTED" && !item.listedOn) {
      ctx.addIssue({
        code: "custom",
        path: ["listedOn"],
        message: "Pick where it's listed.",
      });
    }
  })
  .transform(({ ...item }) => {
    const measurements: Measurements = {};
    for (const key of MEASUREMENT_KEYS) {
      const field = measurementField(key);
      const value = item[field];
      delete (item as Partial<typeof item>)[field];
      if (value !== null) measurements[key] = value;
    }
    return { ...item, measurements } as Omit<typeof item, keyof typeof measurementShape> & {
      measurements: Measurements;
    };
  });

/** Raw form values, all strings (what the browser sends). */
export type ItemFormInput = z.input<typeof itemFormSchema>;
/** Clean, validated values. */
export type ItemFormValues = z.output<typeof itemFormSchema>;

export type FieldErrors = Partial<Record<keyof ItemFormInput, string>>;

export const ITEM_FORM_FIELDS = [
  "title",
  "categoryId",
  "sourceCost",
  "storageLocation",
  "brand",
  "size",
  "color",
  "condition",
  "flaws",
  "description",
  "washed",
  "source",
  "acquiredDate",
  "status",
  "listedOn",
  "listPrice",
  "photoFrontPath",
  "photoBackPath",
  "photoStyledPath",
  ...MEASUREMENT_KEYS.map(measurementField),
] as const satisfies readonly (keyof ItemFormInput)[];

/** Reads the item fields out of a submitted form. */
export function formDataToInput(formData: FormData): Record<string, string> {
  const input: Record<string, string> = {};
  for (const field of ITEM_FORM_FIELDS) {
    const value = formData.get(field);
    input[field] = typeof value === "string" ? value : "";
  }
  return input;
}

export type ParseResult =
  | { ok: true; values: ItemFormValues }
  | { ok: false; errors: FieldErrors };

/** Validates form input and returns either clean values or one message per field. */
export function parseItemForm(input: Record<string, string>): ParseResult {
  const parsed = itemFormSchema.safeParse(input);
  if (parsed.success) return { ok: true, values: parsed.data };

  const errors: FieldErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0] as keyof ItemFormInput | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

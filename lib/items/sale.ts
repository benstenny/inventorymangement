import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";
import { platformFee, type FeePresets } from "@/lib/pricing";
import { PAYMENT_METHODS, PLATFORMS, type PaymentMethod, type Platform, type Status } from "./options";
import { isInStock } from "./status";

/**
 * Marking an item as sold: the form's defaults, its validation, the profit, the
 * "take it down from the other places" reminder and the status change.
 * All money is integer cents.
 */

/** Profit = sold for - what she paid - platform fees - shipping she paid. Can be negative. */
export function saleProfit(sale: { soldPrice: number; cost: number; fees: number; shipping: number }): number {
  return sale.soldPrice - sale.cost - sale.fees - sale.shipping;
}

/** Profit as a whole-number percent of the sale price, or null when it sold for nothing. */
export function profitMargin(profit: number, soldPrice: number): number | null {
  if (soldPrice <= 0) return null;
  return Math.round((profit / soldPrice) * 100);
}

/** What the platform's fee preset takes at this price. Instagram and flea market are 0% by default. */
export function feesFor(platform: Platform, price: number, presets: FeePresets): number {
  return platformFee(price, presets[platform]);
}

/** Flea market sales are handed over on the spot: no shipping, nothing to pack. */
export function isHandedOver(platform: Platform): boolean {
  return platform === "FLEA_MARKET";
}

/** Depop pays through Depop; Instagram and market sales need to say how she was paid. */
export function needsPaymentMethod(platform: Platform): boolean {
  return platform !== "DEPOP";
}

/** The other places it's still listed, so she can take it down there. */
export function takeDownFrom(listedOn: readonly Platform[], soldOn: Platform): Platform[] {
  return listedOn.filter((p) => p !== soldOn);
}

/** Starting values: sold where it's listed (Depop first), at the list price, fees from the preset. */
export function saleDefaults(
  item: { listedOn: readonly Platform[]; listPrice: number | null },
  presets: FeePresets,
): { platform: Platform; soldPrice: number | null; fees: number; shipping: number } {
  const platform = PLATFORMS.find((p) => item.listedOn.includes(p)) ?? "DEPOP";
  const soldPrice = item.listPrice;
  return { platform, soldPrice, fees: soldPrice === null ? 0 : feesFor(platform, soldPrice, presets), shipping: 0 };
}

/** Money typed as text -> cents. Blank counts as $0 for optional amounts. */
const money = (label: string, opts: { required?: boolean } = {}) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (v === "") {
        if (!opts.required) return 0;
        ctx.addIssue({ code: "custom", message: `Enter ${label}.` });
        return z.NEVER;
      }
      const cents = parseMoneyToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `Enter ${label} like 12 or 12.50.` });
        return z.NEVER;
      }
      return cents;
    });

const emptyToUndefined = (v: unknown) => (v === "" || v === null ? undefined : v);

/**
 * The "Mark as sold" form. Used in the browser for instant feedback and again on the
 * server (the real check). Shipping is forced to 0 for flea market sales; Depop sales
 * are paid through Depop.
 */
export const saleFormSchema = z
  .object({
    platform: z.enum(PLATFORMS, { message: "Pick where it sold." }),
    soldPrice: money("what it sold for", { required: true }),
    soldDate: z.iso.date({ message: "Pick the date it sold." }),
    fees: money("the fees"),
    shipping: money("what shipping cost you"),
    paymentMethod: z.preprocess(
      emptyToUndefined,
      z.enum(PAYMENT_METHODS, { message: "Pick how you were paid." }).optional(),
    ),
    buyerNotes: z
      .string()
      .trim()
      .max(500, { message: "Keep this under 500 characters." })
      .optional()
      .transform((v) => (v ? v : null)),
  })
  .superRefine((v, ctx) => {
    if (needsPaymentMethod(v.platform) && !v.paymentMethod) {
      ctx.addIssue({ code: "custom", path: ["paymentMethod"], message: "Pick how you were paid." });
    }
  })
  .transform((v) => ({
    ...v,
    shipping: isHandedOver(v.platform) ? 0 : v.shipping,
    paymentMethod: (needsPaymentMethod(v.platform) ? v.paymentMethod : "DEPOP") as PaymentMethod,
  }));

export type SaleFormInput = z.input<typeof saleFormSchema>;
export type SaleValues = z.output<typeof saleFormSchema>;
export type SaleFieldErrors = Partial<Record<keyof SaleFormInput, string>>;

export const SALE_FORM_FIELDS = ["platform", "soldPrice", "soldDate", "fees", "shipping", "paymentMethod", "buyerNotes"] as const;

export function parseSaleForm(
  input: Record<string, string>,
): { ok: true; values: SaleValues } | { ok: false; errors: SaleFieldErrors } {
  const result = saleFormSchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data };
  const errors: SaleFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof SaleFormInput | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export type SalePatch = {
  status: Extract<Status, "SOLD" | "SHIPPED">;
  soldPlatform: Platform;
  soldPrice: number;
  soldDate: string;
  platformFees: number;
  shippingCost: number;
  paymentMethod: PaymentMethod;
  buyerNotes: string | null;
  /** Set for flea market sales, which are handed over on the spot. */
  shippedDate: string | null;
};

/**
 * The status change. Only items still in her bins can be sold. Shipped sales wait in
 * "To ship" (Pack today); flea market sales are done right away.
 */
export function salePatch(
  item: { status: Status },
  sale: SaleValues,
): { ok: true; patch: SalePatch } | { ok: false; message: string } {
  if (!isInStock(item.status)) return { ok: false, message: "This one's already sold." };
  const handedOver = isHandedOver(sale.platform);
  return {
    ok: true,
    patch: {
      status: handedOver ? "SHIPPED" : "SOLD",
      soldPlatform: sale.platform,
      soldPrice: sale.soldPrice,
      soldDate: sale.soldDate,
      platformFees: sale.fees,
      shippingCost: sale.shipping,
      paymentMethod: sale.paymentMethod,
      buyerNotes: sale.buyerNotes,
      shippedDate: handedOver ? sale.soldDate : null,
    },
  };
}

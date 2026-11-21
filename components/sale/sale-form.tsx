"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { markSoldAction, type MarkSoldState } from "@/app/(app)/items/actions";
import { GelTick } from "@/components/icons";
import { Chips } from "@/components/ui/chips";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { groupClass, inputClass, primaryButtonClass, textareaClass } from "@/components/ui/styles";
import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money";
import type { FeePresets } from "@/lib/pricing";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PLATFORM_LABELS,
  PLATFORMS,
  type Platform,
} from "@/lib/items/options";
import {
  SALE_FORM_FIELDS,
  feesFor,
  isHandedOver,
  needsPaymentMethod,
  parseSaleForm,
  profitMargin,
  saleDefaults,
  saleProfit,
  takeDownFrom,
  type SaleFieldErrors,
} from "@/lib/items/sale";

type Props = {
  item: { id: string; title: string; cost: number; listPrice: number | null; listedOn: Platform[]; photoUrl: string | null };
  feePresets: FeePresets;
};

const PLATFORM_OPTIONS = PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }));
const PAYMENT_OPTIONS = PAYMENT_METHODS.filter((m) => m !== "DEPOP").map((m) => ({ value: m, label: PAYMENT_METHOD_LABELS[m] }));

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Typed money as cents, treating blank or unreadable as $0 (for the live profit only). */
const cents = (text: string) => (text.trim() ? (parseMoneyToCents(text) ?? 0) : 0);

/**
 * Mark as sold: where it sold, for how much, fees (filled in from the platform's preset),
 * shipping and how she was paid. The profit updates as she types; the other places it's
 * listed are called out so she remembers to take it down.
 */
export function SaleForm({ item, feePresets }: Props) {
  const [state, formAction, pending] = useActionState<MarkSoldState, FormData>(markSoldAction, {});
  const [clientErrors, setClientErrors] = useState<SaleFieldErrors | null>(null);
  const defaults = saleDefaults(item, feePresets);

  const [platform, setPlatform] = useState<Platform>(defaults.platform);
  const [priceText, setPriceText] = useState(defaults.soldPrice === null ? "" : centsToInput(defaults.soldPrice));
  // Fees fill themselves in until she types her own.
  const [feesText, setFeesText] = useState(centsToInput(defaults.fees));
  const [feesTouched, setFeesTouched] = useState(false);
  const [shippingText, setShippingText] = useState("");
  const dateRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Sale date defaults to today in her time zone (the server only knows UTC).
  useEffect(() => {
    if (dateRef.current && !dateRef.current.value) dateRef.current.value = localToday();
  }, []);

  function autoFees(nextPlatform: Platform, nextPriceText: string) {
    if (!feesTouched) setFeesText(centsToInput(feesFor(nextPlatform, cents(nextPriceText), feePresets)));
  }

  const errors = clientErrors ?? state.errors ?? {};
  const handedOver = isHandedOver(platform);
  const soldPrice = cents(priceText);
  const fees = cents(feesText);
  const shipping = handedOver ? 0 : cents(shippingText);
  const profit = saleProfit({ soldPrice, cost: item.cost, fees, shipping });
  const margin = profitMargin(profit, soldPrice);
  const stillListed = takeDownFrom(item.listedOn, platform);

  if (state.sold) {
    return <SoldMessage sold={state.sold} stillListed={stillListed} />;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = parseSaleForm(Object.fromEntries(SALE_FORM_FIELDS.map((f) => [f, String(formData.get(f) ?? "")])));
    if (!result.ok) {
      setClientErrors(result.errors);
      const first = formRef.current?.querySelector<HTMLElement>(
        SALE_FORM_FIELDS.filter((f) => result.errors[f]).map((f) => `[name="${f}"]`).join(","),
      );
      first?.focus();
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate data-push-screen className="flex flex-col gap-5">
      <input type="hidden" name="id" value={item.id} />

      {state.formError && (
        <p role="alert" className="rounded-card bg-surface p-4 text-[15px] font-medium text-danger ring-1 ring-danger">
          {state.formError}
        </p>
      )}

      <div className={`${groupClass} flex items-center gap-3.5 p-3`}>
        {item.photoUrl ? (
          // Signed Supabase links change every hour, so next/image's cache wouldn't help here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.photoUrl} alt="" className="aspect-[4/5] w-16 shrink-0 rounded-control bg-surface-muted object-cover" />
        ) : (
          <div aria-hidden className="aspect-[4/5] w-16 shrink-0 rounded-control bg-surface-muted" />
        )}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[17px] leading-snug font-semibold">{item.title}</p>
          <p className="tabular mt-0.5 text-[13px] text-muted">
            paid {formatCents(item.cost)}
            {item.listPrice !== null && <> · listed {formatCents(item.listPrice, { whole: true })}</>}
          </p>
        </div>
      </div>

      <Chips
        name="platform"
        label="Sold on"
        options={PLATFORM_OPTIONS}
        defaultValue={defaults.platform}
        error={errors.platform}
        onChange={(value) => {
          const next = value as Platform;
          setPlatform(next);
          autoFees(next, priceText);
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sold for" htmlFor="soldPrice" error={errors.soldPrice}>
          <MoneyInput
            id="soldPrice"
            name="soldPrice"
            invalid={!!errors.soldPrice}
            value={priceText}
            onValueChange={(text) => {
              setPriceText(text);
              autoFees(platform, text);
            }}
          />
        </Field>
        <Field label="Date" htmlFor="soldDate" error={errors.soldDate}>
          <input
            ref={dateRef}
            id="soldDate"
            name="soldDate"
            type="date"
            aria-invalid={errors.soldDate ? true : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Fees"
          htmlFor="fees"
          error={errors.fees}
          hint={feesTouched ? undefined : fees === 0 ? `No fees on ${PLATFORM_LABELS[platform]}` : "Filled in for you"}
        >
          <MoneyInput
            id="fees"
            name="fees"
            invalid={!!errors.fees}
            value={feesText}
            onValueChange={(text) => {
              setFeesTouched(true);
              setFeesText(text);
            }}
          />
        </Field>
        {handedOver ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] font-semibold text-ink-violet">Shipping</p>
            <p className="flex min-h-touch items-center text-[15px] text-muted">None, handed over</p>
          </div>
        ) : (
          <Field label="Shipping I paid" htmlFor="shipping" error={errors.shipping}>
            <MoneyInput
              id="shipping"
              name="shipping"
              invalid={!!errors.shipping}
              value={shippingText}
              onValueChange={setShippingText}
            />
          </Field>
        )}
      </div>

      {needsPaymentMethod(platform) && (
        <Chips
          key={platform}
          name="paymentMethod"
          label="Paid by"
          options={PAYMENT_OPTIONS}
          error={errors.paymentMethod}
        />
      )}

      <Field label="Note" htmlFor="buyerNotes" error={errors.buyerNotes} hint="Optional. Who bought it, anything to remember.">
        <textarea
          id="buyerNotes"
          name="buyerNotes"
          rows={2}
          aria-invalid={errors.buyerNotes ? true : undefined}
          className={textareaClass}
        />
      </Field>

      <section aria-live="polite" className={`${groupClass} px-4 py-3.5`}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[17px] font-semibold">Profit</h2>
          <p className={`tabular text-[28px] leading-none font-extrabold ${profit < 0 ? "text-danger" : "text-ink-violet"}`}>
            {formatCents(profit)}
          </p>
        </div>
        <p className="tabular mt-2 text-[13px] text-muted">
          {formatCents(soldPrice)} sold − {formatCents(item.cost)} paid − {formatCents(fees)} fees
          {!handedOver && <> − {formatCents(shipping)} shipping</>}
          {margin !== null && <>. That&apos;s {margin}% of the sale.</>}
        </p>
      </section>

      {stillListed.length > 0 && <TakeDownReminder platforms={stillListed} />}

      {/* Space so the last field isn't hidden behind the button. */}
      <div className="h-16" aria-hidden />

      <div className="fixed inset-x-0 bottom-(--tab-offset) pb-(--save-pad) z-10 bg-gradient-to-t from-bg from-60% to-transparent pt-4 lg:bottom-0 lg:left-sidebar">
        <div className="mx-auto max-w-page px-gutter pb-3 lg:px-10 lg:pb-6">
          <button type="submit" disabled={pending} className={`${primaryButtonClass} lg:ml-auto lg:w-60`}>
            {pending ? "Saving…" : "Mark as sold"}
          </button>
        </div>
      </div>
    </form>
  );
}

function TakeDownReminder({ platforms }: { platforms: Platform[] }) {
  return (
    <p role="note" className="rounded-card bg-surface px-4 py-3 text-[15px] font-semibold text-warning ring-1 ring-warning/40">
      Take it down from {platforms.map((p) => PLATFORM_LABELS[p]).join(" and ")} so nobody else buys it.
    </p>
  );
}

function SoldMessage({ sold, stillListed }: { sold: NonNullable<MarkSoldState["sold"]>; stillListed: Platform[] }) {
  return (
    <div className="flex flex-col gap-4">
      <section role="status" className={`${groupClass} px-5 py-5`}>
        <p className="flex items-center gap-2 text-[20px] font-bold">
          <GelTick draw className="text-ink-aqua" size={24} />
          Sold for {formatCents(sold.soldPrice)}
        </p>
        <p className={`tabular mt-3 text-[34px] leading-none font-extrabold ${sold.profit < 0 ? "text-danger" : "text-ink-violet"}`}>
          {formatCents(sold.profit)}
        </p>
        <p className="mt-1 text-[15px] text-muted">profit after what you paid, fees and shipping</p>
        <p className="mt-4 text-[15px]">
          {sold.handedOver ? "Handed over, so there's nothing to pack." : "It's waiting under “To ship”. Pack it within 3 to 5 days."}
        </p>
      </section>
      {stillListed.length > 0 && <TakeDownReminder platforms={stillListed} />}
      <Link href="/" className={primaryButtonClass}>
        Back to inventory
      </Link>
    </div>
  );
}

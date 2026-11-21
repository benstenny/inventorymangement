"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { saveSettingsAction, type SettingsFormState } from "@/app/(app)/settings/actions";
import { CloseIcon, GelTick, PlusIcon } from "@/components/icons";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { groupClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { PLATFORM_LABELS, PLATFORMS } from "@/lib/items/options";
import { formatCents, parseMoneyToCents } from "@/lib/money";
import { SETTINGS_FORM_FIELDS, parseSettingsForm, type SettingsFieldErrors } from "@/lib/settings";

const sectionHeading = "mb-2.5 px-1 text-[20px] font-bold";

/**
 * Shop settings: pricing rules, fees, shipping window, budgets and suggestion lists.
 * One pinned "Save settings" saves the lot. Checked in the browser, then again on the server.
 */
export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [state, formAction, pending] = useActionState<SettingsFormState, FormData>(saveSettingsAction, { savedCount: 0 });
  const [clientErrors, setClientErrors] = useState<SettingsFieldErrors | null>(null);
  const [stockText, setStockText] = useState(initial.inventoryBudget);
  const [upkeepText, setUpkeepText] = useState(initial.upkeepBudget);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = clientErrors ?? state.errors ?? {};
  const total = (parseMoneyToCents(stockText) ?? 0) + (parseMoneyToCents(upkeepText) ?? 0);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = parseSettingsForm(Object.fromEntries(SETTINGS_FORM_FIELDS.map((f) => [f, String(formData.get(f) ?? "")])));
    if (!result.ok) {
      setClientErrors(result.errors);
      const first = formRef.current?.querySelector<HTMLElement>(
        SETTINGS_FORM_FIELDS.filter((f) => result.errors[f]).map((f) => `[name="${f}"]`).join(","),
      );
      // List fields are hidden inputs: focus their "Add" box instead.
      const target = first?.getAttribute("type") === "hidden" ? first.parentElement?.querySelector<HTMLElement>("input:not([type=hidden])") : first;
      target?.focus();
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {state.formError && (
        <p role="alert" className="rounded-card bg-surface p-4 text-[15px] font-medium text-danger ring-1 ring-danger">
          {state.formError}
        </p>
      )}

      <section aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className={sectionHeading}>
          Pricing
        </h2>
        <div className={`${groupClass} flex flex-col gap-4 p-4`}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lowest price" htmlFor="minPrice" error={errors.minPrice} hint="Never sell for less">
              <MoneyInput id="minPrice" name="minPrice" cents={parseMoneyToCents(initial.minPrice)} invalid={!!errors.minPrice} />
            </Field>
            <Field label="Haggle room" htmlFor="haggleRoom" error={errors.haggleRoom} hint="Most you'll come down">
              <MoneyInput id="haggleRoom" name="haggleRoom" cents={parseMoneyToCents(initial.haggleRoom)} invalid={!!errors.haggleRoom} />
            </Field>
          </div>
          <Field
            label="Nudge to lower the price after"
            htmlFor="staleDays"
            error={errors.staleDays}
            hint="Listed this long without selling shows “Try a lower price”."
          >
            <UnitInput id="staleDays" name="staleDays" defaultValue={initial.staleDays} unit="days" invalid={!!errors.staleDays} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="fees-heading">
        <h2 id="fees-heading" className={sectionHeading}>
          Fees
        </h2>
        <div className={`${groupClass} flex flex-col gap-4 p-4`}>
          <p className="text-[13px] text-muted">
            What each place takes from a sale: a percent plus a fixed amount. Check Depop&apos;s current fees in your Depop account.
          </p>
          {PLATFORMS.map((p) => {
            const pctName = `fee_${p}_percent` as const;
            const fixedName = `fee_${p}_fixed` as const;
            const error = errors[pctName] ?? errors[fixedName];
            return (
              <fieldset key={p} className="flex flex-col gap-1.5">
                <legend className={`${labelClass} mb-1.5`}>{PLATFORM_LABELS[p]}</legend>
                <div className="grid grid-cols-2 gap-3">
                  <UnitInput id={pctName} name={pctName} defaultValue={initial[pctName]} unit="%" invalid={!!errors[pctName]} label={`${PLATFORM_LABELS[p]} percent`} />
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="font-semibold text-muted">
                      +
                    </span>
                    <div className="flex-1">
                      <label htmlFor={fixedName} className="sr-only">
                        {PLATFORM_LABELS[p]} fixed fee
                      </label>
                      <MoneyInput id={fixedName} name={fixedName} cents={parseMoneyToCents(initial[fixedName])} invalid={!!errors[fixedName]} />
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="text-[13px] font-medium text-danger" role="alert">
                    {error}
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="shipping-heading">
        <h2 id="shipping-heading" className={sectionHeading}>
          Shipping
        </h2>
        <div className={`${groupClass} p-4`}>
          <Field label="Ship within" htmlFor="shipWithinDays" error={errors.shipWithinDays} hint="Sets the “Ship by” date in Pack today.">
            <UnitInput id="shipWithinDays" name="shipWithinDays" defaultValue={initial.shipWithinDays} unit="days of a sale" invalid={!!errors.shipWithinDays} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="budgets-heading" id="budgets" className="scroll-mt-6">
        <h2 id="budgets-heading" className={sectionHeading}>
          Budgets
        </h2>
        <div className={`${groupClass} flex flex-col gap-3 p-4`}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stock / month" htmlFor="inventoryBudget" error={errors.inventoryBudget}>
              <MoneyInput id="inventoryBudget" name="inventoryBudget" invalid={!!errors.inventoryBudget} value={stockText} onValueChange={setStockText} />
            </Field>
            <Field label="Upkeep / month" htmlFor="upkeepBudget" error={errors.upkeepBudget}>
              <MoneyInput id="upkeepBudget" name="upkeepBudget" invalid={!!errors.upkeepBudget} value={upkeepText} onValueChange={setUpkeepText} />
            </Field>
          </div>
          <p className="tabular text-[15px] text-muted">
            Total <span className="font-semibold text-text">{formatCents(total, { whole: true })}</span> a month. Stock is what
            you pay for finds; upkeep is supplies, laundromat and other expenses.
          </p>
        </div>
      </section>

      <section aria-labelledby="lists-heading">
        <h2 id="lists-heading" className={sectionHeading}>
          Suggestions
        </h2>
        <div className={`${groupClass} flex flex-col gap-5 p-4`}>
          <ListEditor name="sources" label="Where I shop" placeholder="Add a store" initial={initial.sources} error={errors.sources} />
          <ListEditor name="storageSpots" label="Storage spots" placeholder="Add a bin or shelf" initial={initial.storageSpots} error={errors.storageSpots} />
        </div>
      </section>

      {state.savedCount > 0 && !pending && !clientErrors && !state.errors && (
        <p role="status" className="flex items-center gap-2 px-1 text-[15px] font-semibold">
          <GelTick draw className="text-ink-aqua" size={20} />
          Settings saved
        </p>
      )}

      <div className="h-12" aria-hidden />
      <div className="fixed inset-x-0 bottom-(--tab-offset) pb-(--save-pad) z-10 bg-gradient-to-t from-bg from-60% to-transparent pt-4 lg:bottom-0 lg:left-sidebar">
        <div className="mx-auto max-w-page px-gutter pb-3 lg:px-10 lg:pb-6">
          <button type="submit" disabled={pending} className={`${primaryButtonClass} lg:ml-auto lg:w-60`}>
            {pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>
    </form>
  );
}

/** A short number field with its unit beside it ("5 days of a sale", "10 %"). */
function UnitInput({
  id,
  name,
  defaultValue,
  unit,
  invalid,
  label,
}: {
  id: string;
  name: string;
  defaultValue: string;
  unit: string;
  invalid: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      )}
      <div className="w-24 shrink-0">
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={defaultValue}
          aria-invalid={invalid || undefined}
          className={`${inputClass} tabular text-center`}
        />
      </div>
      <span aria-hidden className="text-[15px] whitespace-nowrap text-muted">
        {unit}
      </span>
    </div>
  );
}

/** Editable chips: tap ✕ to remove, type and Add to add. Sent as one name per line. */
function ListEditor({
  name,
  label,
  placeholder,
  initial,
  error,
}: {
  name: string;
  label: string;
  placeholder: string;
  initial: string;
  error?: string;
}) {
  const [items, setItems] = useState(() => initial.split("\n").filter(Boolean));
  const [draft, setDraft] = useState("");
  const inputId = `${name}-new`;

  function add() {
    const value = draft.trim().replace(/\s+/g, " ");
    if (value && !items.some((i) => i.toLowerCase() === value.toLowerCase())) setItems([...items, value]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input type="hidden" name={name} value={items.join("\n")} />
      {items.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="flex min-h-touch items-center gap-1 rounded-pill border-2 border-border bg-surface-raised pl-4 text-[15px] font-semibold text-ink-violet">
              {item}
              <button
                type="button"
                onClick={() => setItems(items.filter((i) => i !== item))}
                aria-label={`Remove ${item}`}
                className="flex size-touch items-center justify-center rounded-pill text-muted hover:text-danger"
              >
                <CloseIcon size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          maxLength={40}
          className={inputClass}
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Add to ${label}`}
          className="flex size-touch shrink-0 items-center justify-center rounded-pill border-2 border-edge bg-accent gloss text-on-accent shadow-gloss"
        >
          <PlusIcon size={20} />
        </button>
      </div>
      {error && (
        <p className="text-[13px] font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

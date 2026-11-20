"use client";

import Link from "next/link";
import { startTransition, useActionState, useCallback, useEffect, useRef, useState } from "react";
import { saveItem, type SaveItemState } from "@/app/(app)/items/actions";
import { Chips, MultiChips } from "@/components/ui/chips";
import { Field } from "@/components/ui/field";
import { GelTick, ChevronRightIcon } from "@/components/icons";
import { groupClass, inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money";
import { suggestPrices, type FeePreset, type PricingSettings } from "@/lib/pricing";
import { formatInches, measurementField, measurementsFor, type Measurements } from "@/lib/items/measurements";
import {
  CONDITIONS,
  FORM_STATUSES,
  PHOTO_SLOTS,
  PHOTO_SLOT_LABELS,
  PLATFORMS,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type PhotoSlot,
  type Platform,
} from "@/lib/items/options";
import { formDataToInput, parseItemForm, type FieldErrors } from "@/lib/items/schema";
import { PhotoPicker } from "./photo-picker";

export type ItemFormDefaults = {
  id?: string;
  sku?: string;
  title?: string;
  categoryId?: string;
  sourceCost?: number;
  storageLocation?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  condition?: string | null;
  flaws?: string | null;
  description?: string | null;
  measurements?: Measurements;
  washed?: boolean;
  source?: string | null;
  acquiredDate?: string;
  status?: string;
  listedOn?: readonly Platform[];
  listPrice?: number | null;
  photos?: Partial<Record<PhotoSlot, { path: string | null; url: string | null }>>;
};

export type FormCategory = { id: string; name: string; skuPrefix: string };

type Props = {
  mode: "create" | "edit";
  categories: FormCategory[];
  defaults: ItemFormDefaults;
  /** Suggestions for the "Where you got it" and "Storage spot" fields. */
  sources: string[];
  storageSpots: string[];
  /** For the "lowest to take / list at" hint under the cost. */
  pricing: PricingSettings;
  fees: FeePreset;
  /** Platforms she used last time, pre-ticked when she marks something as listed. */
  lastPlatforms?: readonly Platform[];
  /** Set for sold/shipped/returned items: status is shown, not editable. */
  lockedStatusLabel?: string;
};

const PHOTO_FIELD = {
  front: "photoFrontPath",
  back: "photoBackPath",
  styled: "photoStyledPath",
} as const satisfies Record<PhotoSlot, keyof FieldErrors>;

/** Fields inside the collapsed "More details" section. */
const DETAIL_FIELDS = new Set<string>([
  "brand", "size", "color", "condition", "flaws", "description", "source", "acquiredDate", "status", "listedOn", "listPrice",
]);

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ItemForm({ mode, defaults, lastPlatforms, ...rest }: Props) {
  const [state, formAction, pending] = useActionState<SaveItemState, FormData>(saveItem, { savedCount: 0 });
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const formRef = useRef<HTMLFormElement>(null);

  // After adding an item, jump back to the top of the fresh form.
  useEffect(() => {
    if (mode === "create" && state.savedCount > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mode, state.savedCount]);

  const errors = clientErrors ?? state.errors ?? {};
  const uploading = Object.values(uploads).some(Boolean);

  const handleUploadingChange = useCallback((name: string, isUploading: boolean) => {
    setUploads((prev) => (prev[name] === isUploading ? prev : { ...prev, [name]: isUploading }));
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = parseItemForm(formDataToInput(formData));
    if (!result.ok) {
      setClientErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  /** Opens the section holding the first error, then focuses it. Form order decides "first". */
  function focusFirstError(fieldErrors: FieldErrors) {
    const form = formRef.current;
    if (!form) return;
    const el = [...form.querySelectorAll<HTMLElement>("[name]")].find(
      (node) => fieldErrors[node.getAttribute("name") as keyof FieldErrors],
    );
    if (!el) return;
    const section = el.closest("details");
    if (section) section.open = true;
    el.focus();
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  // Marking it Listed with nothing ticked yet: tick the platforms she used last time.
  const handleStatusChange = useCallback(
    (status: string) => {
      const form = formRef.current;
      if (status !== "LISTED" || !lastPlatforms?.length || !form) return;
      if (form.querySelector('input[name="listedOn"]:checked')) return;
      for (const platform of lastPlatforms) {
        const option = form.querySelector<HTMLInputElement>(`input[name="listedOn"][value="${platform}"]`);
        if (option) option.checked = true;
      }
    },
    [lastPlatforms],
  );

  // In create mode, every successful save remounts the fields (clean form).
  const fieldsKey = mode === "create" ? state.savedCount : 0;
  // Remembered values from the save that just happened win over the page's defaults.
  const carry = state.carryOver;
  const values: ItemFormDefaults =
    mode === "create" && carry
      ? {
          ...defaults,
          source: carry.source ?? defaults.source,
          storageLocation: carry.storageLocation ?? defaults.storageLocation,
        }
      : defaults;

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <SaveMessage mode={mode} state={state} />

      <ItemFields
        key={fieldsKey}
        mode={mode}
        values={values}
        errors={errors}
        onUploadingChange={handleUploadingChange}
        onStatusChange={handleStatusChange}
        {...rest}
      />

      {/* Space so the last field isn't hidden behind the save bar. */}
      <div className="h-16" aria-hidden />

      {/* Pinned save: just above the tab bar on a phone, along the bottom edge on a laptop. */}
      <div className="fixed inset-x-0 bottom-[calc(var(--spacing-bar)+env(safe-area-inset-bottom))] z-10 bg-gradient-to-t from-bg from-60% to-transparent pt-4 lg:bottom-0 lg:left-sidebar">
        <div className="mx-auto max-w-page px-gutter pb-3 lg:max-w-wide lg:px-10 lg:pb-6">
          <button type="submit" disabled={pending || uploading} className={`${primaryButtonClass} lg:ml-auto lg:w-60`}>
            {uploading ? "Uploading photo…" : pending ? "Saving…" : "Save item"}
          </button>
        </div>
      </div>
    </form>
  );
}

function SaveMessage({ mode, state }: { mode: Props["mode"]; state: SaveItemState }) {
  if (state.formError) {
    return (
      <p role="alert" className="rounded-card bg-surface-muted p-4 text-[15px] font-medium text-danger ring-1 ring-danger">
        {state.formError}
      </p>
    );
  }
  if (!state.saved) return null;
  return (
    <p role="status" className={`${groupClass} flex items-center justify-between gap-3 py-1 pr-1 pl-4`}>
      <span className="flex items-center gap-2 font-semibold">
        <GelTick draw className="text-ink-aqua" size={22} />
        {mode === "create" ? (
          <span>
            Saved <span className="font-mono text-[15px] text-muted">{state.saved.sku}</span>
          </span>
        ) : (
          "Changes saved"
        )}
      </span>
      {mode === "create" && (
        <Link
          href={`/items/${state.saved.id}`}
          className="flex min-h-touch items-center gap-0.5 px-3 font-semibold text-ink-lilac"
        >
          View
          <ChevronRightIcon size={18} />
        </Link>
      )}
    </p>
  );
}

type FieldsProps = Omit<Props, "defaults" | "lastPlatforms"> & {
  values: ItemFormDefaults;
  errors: FieldErrors;
  onUploadingChange: (name: string, uploading: boolean) => void;
  onStatusChange: (status: string) => void;
};

function ItemFields({
  mode,
  values,
  categories,
  errors,
  sources,
  storageSpots,
  pricing,
  fees,
  onUploadingChange,
  onStatusChange,
  lockedStatusLabel,
}: FieldsProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [categoryId, setCategoryId] = useState(values.categoryId ?? "");
  const [cost, setCost] = useState<number | null>(values.sourceCost ?? null);

  // New items default to today in her time zone (the server only knows UTC).
  useEffect(() => {
    if (mode === "create" && dateRef.current && !values.acquiredDate) dateRef.current.value = localToday();
  }, [mode, values.acquiredDate]);

  const prefix = categories.find((c) => c.id === categoryId)?.skuPrefix;
  const guides = measurementsFor(prefix);
  const hasError = (fields: Iterable<string>) => [...fields].some((f) => errors[f as keyof FieldErrors]);
  const suggestion = cost === null ? null : suggestPrices(cost, fees, pricing);

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-start lg:gap-10">
      {/* Photos lead. On a laptop they stay in view in their own column while the fields scroll. */}
      <section aria-label="Photos" className="lg:sticky lg:top-6">
        <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-2 lg:gap-3 lg:[&>*:first-child]:col-span-2">
          {PHOTO_SLOTS.map((slot) => (
            <PhotoPicker
              key={slot}
              name={PHOTO_FIELD[slot]}
              label={PHOTO_SLOT_LABELS[slot]}
              initialPath={values.photos?.[slot]?.path ?? null}
              initialUrl={values.photos?.[slot]?.url ?? null}
              error={errors[PHOTO_FIELD[slot]]}
              onUploadingChange={onUploadingChange}
            />
          ))}
        </div>
        <p className="mt-2 text-[13px] text-muted">Front, back, then styled on the mannequin.</p>
      </section>

      <div className="flex min-w-0 flex-col gap-6">
      <Field label="Title" htmlFor="title" error={errors.title}>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          autoCapitalize="sentences"
          placeholder="Y2K baby tee"
          aria-invalid={errors.title ? true : undefined}
          className={inputClass}
        />
      </Field>

      <Chips
        name="categoryId"
        label="Category"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        defaultValue={values.categoryId}
        error={errors.categoryId}
        onChange={setCategoryId}
      />

      <div className="flex flex-col gap-1">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cost" htmlFor="sourceCost" error={errors.sourceCost}>
            <MoneyInput
              id="sourceCost"
              name="sourceCost"
              cents={values.sourceCost}
              invalid={!!errors.sourceCost}
              onCentsChange={setCost}
            />
          </Field>
          <Field label="Storage spot" htmlFor="storageLocation" error={errors.storageLocation}>
            <SuggestInput
              id="storageLocation"
              name="storageLocation"
              defaultValue={values.storageLocation}
              suggestions={storageSpots}
              placeholder="Tops bin"
              invalid={!!errors.storageLocation}
            />
          </Field>
        </div>
        {suggestion && <PriceHint lowest={suggestion.lowest} listAt={suggestion.listAt} />}
      </div>

      <WashedToggle defaultChecked={values.washed} />

      {guides.length > 0 && (
        <details
          open={hasError(guides.map((g) => measurementField(g.key))) || undefined}
          className={`group ${groupClass}`}
        >
          <SectionSummary>
            Measurements
            <span className="tabular text-[15px] font-medium text-muted">
              {guides.filter((g) => values.measurements?.[g.key] !== undefined).length} of {guides.length}
            </span>
          </SectionSummary>
          <div className="flex flex-col gap-4 border-t border-hairline px-4 pt-4 pb-5">
            <p className="text-[15px] text-muted">Lay it flat, smooth it out, and measure in inches.</p>
            {guides.map((g) => {
              const field = measurementField(g.key);
              return (
                <Field key={g.key} label={g.label} htmlFor={field} error={errors[field]} hint={g.how}>
                  <div className="relative w-1/2">
                    <input
                      id={field}
                      name={field}
                      inputMode="decimal"
                      autoComplete="off"
                      defaultValue={formatInches(values.measurements?.[g.key])}
                      aria-invalid={errors[field] ? true : undefined}
                      className={`${inputClass} pr-9`}
                    />
                    <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
                      in
                    </span>
                  </div>
                </Field>
              );
            })}
          </div>
        </details>
      )}

      <details open={hasError(DETAIL_FIELDS) || undefined} className={`group ${groupClass}`}>
        <SectionSummary>
          More details
          <span className="text-[15px] font-medium text-muted">Brand, flaws, price</span>
        </SectionSummary>

        <div className="flex flex-col gap-5 border-t border-hairline px-4 pt-4 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <TextField name="brand" label="Brand" values={values} errors={errors} />
            <TextField name="size" label="Size" values={values} errors={errors} placeholder="M, W28, US 8" />
          </div>
          <TextField name="color" label="Color" values={values} errors={errors} />

          <Chips
            name="condition"
            label="Condition"
            options={CONDITIONS.map((c) => ({ value: c, label: c }))}
            defaultValue={values.condition}
            error={errors.condition}
          />

          <Field label="Flaws" htmlFor="flaws" error={errors.flaws} hint="Stains, holes, pilling, missing buttons. Photograph them too.">
            <textarea
              id="flaws"
              name="flaws"
              rows={2}
              defaultValue={values.flaws ?? ""}
              placeholder="None"
              className={`${inputClass} rounded-card py-2.5`}
            />
          </Field>

          <Field label="Notes" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={values.description ?? ""}
              placeholder="Fabric, era, how it fits"
              className={`${inputClass} rounded-card py-2.5`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Where you got it" htmlFor="source" error={errors.source}>
              <SuggestInput
                id="source"
                name="source"
                defaultValue={values.source}
                suggestions={sources}
                placeholder="Goodwill"
                invalid={!!errors.source}
              />
            </Field>
            <Field label="Date you got it" htmlFor="acquiredDate" error={errors.acquiredDate}>
              <input
                ref={dateRef}
                id="acquiredDate"
                name="acquiredDate"
                type="date"
                defaultValue={values.acquiredDate}
                aria-invalid={errors.acquiredDate ? true : undefined}
                className={inputClass}
              />
            </Field>
          </div>

          {lockedStatusLabel ? (
            <div className="flex flex-col gap-1">
              {/* Placeholder so validation passes; the server keeps the real status. */}
              <input type="hidden" name="status" value="SOURCED" />
              <span className={labelClass}>Status</span>
              <p className="flex items-center gap-2 text-muted">
                {lockedStatusLabel === "Sold" || lockedStatusLabel === "Shipped" ? (
                  <span className="holo rounded-[8px] px-2 py-0.5 text-[13px] font-extrabold tracking-wide uppercase">
                    {lockedStatusLabel}
                  </span>
                ) : (
                  <span className="font-semibold text-text">{lockedStatusLabel}.</span>
                )}
                Editing details here won&apos;t change the sale.
              </p>
            </div>
          ) : (
            <Chips
              name="status"
              label="Status"
              options={FORM_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              defaultValue={values.status ?? "SOURCED"}
              error={errors.status}
              onChange={onStatusChange}
            />
          )}

          <MultiChips
            name="listedOn"
            label="Listed on"
            options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABELS[p] }))}
            defaultValues={values.listedOn}
            error={errors.listedOn}
            hint="Tick every place it's up for sale. Leave blank if it isn't listed yet."
          />

          <Field label="Price" htmlFor="listPrice" error={errors.listPrice} className="w-1/2">
            <MoneyInput id="listPrice" name="listPrice" cents={values.listPrice} invalid={!!errors.listPrice} />
          </Field>
        </div>
      </details>
      </div>
    </div>
  );
}

/** iOS disclosure row: label, a quiet summary on the right, and a chevron that turns when open. */
function SectionSummary({ children }: { children: React.ReactNode }) {
  return (
    <summary className="flex min-h-[52px] cursor-pointer list-none items-center gap-2 pr-3 pl-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
      <span className="flex flex-1 items-center justify-between gap-2">{children}</span>
      <ChevronRightIcon
        size={20}
        className="text-muted transition-transform duration-200 ease-out-expo group-open:rotate-90"
      />
    </summary>
  );
}

/** Lowest price she should take and where to list it, written in pink gel ink. */
function PriceHint({ lowest, listAt }: { lowest: number; listAt: number }) {
  return (
    <p className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[15px] text-muted">
      <span>
        Lowest to take{" "}
        <span className="tabular text-[17px] font-extrabold text-ink-pink">{formatCents(lowest, { whole: true })}</span>
      </span>
      <span>
        List at{" "}
        <span className="tabular text-[17px] font-extrabold text-ink-pink">{formatCents(listAt, { whole: true })}+</span>
      </span>
    </p>
  );
}

/** iOS-style switch row. Turning it on inks a gel tick beside the label. */
function WashedToggle({ defaultChecked }: { defaultChecked?: boolean }) {
  const [on, setOn] = useState(!!defaultChecked);
  const [touched, setTouched] = useState(false);
  return (
    <label className={`${groupClass} flex min-h-[52px] cursor-pointer items-center gap-3 px-4`}>
      <span className="flex flex-1 items-center gap-2 text-[17px] font-semibold">
        Washed and steamed
        {on && <GelTick draw={touched} className="text-ink-aqua" size={20} />}
      </span>
      <input
        type="checkbox"
        name="washed"
        role="switch"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          setTouched(true);
        }}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="relative h-[31px] w-[51px] shrink-0 rounded-pill border-2 border-border bg-surface-raised shadow-pearl transition-colors duration-200 peer-checked:border-edge peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus after:absolute after:top-[2px] after:left-[2px] after:size-[23px] after:rounded-pill after:bg-border after:transition-[transform,background-color] after:duration-200 after:ease-out-expo peer-checked:after:translate-x-5 peer-checked:after:bg-accent peer-checked:after:shadow-gloss"
      />
    </label>
  );
}

function TextField({
  name,
  label,
  values,
  errors,
  placeholder,
}: {
  name: "brand" | "size" | "color";
  label: string;
  values: ItemFormDefaults;
  errors: FieldErrors;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={name} error={errors[name]}>
      <input
        id={name}
        name={name}
        defaultValue={values[name] ?? ""}
        placeholder={placeholder}
        aria-invalid={errors[name] ? true : undefined}
        className={inputClass}
      />
    </Field>
  );
}

/** Free text with the phone's suggestion list (her usual stores, her bins). */
function SuggestInput({
  id,
  name,
  defaultValue,
  suggestions,
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  defaultValue?: string | null;
  suggestions: string[];
  placeholder?: string;
  invalid: boolean;
}) {
  const listId = `${id}-suggestions`;
  return (
    <>
      <input
        id={id}
        name={name}
        list={listId}
        autoComplete="off"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={inputClass}
      />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

function MoneyInput({
  id,
  name,
  cents,
  invalid,
  onCentsChange,
}: {
  id: string;
  name: string;
  cents?: number | null;
  invalid: boolean;
  onCentsChange?: (cents: number | null) => void;
}) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center font-semibold text-muted">
        $
      </span>
      <input
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={cents === null || cents === undefined ? "" : centsToInput(cents)}
        placeholder="0"
        aria-invalid={invalid || undefined}
        onChange={onCentsChange && ((e) => onCentsChange(e.target.value.trim() ? parseMoneyToCents(e.target.value) : null))}
        className={`${inputClass} tabular pl-7`}
      />
    </div>
  );
}

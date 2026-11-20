"use client";

import Link from "next/link";
import { startTransition, useActionState, useCallback, useEffect, useRef, useState } from "react";
import { saveItem, type SaveItemState } from "@/app/(app)/items/actions";
import { Chips } from "@/components/ui/chips";
import { Field } from "@/components/ui/field";
import { inputClass, primaryButtonClass } from "@/components/ui/styles";
import { centsToInput } from "@/lib/money";
import { CONDITIONS, FORM_STATUSES, LISTED_ON, LISTED_ON_LABELS, STATUS_LABELS, type ListedOn } from "@/lib/items/options";
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
  description?: string | null;
  source?: string | null;
  acquiredDate?: string;
  status?: string;
  listedOn?: string | null;
  listPrice?: number | null;
  photoPath?: string | null;
  photoUrl?: string | null;
};

type Props = {
  mode: "create" | "edit";
  categories: { id: string; name: string }[];
  defaults: ItemFormDefaults;
  /** Platform she used last time, pre-picked when she marks something as listed. */
  lastPlatform?: ListedOn;
  /** Set for sold/shipped/returned items: status is shown, not editable. */
  lockedStatusLabel?: string;
};

/** Order matters: the first field with an error gets focus. */
const FIELD_ORDER: (keyof FieldErrors)[] = [
  "photoPath", "title", "categoryId", "sourceCost", "storageLocation", "brand", "size", "color",
  "condition", "description", "source", "acquiredDate", "status", "listedOn", "listPrice",
];
const DETAIL_FIELDS = new Set<keyof FieldErrors>([
  "brand", "size", "color", "condition", "description", "source", "acquiredDate", "status", "listedOn", "listPrice",
]);

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ItemForm({ mode, categories, defaults, lastPlatform, lockedStatusLabel }: Props) {
  const [state, formAction, pending] = useActionState<SaveItemState, FormData>(saveItem, { savedCount: 0 });
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [uploading, setUploading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // After adding an item, jump back to the top of the fresh form.
  useEffect(() => {
    if (mode === "create" && state.savedCount > 0) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [mode, state.savedCount]);

  const errors = clientErrors ?? state.errors ?? {};

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const input = formDataToInput(formData);
    const result = parseItemForm(input);
    if (!result.ok) {
      setClientErrors(result.errors);
      focusFirstError(result.errors);
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  function focusFirstError(fieldErrors: FieldErrors) {
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (!first) return;
    if (DETAIL_FIELDS.has(first) && detailsRef.current) detailsRef.current.open = true;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  // Marking it Listed with no platform yet: pre-pick the one she used last time.
  const handleStatusChange = useCallback(
    (status: string) => {
      if (status !== "LISTED" || !lastPlatform || !formRef.current) return;
      const chosen = formRef.current.querySelector<HTMLInputElement>('input[name="listedOn"]:checked');
      if (chosen && chosen.value !== "") return;
      const option = formRef.current.querySelector<HTMLInputElement>(`input[name="listedOn"][value="${lastPlatform}"]`);
      if (option) option.checked = true;
    },
    [lastPlatform],
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
        categories={categories}
        errors={errors}
        detailsRef={detailsRef}
        onUploadingChange={setUploading}
        onStatusChange={handleStatusChange}
        lockedStatusLabel={lockedStatusLabel}
      />

      {/* Space so the last field isn't hidden behind the save bar. */}
      <div className="h-touch" aria-hidden />

      <div className="fixed inset-x-0 bottom-[calc(var(--spacing-bar)+env(safe-area-inset-bottom))] z-10 border-t border-border bg-bg">
        <div className="mx-auto max-w-page px-gutter py-3">
          <button type="submit" disabled={pending || uploading} className={primaryButtonClass}>
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
      <p role="alert" className="rounded-card border border-danger bg-surface p-3 text-sm text-danger">
        {state.formError}
      </p>
    );
  }
  if (!state.saved) return null;
  return (
    <p role="status" className="flex items-center justify-between gap-3 rounded-card bg-surface p-3 text-sm shadow-card">
      <span>
        <span className="text-success">Saved</span>{" "}
        {mode === "create" ? <span className="font-medium">{state.saved.sku}</span> : "your changes"}
      </span>
      {mode === "create" && (
        <Link href={`/items/${state.saved.id}`} className="flex min-h-touch items-center px-2 font-medium underline">
          View
        </Link>
      )}
    </p>
  );
}

type FieldsProps = {
  mode: Props["mode"];
  values: ItemFormDefaults;
  categories: Props["categories"];
  errors: FieldErrors;
  detailsRef: React.RefObject<HTMLDetailsElement | null>;
  onUploadingChange: (uploading: boolean) => void;
  onStatusChange: (status: string) => void;
  lockedStatusLabel?: string;
};

function ItemFields({
  mode,
  values,
  categories,
  errors,
  detailsRef,
  onUploadingChange,
  onStatusChange,
  lockedStatusLabel,
}: FieldsProps) {
  const dateRef = useRef<HTMLInputElement>(null);

  // New items default to today in her time zone (the server only knows UTC).
  useEffect(() => {
    if (mode === "create" && dateRef.current && !values.acquiredDate) dateRef.current.value = localToday();
  }, [mode, values.acquiredDate]);

  const hasDetailErrors = [...DETAIL_FIELDS].some((f) => errors[f]);

  return (
    <>
      <PhotoPicker
        initialPath={values.photoPath ?? null}
        initialUrl={values.photoUrl ?? null}
        error={errors.photoPath}
        onUploadingChange={onUploadingChange}
      />

      <Field label="Title" htmlFor="title" error={errors.title}>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          autoCapitalize="sentences"
          placeholder="Levi's 501 jeans"
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
      />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost" htmlFor="sourceCost" error={errors.sourceCost}>
          <MoneyInput id="sourceCost" name="sourceCost" cents={values.sourceCost} invalid={!!errors.sourceCost} />
        </Field>
        <Field label="Storage spot" htmlFor="storageLocation" error={errors.storageLocation}>
          <input
            id="storageLocation"
            name="storageLocation"
            defaultValue={values.storageLocation ?? ""}
            placeholder="Bin B"
            aria-invalid={errors.storageLocation ? true : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <details ref={detailsRef} open={hasDetailErrors || undefined} className="group rounded-card bg-surface shadow-card">
        <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 px-4 font-medium [&::-webkit-details-marker]:hidden">
          <span aria-hidden className="transition-transform group-open:rotate-90">▸</span>
          More details
        </summary>

        <div className="flex flex-col gap-5 px-4 pt-2 pb-5">
          <div className="grid grid-cols-2 gap-3">
            <TextField name="brand" label="Brand" values={values} errors={errors} />
            <TextField name="size" label="Size" values={values} errors={errors} placeholder="M, W28, UK 6" />
          </div>
          <TextField name="color" label="Color" values={values} errors={errors} />

          <Chips
            name="condition"
            label="Condition"
            options={CONDITIONS.map((c) => ({ value: c, label: c }))}
            defaultValue={values.condition}
            error={errors.condition}
          />

          <Field label="Description and flaws" htmlFor="description" error={errors.description}>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={values.description ?? ""}
              placeholder="Measurements, fabric, any marks or holes"
              className={`${inputClass} py-2`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <TextField name="source" label="Where you got it" values={values} errors={errors} placeholder="Goodwill" />
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
              <span className="text-sm font-medium">Status</span>
              <p className="text-muted">{lockedStatusLabel}. Editing details here won&apos;t change the sale.</p>
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

          <Chips
            name="listedOn"
            label="Listed on"
            options={[
              { value: "", label: "Not yet" },
              ...LISTED_ON.map((p) => ({ value: p, label: LISTED_ON_LABELS[p] })),
            ]}
            defaultValue={values.listedOn ?? ""}
            error={errors.listedOn}
          />

          <Field label="List price" htmlFor="listPrice" error={errors.listPrice} className="w-1/2">
            <MoneyInput id="listPrice" name="listPrice" cents={values.listPrice} invalid={!!errors.listPrice} />
          </Field>
        </div>
      </details>
    </>
  );
}

function TextField({
  name,
  label,
  values,
  errors,
  placeholder,
}: {
  name: "brand" | "size" | "color" | "source";
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

function MoneyInput({ id, name, cents, invalid }: { id: string; name: string; cents?: number | null; invalid: boolean }) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
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
        className={`${inputClass} pl-7`}
      />
    </div>
  );
}

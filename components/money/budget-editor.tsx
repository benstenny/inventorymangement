"use client";

import { useActionState, useState } from "react";
import { updateBudgetsAction, type BudgetFormState } from "@/app/(app)/summary/actions";
import { ChevronRightIcon } from "@/components/icons";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { secondaryButtonClass } from "@/components/ui/styles";
import { centsToInput, formatCents, parseMoneyToCents } from "@/lib/money";

/**
 * "Change budgets": how much she plans to spend each month on stock and on upkeep.
 * Covers both a bigger or smaller budget and a different split; the total updates as she types.
 */
export function BudgetEditor({ inventory, upkeep }: { inventory: number; upkeep: number }) {
  const [state, formAction, pending] = useActionState<BudgetFormState, FormData>(updateBudgetsAction, {});
  const [stockText, setStockText] = useState(centsToInput(inventory));
  const [upkeepText, setUpkeepText] = useState(centsToInput(upkeep));
  const total = (parseMoneyToCents(stockText) ?? 0) + (parseMoneyToCents(upkeepText) ?? 0);

  return (
    <details className="group mt-4">
      <summary className="flex min-h-touch cursor-pointer list-none items-center gap-1 font-semibold text-ink-lilac [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon size={18} className="transition-transform duration-200 ease-out-expo group-open:rotate-90" />
        Change budgets
      </summary>
      <form action={formAction} className="mt-2 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock / month" htmlFor="inventoryBudget">
            <MoneyInput id="inventoryBudget" name="inventoryBudget" invalid={false} value={stockText} onValueChange={setStockText} />
          </Field>
          <Field label="Upkeep / month" htmlFor="upkeepBudget">
            <MoneyInput id="upkeepBudget" name="upkeepBudget" invalid={false} value={upkeepText} onValueChange={setUpkeepText} />
          </Field>
        </div>
        <p className="tabular text-[15px] text-muted">
          Total <span className="font-semibold text-text">{formatCents(total, { whole: true })}</span> a month
        </p>
        <button type="submit" disabled={pending} className={`${secondaryButtonClass} w-full sm:w-auto`}>
          {pending ? "Saving…" : "Save budgets"}
        </button>
        {state.error && (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {state.error}
          </p>
        )}
        {state.saved && !pending && (
          <p role="status" className="text-[13px] font-semibold text-success">
            Budgets saved.
          </p>
        )}
      </form>
    </details>
  );
}

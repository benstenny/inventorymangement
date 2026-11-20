"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addExpense, deleteExpense, updateBudgets } from "@/lib/money-data";
import {
  EXPENSE_FORM_FIELDS,
  budgetFormSchema,
  monthOf,
  parseExpenseForm,
  type ExpenseFieldErrors,
} from "@/lib/money-report";

export type ExpenseFormState = { errors?: ExpenseFieldErrors; formError?: string };

/** "Add expense": validates again on the server, saves, then shows that month's report. */
export async function addExpenseAction(_prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const parsed = parseExpenseForm(Object.fromEntries(EXPENSE_FORM_FIELDS.map((f) => [f, String(formData.get(f) ?? "")])));
  if (!parsed.ok) return { errors: parsed.errors };
  try {
    await addExpense(parsed.values);
  } catch (err) {
    console.error(err);
    return { formError: "Couldn't save. Check your internet connection and try again." };
  }
  redirect(`/summary?month=${monthOf(parsed.values.spentOn)}`);
}

export async function deleteExpenseAction(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  await deleteExpense(id.data);
  refresh();
}

export type BudgetFormState = { error?: string; saved?: boolean };

/** "Change budgets": how much she plans to spend each month on stock and on upkeep. */
export async function updateBudgetsAction(_prev: BudgetFormState, formData: FormData): Promise<BudgetFormState> {
  const parsed = budgetFormSchema.safeParse({
    inventoryBudget: String(formData.get("inventoryBudget") ?? ""),
    upkeepBudget: String(formData.get("upkeepBudget") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter amounts like 130." };
  try {
    await updateBudgets(parsed.data);
  } catch (err) {
    console.error(err);
    return { error: "Couldn't save. Check your internet connection and try again." };
  }
  refresh();
  return { saved: true };
}

"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addExpense, deleteExpense } from "@/lib/money-data";
import {
  EXPENSE_FORM_FIELDS,
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

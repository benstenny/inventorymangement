import type { Metadata } from "next";
import { ExpenseForm } from "@/components/money/expense-form";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Add expense" };

export default function NewExpensePage() {
  return (
    <div className="mx-auto w-full max-w-page">
      <PageHeader title="add expense" back={{ href: "/summary", label: "Money" }} />
      <ExpenseForm />
    </div>
  );
}

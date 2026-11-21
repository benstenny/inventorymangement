import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { ListSkeleton } from "@/components/inventory/list-skeleton";
import { AiSummary } from "@/components/money/ai-summary";
import { BudgetMeters, ExpenseList, MonthNav, ProfitCard, SoldList } from "@/components/money/report";
import { PageHeader } from "@/components/page-header";
import { groupClass, secondaryButtonClass } from "@/components/ui/styles";
import { todayIso } from "@/lib/dates";
import { getMonthReport } from "@/lib/money-data";
import { isMonth, monthOf } from "@/lib/money-report";

export const metadata: Metadata = { title: "Money" };

const sectionHeading = "mb-2.5 px-1 text-[20px] font-bold";

export default function SummaryPage({ searchParams }: PageProps<"/summary">) {
  return (
    <div className="mx-auto w-full max-w-page">
      <PageHeader title="money" />
      <Suspense fallback={<ListSkeleton />}>
        <Report searchParams={searchParams} />
      </Suspense>

      <section aria-labelledby="backup-heading" className="mt-10">
        <h2 id="backup-heading" className={sectionHeading}>
          Backup
        </h2>
        <div className={`${groupClass} p-4`}>
          <p className="text-[15px] text-muted">
            Download both once a month and keep them somewhere safe. They open in Google Sheets, Numbers or Excel.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a href="/api/export/items" download className={secondaryButtonClass}>
              Items CSV
            </a>
            <a href="/api/export/expenses" download className={secondaryButtonClass}>
              Expenses CSV
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

async function Report({ searchParams }: { searchParams: PageProps<"/summary">["searchParams"] }) {
  // Her money and the Supabase session are per request: never prerender this part.
  await connection();
  const params = await searchParams;
  const current = monthOf(todayIso());
  const month = isMonth(params.month) && params.month <= current ? params.month : current;
  const report = await getMonthReport(month);

  return (
    <>
      <MonthNav month={month} current={current} />
      <ProfitCard report={report} />

      <section aria-labelledby="summary-heading" className="mt-8">
        <h2 id="summary-heading" className={sectionHeading}>
          Summary
        </h2>
        <AiSummary key={month} month={month} />
      </section>

      <section aria-labelledby="budgets-heading" className="mt-8">
        <h2 id="budgets-heading" className={sectionHeading}>
          Budgets
        </h2>
        <div className={`${groupClass} p-4`}>
          <BudgetMeters stock={report.budgets.stock} upkeep={report.budgets.upkeep} />
          <Link
            href="/settings#budgets"
            className="mt-3 flex min-h-touch w-fit items-center gap-1 font-semibold text-ink-lilac"
          >
            Change budgets
            <ChevronRightIcon size={18} />
          </Link>
        </div>
      </section>

      <section aria-labelledby="sold-heading" className="mt-8">
        <h2 id="sold-heading" className={sectionHeading}>
          Sold
        </h2>
        <SoldList items={report.items} />
      </section>

      <section aria-labelledby="expenses-heading" className="mt-8">
        <div className="mb-2.5 flex items-center justify-between gap-3 px-1">
          <h2 id="expenses-heading" className="text-[20px] font-bold">
            Expenses
          </h2>
          <Link href="/summary/expenses/new" className={`${secondaryButtonClass} gap-1.5`}>
            <PlusIcon size={18} />
            Add expense
          </Link>
        </div>
        <ExpenseList rows={report.expenseRows} />
      </section>
    </>
  );
}

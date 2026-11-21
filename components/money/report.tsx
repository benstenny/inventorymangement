import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { groupClass } from "@/components/ui/styles";
import { EXPENSE_KIND_LABELS, PLATFORM_LABELS } from "@/lib/items/options";
import { formatCents } from "@/lib/money";
import { monthLabel, shiftMonth, type Budget, type Month, type MonthReport } from "@/lib/money-report";
import { DeleteExpenseButton } from "./delete-expense-button";

const dayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const formatDay = (iso: string) => dayFormatter.format(new Date(`${iso}T00:00:00Z`));

/** ‹ November 2026 › : steps a month back or forward. */
export function MonthNav({ month, current }: { month: Month; current: Month }) {
  const next = shiftMonth(month, 1);
  const linkClass = "flex size-touch items-center justify-center rounded-pill text-ink-lilac hover:bg-surface";
  return (
    <nav aria-label="Month" className="-mx-2 mb-4 flex items-center justify-between">
      <Link href={`/summary?month=${shiftMonth(month, -1)}`} className={linkClass} aria-label="Previous month">
        <ChevronLeftIcon size={24} />
      </Link>
      <h2 className="text-[20px] font-bold">{monthLabel(month)}</h2>
      {month < current ? (
        <Link href={`/summary?month=${next}`} className={linkClass} aria-label="Next month">
          <ChevronRightIcon size={24} />
        </Link>
      ) : (
        <span className="size-touch" aria-hidden />
      )}
    </nav>
  );
}

/** The month's profit, with the sum spelled out underneath. */
export function ProfitCard({ report }: { report: MonthReport }) {
  const rows: [string, number][] = [
    ["Paid for those items", report.itemCosts],
    ["Fees", report.fees],
    ["Shipping", report.shipping],
    ["Expenses", report.expenses],
  ];
  return (
    <section aria-labelledby="profit-heading" className={`${groupClass} px-4 py-4`}>
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="profit-heading" className="text-[17px] font-semibold">
          Profit
        </h3>
        <p className={`tabular text-[34px] leading-none font-extrabold ${report.profit < 0 ? "text-danger" : "text-ink-violet"}`}>
          {formatCents(report.profit)}
        </p>
      </div>
      <dl className="tabular mt-4 flex flex-col gap-1.5 border-t border-hairline pt-3 text-[15px]">
        <div className="flex justify-between gap-3">
          <dt>
            Sales{" "}
            <span className="text-muted">({report.soldCount === 1 ? "1 item" : `${report.soldCount} items`})</span>
          </dt>
          <dd className="font-semibold">{formatCents(report.sales)}</dd>
        </div>
        {rows.map(([label, cents]) => (
          <div key={label} className="flex justify-between gap-3 text-muted">
            <dt>{label}</dt>
            <dd>{cents === 0 ? formatCents(0) : `−${formatCents(cents)}`}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const METER_FILL: Record<Budget["state"], string> = { ok: "bg-accent", near: "bg-warning", over: "bg-danger" };

/**
 * Spend against each monthly budget: a meter list. Name, figures and what's left in words
 * (so color is never the only signal); the fill turns orange from 90% and red when over.
 */
export function BudgetMeters({ stock, upkeep }: { stock: Budget; upkeep: Budget }) {
  return (
    <ul className="flex flex-col gap-4">
      <Meter name="Stock" hint="What you paid for finds this month" budget={stock} />
      <Meter name="Upkeep" hint="Supplies, laundromat and other expenses" budget={upkeep} />
    </ul>
  );
}

function Meter({ name, hint, budget }: { name: string; hint: string; budget: Budget }) {
  const width = Math.min(1, Number.isFinite(budget.share) ? budget.share : 1) * 100;
  const status =
    budget.state === "over" ? `Over by ${formatCents(-budget.left, { whole: true })}` : `${formatCents(budget.left, { whole: true })} left`;
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[17px] font-semibold">{name}</p>
        <p className="tabular text-[15px]">
          <span className="font-semibold">{formatCents(budget.spent, { whole: true })}</span>
          <span className="text-muted"> of {formatCents(budget.budget, { whole: true })}</span>
        </p>
      </div>
      <div
        role="meter"
        aria-label={`${name} budget`}
        aria-valuemin={0}
        aria-valuemax={budget.budget}
        aria-valuenow={budget.spent}
        aria-valuetext={`${formatCents(budget.spent)} of ${formatCents(budget.budget)}, ${status}`}
        className="mt-1.5 h-2 overflow-hidden rounded-pill bg-hairline"
      >
        <div className={`h-full rounded-pill ${METER_FILL[budget.state]}`} style={{ width: `${width}%` }} />
      </div>
      <div className="mt-1 flex justify-between gap-3 text-[13px]">
        <span className="text-muted">{hint}</span>
        <span
          className={`tabular shrink-0 ${budget.state === "over" ? "font-semibold text-danger" : budget.state === "near" ? "font-semibold text-warning" : "text-muted"}`}
        >
          {status}
        </span>
      </div>
    </li>
  );
}

/** What sold this month, newest first, each with its own profit. */
export function SoldList({ items }: { items: MonthReport["items"] }) {
  if (items.length === 0) {
    return <p className="px-1 text-[15px] text-muted">Nothing sold this month yet. Sales show up here with their profit.</p>;
  }
  return (
    <ul className={`${groupClass} divide-y divide-hairline px-4`}>
      {items.map((item) => (
        <li key={item.id} className="relative flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <Link
              href={`/items/${item.id}`}
              className="line-clamp-2 text-[17px] leading-snug font-semibold after:absolute after:inset-0 after:content-['']"
            >
              {item.title}
            </Link>
            <p className="mt-0.5 text-[13px] text-muted">
              {formatDay(item.soldDate)}
              {item.soldPlatform && <> · {PLATFORM_LABELS[item.soldPlatform]}</>} · sold{" "}
              {formatCents(item.soldPrice, { whole: true })}
            </p>
          </div>
          <div className="tabular shrink-0 text-right">
            <p className={`text-[17px] font-extrabold ${item.profit < 0 ? "text-danger" : "text-ink-violet"}`}>
              {formatCents(item.profit)}
            </p>
            <p className="text-[13px] text-muted">profit</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** This month's expenses, newest first, each removable. */
export function ExpenseList({ rows }: { rows: MonthReport["expenseRows"] }) {
  if (rows.length === 0) {
    return <p className="px-1 text-[15px] text-muted">No expenses this month. Add mailers, tape or a laundromat trip as you go.</p>;
  }
  return (
    <ul className={`${groupClass} divide-y divide-hairline px-4`}>
      {rows.map((e) => (
        <li key={e.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-semibold">{e.note ?? EXPENSE_KIND_LABELS[e.kind]}</p>
            <p className="text-[13px] text-muted">
              {formatDay(e.spentOn)} · {EXPENSE_KIND_LABELS[e.kind]}
            </p>
          </div>
          <p className="tabular shrink-0 text-[17px] font-semibold">{formatCents(e.amount)}</p>
          <DeleteExpenseButton id={e.id} label={e.note ?? EXPENSE_KIND_LABELS[e.kind]} />
        </li>
      ))}
    </ul>
  );
}

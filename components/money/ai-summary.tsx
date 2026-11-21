"use client";

import { useState, useTransition } from "react";
import { aiSummaryAction } from "@/app/(app)/summary/ai-summary-action";
import { ChromeSparkle } from "@/components/art/art";
import { groupClass, secondaryButtonClass } from "@/components/ui/styles";
import { monthLabel, type Month } from "@/lib/money-report";

/**
 * The AI monthly summary: a short, friendly note about the month written from her real numbers.
 * On demand (each one counts toward the daily AI cap), shown as written, never stored.
 */
export function AiSummary({ month }: { month: Month }) {
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function write() {
    setError(null);
    startTransition(async () => {
      const result = await aiSummaryAction(month);
      if (result.ok) setText(result.text);
      else {
        setText(null);
        setError(result.error);
      }
    });
  }

  return (
    <div className={`${groupClass} flex flex-col gap-3 p-4`}>
      {text && !pending ? (
        <>
          <p className="text-[17px] leading-relaxed whitespace-pre-line">{text}</p>
          <p className="text-[13px] text-muted">Written by AI from your {monthLabel(month)} numbers. Double-check before acting on it.</p>
        </>
      ) : (
        <p className="text-[15px] text-muted">
          A short note on what made money, what&apos;s sitting, and one thing to try next month.
        </p>
      )}
      <button type="button" onClick={write} disabled={pending} className={`${secondaryButtonClass} w-full gap-2 sm:w-auto`}>
        <ChromeSparkle size={16} />
        {pending ? "Writing…" : text ? "Write it again" : "Write this month's summary"}
      </button>
      {error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

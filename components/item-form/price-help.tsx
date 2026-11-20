"use client";

import { useRef, useState, useTransition } from "react";
import { priceHelpAction } from "@/app/(app)/items/price-help-action";
import { SearchIcon } from "@/components/icons";
import { groupClass, secondaryButtonClass } from "@/components/ui/styles";
import type { GroundedAnswer } from "@/lib/ai/interaction";
import { parseMoneyToCents } from "@/lib/money";

type Category = { id: string; name: string };

/**
 * "Help me price this": asks Gemini, with Google Search, what comparable items sell for.
 * Reads what she's typed in the form so far (saved or not). The answer is shown exactly as
 * returned, with its sources and Google's Search Suggestions, and is never stored: those are
 * the terms for Grounding with Google Search.
 */
export function PriceHelp({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);

  function ask(button: HTMLButtonElement) {
    const form = button.form;
    if (!form) return;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");
    const costText = value("sourceCost").trim();
    const input = {
      title: value("title"),
      category: categories.find((c) => c.id === value("categoryId"))?.name ?? "",
      brand: value("brand"),
      size: value("size"),
      color: value("color"),
      condition: value("condition"),
      flaws: value("flaws"),
      cost: costText ? parseMoneyToCents(costText) : null,
    };
    setError(null);
    startTransition(async () => {
      const result = await priceHelpAction(input);
      if (result.ok) setAnswer(result.answer);
      else {
        setAnswer(null);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={(e) => ask(e.currentTarget)}
        className={`${secondaryButtonClass} w-full gap-2 sm:w-auto`}
      >
        <SearchIcon size={18} />
        {pending ? "Looking up similar listings…" : answer ? "Check again" : "Help me price this"}
      </button>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {error}
          </p>
        )}
        {answer && !pending && <GroundedResult answer={answer} />}
      </div>
    </div>
  );
}

function GroundedResult({ answer }: { answer: GroundedAnswer }) {
  return (
    <section aria-label="Price check" className={`${groupClass} p-4`}>
      <p className="mb-2 text-[13px] text-muted">From Google Search. A guide, not a promise: tap a source to check.</p>
      {/* Gemini's answer, verbatim. */}
      <p className="text-[15px] leading-relaxed whitespace-pre-line">{answer.text}</p>

      {answer.citations.length > 0 && (
        <>
          <h3 className="mt-3 text-[13px] font-semibold text-muted">Sources</h3>
          <ul className="mt-1 flex flex-col">
            {answer.citations.map((c) => (
              <li key={c.url}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-touch items-center text-[15px] font-semibold break-all text-ink-lilac underline"
                >
                  {c.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      {answer.searchSuggestionsHtml && <SearchSuggestions html={answer.searchSuggestionsHtml} />}
    </section>
  );
}

/**
 * Google's Search Suggestions widget, unmodified, in a sandboxed frame: no scripts run, links
 * open in a new tab (the <base> only sets where they open), and the frame grows to fit.
 */
function SearchSuggestions({ html }: { html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(64);
  return (
    <iframe
      ref={frameRef}
      title="Google Search suggestions"
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={`<!doctype html><html><head><base target="_blank"><meta name="color-scheme" content="light dark"></head><body style="margin:0">${html}</body></html>`}
      onLoad={() => {
        const doc = frameRef.current?.contentDocument;
        if (doc) setHeight(Math.max(40, doc.documentElement.scrollHeight));
      }}
      style={{ height }}
      className="mt-3 w-full border-0"
    />
  );
}

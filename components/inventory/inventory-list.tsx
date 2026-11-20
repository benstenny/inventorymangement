"use client";

import { useDeferredValue, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { SearchIcon } from "@/components/icons";
import { groupClass, inputClass } from "@/components/ui/styles";
import { FILTERS, filterCounts, filterItems, filterLabels, type Filter, type ListItem } from "@/lib/items/list";
import { ItemRow } from "./item-row";

type Props = {
  items: ListItem[];
  staleDays: number;
  initialFilter: Filter;
  initialQuery: string;
};

const EMPTY_FILTER: Record<Exclude<Filter, "all">, { message: string; hint: string }> = {
  "needs-photos": {
    message: "Everything has its photos.",
    hint: "New finds show up here until they have a front, back and styled photo.",
  },
  listed: {
    message: "Nothing is listed yet.",
    hint: "Tap “Mark listed” on a find once it’s up on Depop, Instagram or at a market.",
  },
  unsold: {
    message: "Nothing has been sitting too long.",
    hint: "Listed finds show up here when they haven’t sold for a while, so you can lower the price.",
  },
};

/** Search, filter chips and the photo-first list. Filtering happens right here, so it's instant. */
export function InventoryList({ items, staleDays, initialFilter, initialQuery }: Props) {
  const [filter, setFilter] = useState(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);

  const shown = filterItems(items, filter, deferredQuery);
  const counts = filterCounts(items, deferredQuery);
  const labels = filterLabels(staleDays);

  // Keep the search and filter in the address, so coming back from an item lands in the same place.
  function syncUrl(next: { filter: Filter; query: string }) {
    const params = new URLSearchParams();
    if (next.query.trim()) params.set("q", next.query.trim());
    if (next.filter !== "all") params.set("show", next.filter);
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        message="Nothing in your bins yet."
        hint="Add your first find. You can take its photos now or later."
        action={{ href: "/items/new", label: "Add item" }}
      />
    );
  }

  return (
    <>
      <search className="relative">
        <SearchIcon size={20} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <label htmlFor="inventory-search" className="sr-only">
          Search your items
        </label>
        <input
          id="inventory-search"
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            syncUrl({ filter, query: e.target.value });
          }}
          placeholder="Search title, brand, SKU or bin"
          autoComplete="off"
          enterKeyHint="search"
          className={`${inputClass} pl-10`}
        />
      </search>

      <div
        role="group"
        aria-label="Show"
        className="-mx-gutter mt-3 flex gap-2 overflow-x-auto px-gutter pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => {
              setFilter(f);
              syncUrl({ filter: f, query });
            }}
            className="flex min-h-touch shrink-0 items-center gap-1.5 rounded-pill bg-surface-muted px-4 text-[15px] font-semibold whitespace-nowrap text-text transition-[transform,background-color] duration-150 ease-out-expo active:scale-95 aria-pressed:bg-text aria-pressed:text-bg"
          >
            {labels[f]}
            <span className="tabular font-normal opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      <p role="status" className="sr-only">
        {shown.length === 1 ? "1 item" : `${shown.length} items`}
      </p>
      <div className="mt-4">
        {shown.length > 0 ? (
          <ul
            aria-label="Your items"
            className={`${groupClass} divide-y divide-hairline px-4 lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:bg-transparent lg:px-0 lg:shadow-none lg:ring-0`}
          >
            {shown.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        ) : deferredQuery.trim() ? (
          <div className="flex flex-col items-center px-6 pt-10 text-center">
            <p className="text-lg font-semibold text-balance">Nothing matches “{deferredQuery.trim()}”.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                syncUrl({ filter, query: "" });
              }}
              className="mt-3 min-h-touch px-4 font-semibold text-ink-lilac"
            >
              Clear search
            </button>
          </div>
        ) : (
          filter !== "all" && <EmptyState {...EMPTY_FILTER[filter]} />
        )}
      </div>
    </>
  );
}

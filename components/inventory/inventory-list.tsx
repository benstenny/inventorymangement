"use client";

import { useDeferredValue, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { SearchIcon } from "@/components/icons";
import { chipClass, chipSelectedPressed, groupClass, inputClass } from "@/components/ui/styles";
import {
  FILTERS,
  SECTION_LABELS,
  filterCounts,
  filterItems,
  filterLabels,
  groupBySection,
  stockSummary,
  type Filter,
  type ListItem,
} from "@/lib/items/list";
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
  shipped: {
    message: "Nothing shipped yet.",
    hint: "Items move here once you mark them shipped in Pack, or sell them at a market.",
  },
  unsold: {
    message: "Nothing has been sitting too long.",
    hint: "Listed finds show up here when they haven’t sold for a while, so you can lower the price.",
  },
};

/**
 * The day at a glance, search, filter chips and the photo-first list. Under "All" the list is
 * grouped by what to do next (to ship, to prep, listed, shipped). Filtering happens right here,
 * so it's instant.
 */
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

  const summary = stockSummary(items);

  return (
    <>
      {summary && <p className="-mt-2 mb-4 text-[15px] font-semibold text-muted tabular">{summary}</p>}

      <search className="relative">
        <SearchIcon size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-pink" />
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
          className={`${inputClass} pl-11`}
        />
      </search>

      <div
        role="group"
        aria-label="Show"
        className="mt-3 flex flex-wrap gap-2"
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
            className={`${chipClass} ${chipSelectedPressed}`}
          >
            {labels[f]}
            <span className="tabular font-normal opacity-70">{counts[f]}</span>
          </button>
        ))}
      </div>

      <p role="status" className="sr-only">
        {shown.length === 1 ? "1 item" : `${shown.length} items`}
      </p>
      <div className="mt-5">
        {shown.length > 0 && filter === "all" ? (
          <div className="flex flex-col gap-7">
            {groupBySection(shown).map(({ section, items: sectionItems }) => (
              <section key={section} aria-labelledby={`section-${section}`}>
                <h2 id={`section-${section}`} className="mb-2.5 flex items-baseline gap-2 px-1 text-[20px] font-bold">
                  {SECTION_LABELS[section]}
                  <span className="tabular text-[15px] font-semibold text-muted">{sectionItems.length}</span>
                </h2>
                <ItemList items={sectionItems} label={SECTION_LABELS[section]} />
              </section>
            ))}
          </div>
        ) : shown.length > 0 ? (
          <ItemList items={shown} label="Your items" />
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
          (filter === "all" ? (
            <EmptyState
              message="Everything you've sold is shipped."
              hint="Add your next find. Shipped items are under the “Shipped” filter."
              action={{ href: "/items/new", label: "Add item" }}
            />
          ) : (
            <EmptyState {...EMPTY_FILTER[filter]} />
          ))
        )}
      </div>
    </>
  );
}

function ItemList({ items, label }: { items: ListItem[]; label: string }) {
  return (
    <ul
      aria-label={label}
      className={`${groupClass} divide-y divide-hairline px-4 lg:grid lg:grid-cols-2 lg:gap-3 lg:divide-y-0 lg:bg-transparent lg:px-0 lg:shadow-none lg:ring-0`}
    >
      {items.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { CameraIcon, GelCircle, GelTick } from "@/components/icons";
import { formatCents } from "@/lib/money";
import type { ListItem } from "@/lib/items/list";
import { PLATFORM_LABELS, STATUS_LABELS } from "@/lib/items/options";
import { PREP_STEPS } from "@/lib/items/prep";
import { QuickStepButton } from "./quick-step-button";

/**
 * One find in the list: the front photo leads, then title, SKU and bin, price
 * over what she paid, the prep ticks and the next thing to do.
 * The whole row opens the item; the step button sits above that link.
 */
export function ItemRow({ item }: { item: ListItem }) {
  const sold = item.status === "SOLD" || item.status === "SHIPPED";
  // Ticks that become done while she's looking draw themselves on.
  const [doneAtFirst] = useState(item.prep);

  return (
    <li className="relative flex gap-3 py-3 lg:rounded-card lg:bg-surface lg:p-3 lg:shadow-card lg:ring-1 lg:ring-hairline">
      <Photo url={item.photoUrl} sold={sold} soldLabel={STATUS_LABELS[item.status]} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/items/${item.id}`}
            className="line-clamp-2 text-[17px] leading-snug font-semibold after:absolute after:inset-0 after:content-['']"
          >
            {item.title}
          </Link>
          <Price item={item} sold={sold} />
        </div>

        <div className="mt-0.5 flex items-baseline justify-between gap-3 text-[13px] text-muted">
          <span className="truncate">
            <span className="tabular font-mono">{item.sku}</span>
            {item.storageLocation && <> · {item.storageLocation}</>}
          </span>
          <span className="tabular shrink-0">paid {formatCents(item.cost, { whole: true })}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          {sold ? (
            <p className="pb-0.5 text-[13px] text-muted">
              {item.status === "SOLD" ? "Sold. Waiting to ship." : "Shipped."}
            </p>
          ) : item.stale ? (
            <p className="pb-0.5 text-[13px] font-medium text-warning">
              Listed {item.daysListed} days. Try a lower price.
            </p>
          ) : (
            <PrepTicks done={item.prep} doneAtFirst={doneAtFirst} listedOn={item.listedOn} />
          )}
          {item.next && <QuickStepButton key={item.next.label} id={item.id} action={item.next} />}
        </div>
      </div>
    </li>
  );
}

function Photo({ url, sold, soldLabel }: { url: string | null; sold: boolean; soldLabel: string }) {
  return (
    <div className="relative w-[72px] shrink-0 self-start">
      {url ? (
        // Signed Supabase links change every hour, so next/image's cache wouldn't help here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[4/5] w-full rounded-control bg-surface-muted object-cover"
        />
      ) : (
        <div className="flex aspect-[4/5] w-full items-center justify-center rounded-control border-2 border-dashed border-ink-lilac-glow/60 bg-surface-muted text-ink-lilac">
          <CameraIcon size={22} />
          <span className="sr-only">No photo yet</span>
        </div>
      )}
      {sold && (
        <span className="holo absolute -top-1.5 -left-1.5 -rotate-6 rounded-[8px] px-1.5 py-0.5 text-[11px] font-extrabold tracking-wide uppercase">
          {soldLabel}
        </span>
      )}
    </div>
  );
}

function Price({ item, sold }: { item: ListItem; sold: boolean }) {
  const cents = sold ? (item.soldPrice ?? item.listPrice) : item.listPrice;
  if (cents === null) return <span className="shrink-0 pt-0.5 text-[13px] text-muted">No price</span>;
  return (
    <span className="tabular shrink-0 text-right text-[17px] leading-snug font-extrabold text-ink-pink">
      {sold && <span className="sr-only">Sold for </span>}
      {formatCents(cents, { whole: true })}
    </span>
  );
}

/** Washed · Measured · Photographed · Listed as four gel marks. Listed items say where instead. */
function PrepTicks({
  done,
  doneAtFirst,
  listedOn,
}: {
  done: ListItem["prep"];
  doneAtFirst: ListItem["prep"];
  listedOn: ListItem["listedOn"];
}) {
  const allDone = PREP_STEPS.every(({ step }) => done[step]);
  if (allDone && listedOn.length) {
    return (
      <p className="flex items-center gap-1 pb-0.5 text-[13px] text-muted">
        <GelTick size={16} className="text-ink-aqua" draw={!doneAtFirst.listed} />
        On {listedOn.map((p) => PLATFORM_LABELS[p]).join(", ")}
      </p>
    );
  }
  return (
    <ul aria-label="Prep checklist" className="flex items-center gap-1 pb-1">
      {PREP_STEPS.map(({ step, label }) => (
        <li key={step} title={label} className={done[step] ? "text-ink-aqua" : "text-muted"}>
          {done[step] ? (
            <GelTick size={18} draw={!doneAtFirst[step]} />
          ) : (
            <GelCircle size={16} className="m-px opacity-70" />
          )}
          <span className="sr-only">
            {label} {done[step] ? "(done)" : "(to do)"}
          </span>
        </li>
      ))}
    </ul>
  );
}

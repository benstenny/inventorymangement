"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { markShippedAction, type MarkShippedState } from "@/app/(app)/items/actions";
import { CameraIcon, GelTick } from "@/components/icons";
import { groupClass, primaryButtonClass, secondaryButtonClass } from "@/components/ui/styles";
import type { PackItem } from "@/lib/items/data";
import { PLATFORM_LABELS } from "@/lib/items/options";
import { shipUrgency } from "@/lib/items/shipping";
import { formatCents } from "@/lib/money";
import { uploadItemPhoto } from "@/lib/photo-upload";

type Proof =
  | { kind: "none" }
  | { kind: "uploading"; previewUrl: string }
  | { kind: "ready"; path: string; previewUrl: string }
  | { kind: "failed"; message: string };

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const noSubscribe = () => () => {};

/** Her date, read in the browser (the server only knows UTC). Null while the page first renders. */
function useToday() {
  return useSyncExternalStore(noSubscribe, localToday, () => null);
}

const shipByFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const formatShipBy = (iso: string) => shipByFormatter.format(new Date(`${iso}T00:00:00Z`));

const URGENCY_CLASS = { ok: "text-muted", soon: "font-semibold text-warning", late: "font-semibold text-danger" } as const;

/**
 * One sold item to pack: what it is and which bin it's in, the ship-by date, the buyer's note,
 * then the proof photo (taken before sealing) and "Mark shipped", which unlocks once the photo
 * has uploaded.
 */
export function PackCard({ item, primary }: { item: PackItem; primary: boolean }) {
  const [state, formAction, pending] = useActionState<MarkShippedState, FormData>(markShippedAction, {});
  const [proof, setProof] = useState<Proof>({ kind: "none" });
  const inputRef = useRef<HTMLInputElement>(null);
  const today = useToday();
  const inputId = `proof-${item.id}`;

  // Free local preview URLs when they're replaced.
  useEffect(() => {
    const url = "previewUrl" in proof ? proof.previewUrl : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [proof]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setProof({ kind: "uploading", previewUrl: URL.createObjectURL(file) });
    try {
      const { path } = await uploadItemPhoto(file);
      setProof({ kind: "ready", path, previewUrl: URL.createObjectURL(file) });
    } catch (err) {
      setProof({ kind: "failed", message: err instanceof Error ? err.message : "The photo didn't upload." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const urgency = item.shipBy && today ? shipUrgency(item.shipBy, today) : null;

  if (state.shipped) {
    return (
      <li role="status" className={`${groupClass} flex items-center gap-2 px-4 py-4 text-[17px] font-semibold`}>
        <GelTick draw className="text-ink-aqua" size={22} />
        {item.title} is shipped.
      </li>
    );
  }

  return (
    <li className={`${groupClass} p-4`}>
      <div className="flex gap-3.5">
        {item.photoUrl ? (
          // Signed Supabase links change every hour, so next/image's cache wouldn't help here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.photoUrl}
            alt=""
            className="aspect-[4/5] w-20 shrink-0 self-start rounded-control bg-surface-muted object-cover"
          />
        ) : (
          <div aria-hidden className="aspect-[4/5] w-20 shrink-0 self-start rounded-control bg-surface-muted" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 text-[17px] leading-snug font-semibold">{item.title}</h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-lilac">
            <span className="tabular font-mono">{item.sku}</span>
            {item.storageLocation && <> · {item.storageLocation}</>}
          </p>
          <p className="tabular mt-0.5 text-[13px] text-muted">
            {item.soldPlatform ? PLATFORM_LABELS[item.soldPlatform] : "Sold"}
            {item.soldPrice !== null && <> · sold {formatCents(item.soldPrice, { whole: true })}</>}
          </p>
          {item.shipBy && (
            <p className="mt-2 text-[15px]">
              <span className="font-semibold">Ship by {formatShipBy(item.shipBy)}</span>
              {urgency && <span className={URGENCY_CLASS[urgency.tone]}> · {urgency.label}</span>}
            </p>
          )}
        </div>
      </div>

      {item.buyerNotes && (
        <p className="mt-3 rounded-control bg-surface-muted px-3 py-2 text-[15px]">“{item.buyerNotes}”</p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {proof.kind === "none" || proof.kind === "failed" ? (
          <>
            <label htmlFor={inputId} className={`${secondaryButtonClass} cursor-pointer gap-2`}>
              <CameraIcon size={20} />
              Take proof photo
            </label>
            {proof.kind === "failed" ? (
              <p role="alert" className="text-[13px] font-medium text-danger">
                {proof.message}
              </p>
            ) : (
              <p className="text-[13px] text-muted">Photograph it in the package, before you seal it.</p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={proof.previewUrl} alt="Proof photo" className="size-14 shrink-0 rounded-control object-cover" />
            <p className="flex-1 text-[15px] font-semibold">
              {proof.kind === "uploading" ? (
                "Uploading photo…"
              ) : (
                <span className="flex items-center gap-1.5">
                  <GelTick className="text-ink-aqua" size={18} draw />
                  Proof photo saved
                </span>
              )}
            </p>
            {proof.kind === "ready" && (
              <label
                htmlFor={inputId}
                className="flex min-h-touch cursor-pointer items-center px-2 font-semibold text-ink-lilac"
              >
                Retake
              </label>
            )}
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="proofPath" value={proof.kind === "ready" ? proof.path : ""} />
          <input type="hidden" name="shippedDate" value={today ?? ""} />
          <button
            type="submit"
            disabled={proof.kind !== "ready" || pending || !today}
            className={primary ? primaryButtonClass : `${secondaryButtonClass} w-full`}
          >
            {pending ? "Saving…" : "Mark shipped"}
          </button>
        </form>
        {state.error && (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {state.error}
          </p>
        )}
      </div>
    </li>
  );
}

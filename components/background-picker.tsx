"use client";

import type { CSSProperties } from "react";
import { useSyncExternalStore } from "react";
import { groupClass, labelClass } from "@/components/ui/styles";
import {
  BACKGROUND_CHANGE_EVENT,
  BACKGROUND_STORAGE_KEY,
  BACKGROUNDS,
  BACKDROP_ID,
  applyBackground,
  backgroundUrls,
  parseBackground,
  type BackgroundId,
} from "@/lib/backgrounds";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(BACKGROUND_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(BACKGROUND_CHANGE_EVENT, onChange);
  };
}

function readSaved(): BackgroundId | null {
  try {
    return parseBackground(localStorage.getItem(BACKGROUND_STORAGE_KEY));
  } catch {
    return null;
  }
}

function choose(id: BackgroundId | null) {
  try {
    if (id) localStorage.setItem(BACKGROUND_STORAGE_KEY, id);
    else localStorage.removeItem(BACKGROUND_STORAGE_KEY);
  } catch {
    // Private mode can refuse storage; the background still changes for this visit.
  }
  applyBackground(document.getElementById(BACKDROP_ID), id);
  window.dispatchEvent(new Event(BACKGROUND_CHANGE_EVENT));
}

const tileClass =
  "bg-thumb block aspect-[3/4] w-full rounded-card border-2 border-edge bg-bg shadow-card transition-transform duration-150 ease-out-expo active:scale-95 peer-checked:outline-3 peer-checked:outline-offset-2 peer-checked:outline-accent peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

/** Pick the picture behind every screen. Saved on this device only. */
export function BackgroundPicker() {
  const current = useSyncExternalStore(subscribe, readSaved, () => null);

  return (
    <fieldset className={`${groupClass} p-4`}>
      <legend className="sr-only">Background</legend>
      <p aria-hidden className={labelClass}>
        Background
      </p>
      <p className="mt-0.5 mb-3 text-[13px] text-muted">Shows softly behind every screen on this device.</p>

      <div className="grid grid-cols-4 gap-x-2.5 gap-y-3 sm:grid-cols-6">
        <Tile label="Plain" checked={current === null} onSelect={() => choose(null)} />
        {BACKGROUNDS.map(({ id, label }) => {
          const urls = backgroundUrls(id);
          return (
            <Tile
              key={id}
              label={label}
              checked={current === id}
              onSelect={() => choose(id)}
              style={{ "--thumb-light": `url(${urls.light})`, "--thumb-dark": `url(${urls.dark})` } as CSSProperties}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function Tile({
  label,
  checked,
  onSelect,
  style,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
  style?: CSSProperties;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center gap-1.5">
      <input type="radio" name="background" checked={checked} onChange={onSelect} className="peer sr-only" />
      <span className={tileClass} style={style} />
      <span className={`text-center text-[13px] leading-tight ${checked ? "font-semibold text-ink-violet" : "text-muted"}`}>
        {label}
      </span>
    </label>
  );
}

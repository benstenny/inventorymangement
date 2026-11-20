"use client";

import { useEffect, useRef, useState } from "react";
import { uploadItemPhoto } from "@/lib/photo-upload";
import { secondaryButtonClass } from "@/components/ui/styles";

type Props = {
  initialPath: string | null;
  initialUrl: string | null;
  error?: string;
  onUploadingChange: (uploading: boolean) => void;
};

type State =
  | { kind: "empty" }
  | { kind: "uploading"; previewUrl: string }
  | { kind: "ready"; path: string; previewUrl: string }
  | { kind: "failed"; message: string };

/**
 * Big photo area at the top of the form. Picking a photo shrinks it and starts
 * the upload straight away, so saving the item doesn't wait. The phone offers
 * camera or camera roll (no `capture` attribute on purpose).
 */
export function PhotoPicker({ initialPath, initialUrl, error, onUploadingChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>(
    initialPath && initialUrl ? { kind: "ready", path: initialPath, previewUrl: initialUrl } : { kind: "empty" },
  );

  useEffect(() => onUploadingChange(state.kind === "uploading"), [state.kind, onUploadingChange]);

  // Free local preview URLs when they're replaced.
  useEffect(() => {
    const url = "previewUrl" in state ? state.previewUrl : null;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [state]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setState({ kind: "uploading", previewUrl });
    try {
      const { path } = await uploadItemPhoto(file);
      // Fresh object URL: the previous one is revoked by the effect cleanup.
      setState({ kind: "ready", path, previewUrl: URL.createObjectURL(file) });
    } catch (err) {
      setState({ kind: "failed", message: err instanceof Error ? err.message : "The photo didn't upload." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const preview = "previewUrl" in state ? state.previewUrl : null;
  const message = state.kind === "failed" ? state.message : error;

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="photoPath" value={state.kind === "ready" ? state.path : ""} />
      <input
        ref={inputRef}
        id="photo"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-card bg-surface-muted text-muted"
        aria-label={preview ? "Change photo" : "Add photo"}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: and signed URLs, no optimisation needed
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <CameraIcon />
            <span className="font-medium">Add photo</span>
          </span>
        )}
        {state.kind === "uploading" && (
          <span className="absolute inset-x-0 bottom-0 bg-surface py-2 text-center text-sm text-text">
            Uploading photo…
          </span>
        )}
      </button>

      {state.kind === "ready" && (
        <div className="flex gap-2">
          <button type="button" onClick={() => inputRef.current?.click()} className={secondaryButtonClass}>
            Change photo
          </button>
          <button type="button" onClick={() => setState({ kind: "empty" })} className={secondaryButtonClass}>
            Remove
          </button>
        </div>
      )}

      {message && (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

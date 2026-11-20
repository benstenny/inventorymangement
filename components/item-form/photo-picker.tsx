"use client";

import { useEffect, useRef, useState } from "react";
import { uploadItemPhoto } from "@/lib/photo-upload";

type Props = {
  /** Hidden input name that carries the uploaded photo's storage path. */
  name: string;
  /** Shown on the tile: "Front", "Back", "Styled". */
  label: string;
  initialPath: string | null;
  initialUrl: string | null;
  error?: string;
  onUploadingChange: (name: string, uploading: boolean) => void;
};

type State =
  | { kind: "empty" }
  | { kind: "uploading"; previewUrl: string }
  | { kind: "ready"; path: string; previewUrl: string }
  | { kind: "failed"; message: string };

/**
 * One square photo tile. Picking a photo shrinks it and starts the upload
 * straight away, so saving the item doesn't wait. The phone offers camera or
 * camera roll (no `capture` attribute on purpose). Tap a filled tile to retake.
 */
export function PhotoPicker({ name, label, initialPath, initialUrl, error, onUploadingChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>(
    initialPath && initialUrl ? { kind: "ready", path: initialPath, previewUrl: initialUrl } : { kind: "empty" },
  );

  useEffect(() => onUploadingChange(name, state.kind === "uploading"), [name, state.kind, onUploadingChange]);

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
  const inputId = `${name}-file`;

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <input type="hidden" name={name} value={state.kind === "ready" ? state.path : ""} />
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-card bg-surface-muted text-muted"
        aria-label={preview ? `Retake ${label.toLowerCase()} photo` : `Add ${label.toLowerCase()} photo`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: and signed URLs, no optimisation needed
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1">
            <CameraIcon />
            <span className="text-sm font-medium">{label}</span>
          </span>
        )}
        {state.kind === "uploading" && (
          <span className="absolute inset-x-0 bottom-0 bg-surface py-1 text-center text-sm text-text">Uploading…</span>
        )}
        {state.kind === "ready" && (
          <span className="absolute inset-x-0 bottom-0 bg-surface py-1 text-center text-sm text-text">{label}</span>
        )}
      </button>

      {state.kind === "ready" && (
        <button
          type="button"
          onClick={() => setState({ kind: "empty" })}
          className="min-h-touch text-sm text-muted underline"
        >
          Remove
        </button>
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

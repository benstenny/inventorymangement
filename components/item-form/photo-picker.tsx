"use client";

import { useEffect, useRef, useState } from "react";
import { CameraIcon } from "@/components/icons";
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
        className={`relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-card transition-transform duration-150 ease-out-expo active:scale-[0.97] ${
          preview
            ? "bg-surface-muted"
            : "border-2 border-dashed border-ink-lilac-glow/60 bg-surface-muted text-ink-lilac hover:border-ink-lilac-glow"
        }`}
        aria-label={preview ? `Retake ${label.toLowerCase()} photo` : `Add ${label.toLowerCase()} photo`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: and signed URLs, no optimisation needed
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5">
            <CameraIcon size={26} />
            <span className="text-[15px] font-semibold">{label}</span>
          </span>
        )}
        {state.kind === "uploading" && (
          <span className="absolute inset-x-1.5 bottom-1.5 rounded-[8px] bg-bar-glass py-1 text-center text-[13px] font-semibold text-text backdrop-blur-md">
            Uploading…
          </span>
        )}
        {state.kind === "ready" && (
          <span className="absolute bottom-1.5 left-1.5 rounded-[8px] bg-bar-glass px-2 py-0.5 text-[13px] font-semibold text-text backdrop-blur-md">
            {label}
          </span>
        )}
      </button>

      {state.kind === "ready" && (
        <button
          type="button"
          onClick={() => setState({ kind: "empty" })}
          className="min-h-touch text-[15px] font-medium text-muted"
        >
          Remove
        </button>
      )}

      {message && (
        <p className="text-[13px] font-medium text-danger" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

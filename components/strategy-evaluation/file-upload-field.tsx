"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { formatFileSize, type UploadedFileRef } from "@/lib/strategy-evaluation/upload";

/**
 * FileUploadField — cache-then-submit pattern.
 *
 * On file pick, the File is passed back to the parent via `onFileChange`
 * (the parent holds a Map<fieldKey, File> in a ref) and the component
 * emits an UploadedFileRef with a blob: URL via `onChange` so the user
 * can View / Remove / verify immediately without any network round-trip.
 *
 * The parent uploads all cached Files to Firebase Storage only when the
 * form is submitted — abandoned drafts never create orphan uploads.
 */
interface FileUploadFieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly accept?: string;
  readonly value: UploadedFileRef | null;
  readonly onChange: (ref: UploadedFileRef | null) => void;
  readonly onFileChange: (file: File | null) => void;
  /** Server-side upload failure surfaced from the parent's submit handler. */
  readonly errorMessage?: string | null;
}

export function FileUploadField({
  label,
  hint,
  accept,
  value,
  onChange,
  onFileChange,
  errorMessage,
}: FileUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File) => {
    // Revoke any prior blob URL so the browser releases the old File
    if (value?.url.startsWith("blob:")) URL.revokeObjectURL(value.url);
    const blobUrl = URL.createObjectURL(file);
    const ref: UploadedFileRef = {
      path: "pending",
      url: blobUrl,
      filename: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
    };
    onFileChange(file);
    onChange(ref);
  };

  const handleRemove = () => {
    if (value?.url.startsWith("blob:")) URL.revokeObjectURL(value.url);
    onFileChange(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Stale ref = the saved File reference is unusable. Two ways this happens:
  //   1. Draft re-hydrated from localStorage with a dead blob: URL (browser cache cleared).
  //   2. Doc loaded from the server where bytes never reached Storage on submit.
  // Both end up with `path === "stale"`; surface the same re-pick prompt.
  const stale = value?.path === "stale";
  const mockOnly = Boolean(value && !value.url && value.path.startsWith("mock://"));

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value && !stale ? (
        <div className="mt-1 flex items-start justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{value.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.size)}
              {value.contentType && ` · ${value.contentType}`}
              {value.url.startsWith("blob:") && (
                <span className="ml-2 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300">
                  cached: will upload on submit
                </span>
              )}
              {mockOnly && (
                <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  local dev: bytes not stored
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {value.url && (
              <a
                href={value.url}
                target="_blank"
                rel="noopener noreferrer"
                download={value.url.startsWith("blob:") ? value.filename : undefined}
                className="text-xs text-blue-600 underline hover:text-blue-800"
              >
                View / download
              </a>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-muted-foreground underline hover:text-destructive"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <>
          {stale && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-1">
              Attachment &ldquo;{value?.filename}&rdquo; needs to be re-selected — the file did not finish uploading
              before your previous session ended.
            </p>
          )}
          <label className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm transition-colors hover:border-foreground hover:bg-muted/30">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
            />
            <span className="text-muted-foreground">Choose file</span>
          </label>
        </>
      )}

      {errorMessage && (
        <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <p className="font-medium">Upload failed for this file.</p>
          <p className="mt-0.5 font-mono break-words">{errorMessage}</p>
          <p className="mt-1 text-destructive/80">
            Re-select a different file or check the file&rsquo;s format / size (500&nbsp;MB max).
          </p>
        </div>
      )}
    </div>
  );
}

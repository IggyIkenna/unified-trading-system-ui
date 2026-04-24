"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  formatFileSize,
  uploadStrategyEvalFile,
  type UploadedFileRef,
} from "@/lib/strategy-evaluation/upload";

interface FileUploadFieldProps {
  readonly label: string;
  readonly hint?: string;
  readonly submissionId: string;
  readonly fieldKey: string;
  readonly accept?: string;
  readonly value: UploadedFileRef | null;
  readonly onChange: (ref: UploadedFileRef | null) => void;
}

export function FileUploadField({
  label,
  hint,
  submissionId,
  fieldKey,
  accept,
  value,
  onChange,
}: FileUploadFieldProps) {
  const [status, setStatus] = React.useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = React.useState<string>("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    setStatus("uploading");
    setErrorMsg("");
    try {
      const ref = await uploadStrategyEvalFile(file, submissionId, fieldKey);
      onChange(ref);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleRemove = () => {
    onChange(null);
    setStatus("idle");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      {value ? (
        <div className="mt-1 flex items-start justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{value.filename}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(value.size)}
              {value.contentType && ` · ${value.contentType}`}
              {!value.url && (
                <span className="ml-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  mock mode — file not stored
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
                className="text-xs text-blue-600 underline hover:text-blue-800"
              >
                View
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
        <label
          className={`mt-1 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm transition-colors ${
            status === "uploading"
              ? "bg-muted/30 text-muted-foreground cursor-wait"
              : "hover:border-foreground hover:bg-muted/30"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={status === "uploading"}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
            className="hidden"
          />
          <span className="text-muted-foreground">
            {status === "uploading" ? "Uploading…" : "Choose file"}
          </span>
        </label>
      )}

      {status === "error" && (
        <p className="text-xs text-destructive mt-1">Upload failed: {errorMsg}</p>
      )}
    </div>
  );
}

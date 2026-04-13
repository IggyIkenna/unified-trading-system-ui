"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function inferCloudProvider(path: string | null): "gcp" | "aws" | null {
  if (!path) return null;
  if (path.startsWith("s3://")) return "aws";
  if (path.startsWith("gs://")) return "gcp";
  return null;
}

export function getCompletionColor(percent: number): string {
  if (percent >= 100) return "var(--color-accent-green)";
  if (percent >= 80) return "var(--color-accent-cyan)";
  if (percent >= 50) return "var(--color-accent-amber)";
  return "var(--color-accent-red)";
}

export function getCompletionBadgeClass(percent: number): string {
  if (percent >= 100) return "status-success";
  if (percent >= 80) return "status-running";
  if (percent >= 50) return "status-warning";
  return "status-error";
}

export function renderDatesList(
  dates: string[] | undefined,
  tailDates: string[] | undefined,
  truncated: boolean | undefined,
  totalCount: number | undefined,
  colorClass: string,
  label: string,
): ReactNode {
  if (!dates || dates.length === 0) return null;

  const allDates = truncated && tailDates ? [...dates, "...", ...tailDates] : dates;

  return (
    <div className="mt-2">
      <p className={`text-xs font-medium ${colorClass} mb-1`}>
        {label} ({totalCount ?? dates.length}):
      </p>
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
        {allDates.map((date, i) => (
          <span
            key={i}
            className={cn(
              "text-[10px] font-mono px-1.5 py-0.5 rounded",
              date === "..."
                ? "text-[var(--color-text-muted)]"
                : colorClass.includes("green")
                  ? "status-success"
                  : "status-error",
            )}
          >
            {date}
          </span>
        ))}
      </div>
    </div>
  );
}

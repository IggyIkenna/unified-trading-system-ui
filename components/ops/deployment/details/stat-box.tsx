"use client";

import { cn } from "@/lib/utils";

export function StatBox({
  label,
  value,
  color,
  onClick,
}: {
  label: string;
  value: number | string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] text-center",
        onClick &&
          "cursor-pointer hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border)] transition-colors",
      )}
      onClick={onClick}
      title={onClick ? `Filter shards by: ${label}` : undefined}
    >
      <div className="text-xl font-mono font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
    </div>
  );
}

"use client";

// EntityLink v3.0 - fully hardened with safe fallbacks for any type
import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Known entity types
type KnownEntityType =
  | "strategy"
  | "client"
  | "instrument"
  | "service"
  | "experiment"
  | "settlement"
  | "batch_job"
  | "run"
  | "venue"
  | "model";

interface EntityLinkProps {
  type: KnownEntityType | string; // Accept any string for forward compatibility
  id: string;
  label?: string;
  className?: string;
}

// Route generators for known types
const entityRoutes: Record<string, (id: string) => string> = {
  strategy: (id) => `/services/trading/strategies/${id}`,
  client: (id) => `/markets/pnl?client=${id}`,
  instrument: (id) => `/services/trading/strategies/instruments?q=${id}`,
  service: (id) => `/ops/services?service=${id}`,
  experiment: (id) => `/ml/experiments/${id}`,
  settlement: (id) => `/reports?settlement=${id}`,
  batch_job: (id) => `/ops/jobs?job=${id}`,
  run: (id) => `/positions?run=${id}`,
  venue: (id) => `/services/trading/strategies?venue=${id}`,
  model: (id) => `/ml/registry?model=${id}`,
};

// Colors for known types
const entityColors: Record<string, string> = {
  strategy: "var(--surface-strategy)",
  client: "var(--surface-markets)",
  instrument: "var(--chart-1)",
  service: "var(--surface-ops)",
  experiment: "var(--surface-ml)",
  settlement: "var(--surface-reports)",
  batch_job: "var(--surface-ops)",
  run: "var(--status-live)",
  venue: "var(--surface-strategy)",
  model: "var(--surface-ml)",
};

// Safe route generator - always returns a valid href
function getEntityHref(type: string, id: string): string {
  const routeFn = entityRoutes[type];
  if (typeof routeFn === "function") {
    return routeFn(id);
  }
  // Fallback for unknown types
  return `/?entity=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
}

// Safe color getter - always returns a valid color
function getEntityColor(type: string): string {
  return entityColors[type] || "var(--foreground)";
}

export function EntityLink({ type, id, label, className }: EntityLinkProps) {
  // SAFE: Use helper functions that handle all edge cases
  const href = getEntityHref(type, id);
  const color = getEntityColor(type);
  const displayLabel = label || id;

  return (
    <Link
      href={href}
      className={cn(
        "font-medium hover:underline underline-offset-2 transition-all duration-150 ease-out text-xs",
        className,
      )}
      style={{ color }}
    >
      {displayLabel}
    </Link>
  );
}

export function buildCrossLink(
  targetPath: string,
  params?: Record<string, string>,
): string {
  const url = new URL(targetPath, "http://localhost");
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  return `${url.pathname}${url.search}`;
}

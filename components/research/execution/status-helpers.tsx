import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Play, XCircle } from "lucide-react";
import type { ExecutionBacktest, ExecutionTrade } from "@/lib/build-mock-data";

// ─── Status config & badge ──────────────────────────────────────────────────

export const STATUS_CONFIG = {
  complete: {
    label: "Complete",
    badgeClass: "border-emerald-400/30 text-emerald-400",
    icon: CheckCircle2,
  },
  running: {
    label: "Running",
    badgeClass: "border-blue-400/30 text-blue-400",
    icon: Play,
  },
  failed: {
    label: "Failed",
    badgeClass: "border-red-400/30 text-red-400",
    icon: XCircle,
  },
} as const;

export function StatusBadge({
  status,
}: {
  status: ExecutionBacktest["status"];
}) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("text-xs gap-1", cfg.badgeClass)}>
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

// ─── MetricCard ─────────────────────────────────────────────────────────────

export function MetricCard({
  label,
  value,
  isGood,
  sub,
}: {
  label: string;
  value: string;
  isGood?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-3 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-bold tabular-nums",
          isGood === true
            ? "text-emerald-400"
            : isGood === false
              ? "text-red-400"
              : "",
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Chart style constants ──────────────────────────────────────────────────

export const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: 12,
  color: "var(--foreground)",
};

export const TICK_STYLE = { fontSize: 10, fill: "var(--foreground)" };

// ─── Algo color map ─────────────────────────────────────────────────────────

export const ALGO_COLORS: Record<string, string> = {
  VWAP: "#10b981",
  TWAP: "#22d3ee",
  "Aggressive Limit": "#f59e0b",
  Iceberg: "#a78bfa",
  "Passive Limit": "#64748b",
  "Market Only": "#ef4444",
};

// ─── CSV helpers ────────────────────────────────────────────────────────────

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Client-side CSV download for the visible trade log (mock-friendly). */
export function downloadExecutionTradesCsv(
  trades: ExecutionTrade[],
  filenameBase: string,
) {
  const headers: (keyof ExecutionTrade)[] = [
    "id",
    "timestamp",
    "signal",
    "instrument",
    "signal_price",
    "fill_price",
    "slippage_bps",
    "fill_time_ms",
    "venue",
    "algo",
    "quantity",
    "side",
    "commission",
    "market_impact_bps",
    "partial_fill_pct",
    "pnl",
    "cumulative_pnl",
    "model_confidence",
  ];
  const lines = [
    headers.join(","),
    ...trades.map((t) => headers.map((h) => escapeCsvCell(t[h])).join(",")),
  ];
  const csv = lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filenameBase}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

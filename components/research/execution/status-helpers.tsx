import type { ExecutionTrade } from "@/lib/mocks/fixtures/build-data";

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
export function downloadExecutionTradesCsv(trades: ExecutionTrade[], filenameBase: string) {
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
  const lines = [headers.join(","), ...trades.map((t) => headers.map((h) => escapeCsvCell(t[h])).join(","))];
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

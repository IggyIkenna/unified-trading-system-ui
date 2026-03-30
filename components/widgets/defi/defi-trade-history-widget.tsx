"use client";

/**
 * DeFi Trade History Widget — shows all executed instructions with instant P&L
 * decomposition and running totals.
 *
 * Columns: #, Time, Type, Algo, Venue, Amount, Expected, Actual, Slippage, Gas, Net P&L, Running
 */

import { Badge } from "@/components/ui/badge";
import { useDeFiData } from "./defi-data-context";

const TYPE_COLORS: Record<string, string> = {
  TRANSFER: "bg-slate-100 text-slate-700",
  SWAP: "bg-blue-100 text-blue-700",
  LEND: "bg-green-100 text-green-700",
  BORROW: "bg-amber-100 text-amber-700",
  WITHDRAW: "bg-orange-100 text-orange-700",
  REPAY: "bg-teal-100 text-teal-700",
  TRADE: "bg-purple-100 text-purple-700",
  STAKE: "bg-emerald-100 text-emerald-700",
  FLASH_BORROW: "bg-rose-100 text-rose-700",
  FLASH_REPAY: "bg-rose-100 text-rose-700",
  ADD_LIQUIDITY: "bg-cyan-100 text-cyan-700",
  REMOVE_LIQUIDITY: "bg-cyan-100 text-cyan-700",
  COLLECT_FEES: "bg-lime-100 text-lime-700",
};

function formatUsd(val: number): string {
  if (val === 0) return "$0";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "+";
  if (abs < 1) return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts.slice(11, 16);
  }
}

export function DeFiTradeHistoryWidget() {
  const { tradeHistory } = useDeFiData();

  if (!tradeHistory || tradeHistory.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No trade history yet. Execute a DeFi instruction to see results here.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-2">
      {/* Summary KPIs */}
      <div className="flex gap-4 text-xs">
        <div>
          <span className="text-muted-foreground">Trades: </span>
          <span className="font-medium">{tradeHistory.length}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Gas: </span>
          <span className="font-medium text-red-600">
            {formatUsd(-tradeHistory.reduce((s, r) => s + r.instant_pnl.gas_cost_usd, 0))}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Total Slippage: </span>
          <span className="font-medium text-red-600">
            {formatUsd(-tradeHistory.reduce((s, r) => s + r.instant_pnl.price_slippage_usd, 0))}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Net P&L: </span>
          <span className={`font-semibold ${tradeHistory[tradeHistory.length - 1].running_pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatUsd(tradeHistory[tradeHistory.length - 1].running_pnl)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background">
            <tr className="border-b text-left text-muted-foreground">
              <th className="px-1 py-1">#</th>
              <th className="px-1 py-1">Time</th>
              <th className="px-1 py-1">Type</th>
              <th className="px-1 py-1">Algo</th>
              <th className="px-1 py-1">Instrument</th>
              <th className="px-1 py-1 text-right">Amount</th>
              <th className="px-1 py-1 text-right">Expected</th>
              <th className="px-1 py-1 text-right">Actual</th>
              <th className="px-1 py-1 text-right">Slippage</th>
              <th className="px-1 py-1 text-right">Gas</th>
              <th className="px-1 py-1 text-right">Fees</th>
              <th className="px-1 py-1 text-right">Net P&L</th>
              <th className="px-1 py-1 text-right">Running</th>
              <th className="px-1 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {tradeHistory.map((row) => {
              const pnl = row.instant_pnl;
              return (
                <tr key={row.seq} className="border-b hover:bg-muted/50">
                  <td className="px-1 py-1 text-muted-foreground">{row.seq}</td>
                  <td className="px-1 py-1">{formatTime(row.timestamp)}</td>
                  <td className="px-1 py-1">
                    <Badge variant="outline" className={TYPE_COLORS[row.instruction_type] ?? ""}>
                      {row.instruction_type}
                    </Badge>
                  </td>
                  <td className="px-1 py-1 text-muted-foreground">{row.algo_type}</td>
                  <td className="px-1 py-1 max-w-[140px] truncate" title={row.instrument_id}>
                    {row.instrument_id.split(":").pop()?.split("@")[0] ?? row.instrument_id}
                  </td>
                  <td className="px-1 py-1 text-right font-mono">
                    {row.amount > 0 ? row.amount.toLocaleString() : "—"}
                  </td>
                  <td className="px-1 py-1 text-right font-mono">
                    {row.expected_output > 0 ? row.expected_output.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </td>
                  <td className="px-1 py-1 text-right font-mono">
                    {row.actual_output > 0 ? row.actual_output.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                  </td>
                  <td className={`px-1 py-1 text-right font-mono ${pnl.price_slippage_usd < 0 ? "text-red-600" : ""}`}>
                    {pnl.price_slippage_usd !== 0 ? formatUsd(-pnl.price_slippage_usd) : "—"}
                  </td>
                  <td className={`px-1 py-1 text-right font-mono ${pnl.gas_cost_usd > 0 ? "text-red-600" : ""}`}>
                    {pnl.gas_cost_usd > 0 ? formatUsd(-pnl.gas_cost_usd) : "—"}
                  </td>
                  <td className={`px-1 py-1 text-right font-mono ${pnl.trading_fee_usd > 0 ? "text-red-600" : ""}`}>
                    {pnl.trading_fee_usd > 0 ? formatUsd(-pnl.trading_fee_usd) : "—"}
                  </td>
                  <td className={`px-1 py-1 text-right font-mono font-medium ${pnl.net_pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatUsd(pnl.net_pnl)}
                  </td>
                  <td className={`px-1 py-1 text-right font-mono font-semibold ${row.running_pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatUsd(row.running_pnl)}
                  </td>
                  <td className="px-1 py-1">
                    <Badge
                      variant="outline"
                      className={
                        row.status === "filled"
                          ? "bg-green-100 text-green-700"
                          : row.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : row.status === "failed" || row.status === "reverted"
                              ? "bg-red-100 text-red-700"
                              : ""
                      }
                    >
                      {row.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

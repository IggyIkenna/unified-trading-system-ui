"use client";

import { cn } from "@/lib/utils";
import type { CapitalEfficiency } from "@/lib/backtest-analytics-types";

interface CapitalEfficiencySectionProps {
  data: CapitalEfficiency;
  showMargin?: boolean;
  className?: string;
}

function Row({
  label,
  all,
  long,
  short,
}: {
  label: string;
  all: string;
  long?: string;
  short?: string;
}) {
  return (
    <tr className="border-t border-border/30">
      <td className="py-1.5 text-xs text-muted-foreground pr-4">{label}</td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">
        {all}
      </td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">
        {long ?? "—"}
      </td>
      <td className="py-1.5 text-xs font-mono tabular-nums text-right px-3">
        {short ?? "—"}
      </td>
    </tr>
  );
}

export function CapitalEfficiencySection({
  data,
  showMargin = false,
  className,
}: CapitalEfficiencySectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Capital Usage
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-medium text-muted-foreground pb-2" />
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">
                  All
                </th>
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">
                  Long
                </th>
                <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">
                  Short
                </th>
              </tr>
            </thead>
            <tbody>
              <Row
                label="CAGR"
                all={`${data.cagr.toFixed(2)}%`}
                long={`${data.cagr_long.toFixed(2)}%`}
                short={`${data.cagr_short.toFixed(2)}%`}
              />
              <Row
                label="Return on initial capital"
                all={`${data.return_on_initial_capital.toFixed(2)}%`}
              />
              <Row
                label="Account size required"
                all={`$${data.account_size_required.toLocaleString()}`}
              />
              <Row
                label="Return on account size"
                all={`${data.return_on_account_size.toFixed(2)}%`}
              />
              <Row
                label="Net profit as % of largest loss"
                all={`${data.net_profit_pct_of_largest_loss.toFixed(1)}x`}
              />
            </tbody>
          </table>
        </div>
      </div>

      {showMargin && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Margin Usage
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-[11px] font-medium text-muted-foreground pb-2" />
                  <th className="text-right text-[11px] font-medium text-muted-foreground pb-2 px-3">
                    All
                  </th>
                </tr>
              </thead>
              <tbody>
                <Row label="Avg margin used" all="$0" />
                <Row label="Max margin used" all="$0" />
                <Row label="Margin efficiency" all="N/A" />
                <Row label="Margin calls" all="0" />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

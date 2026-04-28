"use client";

import { KpiTile } from "@/components/trading/sports/shared";
import type { Bookmaker } from "@/components/trading/sports/types";
import { BOOKMAKER_DISPLAY_NAMES } from "@/components/trading/sports/types";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";
import { useSportsData } from "./sports-data-context";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function SportsCLVWidget(_props: WidgetComponentProps) {
  const { clvRecords: records } = useSportsData();

  if (records.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">No CLV data available</p>
      </div>
    );
  }

  const totalBets = records.reduce((s, r) => s + r.totalBets, 0);
  const totalPnl = records.reduce((s, r) => s + r.totalPnl, 0);
  const avgClv = records.reduce((s, r) => s + r.meanClvPct * r.totalBets, 0) / (totalBets || 1);
  const avgHitRate = records.reduce((s, r) => s + r.clvHitRate * r.totalBets, 0) / (totalBets || 1);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">CLV Performance</span>
        <span className="ml-auto text-xs text-muted-foreground/70">
          {records[0]?.periodStart}: {records[0]?.periodEnd}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <KpiTile label="Total Bets" value={totalBets} valueClassName="text-foreground" />
        <KpiTile
          label="Net P&L"
          value={`£${formatNumber(totalPnl, 0)}`}
          valueClassName={totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]"}
        />
        <KpiTile label="Avg CLV" value={`+${formatNumber(avgClv, 1)}%`} valueClassName="text-primary" />
        <KpiTile label="CLV Hit Rate" value={formatPercent(avgHitRate, 1)} valueClassName="text-primary" />
      </div>

      <WidgetScroll axes="both" className="min-h-0 flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <th className="text-left px-2 py-2">Market</th>
              <th className="text-left px-2 py-2">Book</th>
              <th className="text-center px-2 py-2">Bets</th>
              <th className="text-center px-2 py-2">Beat Close</th>
              <th className="text-center px-2 py-2">Mean CLV</th>
              <th className="text-right px-2 py-2">P&L</th>
              <th className="text-right px-2 py-2">ROI</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-2 py-2 text-foreground font-medium">{r.marketType}</td>
                <td className="px-2 py-2 text-muted-foreground">
                  {BOOKMAKER_DISPLAY_NAMES[r.bookmakerKey as Bookmaker] ?? r.bookmakerKey}
                </td>
                <td className="text-center px-2 py-2 text-foreground/80 tabular-nums">{r.totalBets}</td>
                <td className="text-center px-2 py-2 tabular-nums">
                  <span
                    className={cn(
                      "font-bold",
                      r.clvHitRate >= 0.6
                        ? "text-[var(--pnl-positive)]"
                        : r.clvHitRate >= 0.5
                          ? "text-[var(--status-warning)]"
                          : "text-[var(--pnl-negative)]",
                    )}
                  >
                    {formatPercent(r.clvHitRate, 1)}
                  </span>
                </td>
                <td className="text-center px-2 py-2 text-primary font-bold tabular-nums">
                  +{formatNumber(r.meanClvPct, 1)}%
                </td>
                <td
                  className={cn(
                    "text-right px-2 py-2 font-bold tabular-nums",
                    r.totalPnl >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
                  )}
                >
                  £{formatNumber(r.totalPnl, 0)}
                </td>
                <td
                  className={cn(
                    "text-right px-2 py-2 font-bold tabular-nums",
                    r.roiPct >= 0 ? "text-[var(--pnl-positive)]" : "text-[var(--pnl-negative)]",
                  )}
                >
                  {formatNumber(r.roiPct, 1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </WidgetScroll>
    </div>
  );
}

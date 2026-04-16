"use client";

import { KpiTile } from "@/components/trading/sports/shared";
import type { Bookmaker } from "@/components/trading/sports/types";
import { BOOKMAKER_DISPLAY_NAMES } from "@/components/trading/sports/types";
import { MOCK_CLV_RECORDS } from "@/lib/mocks/fixtures/sports-data";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/utils/formatters";

export function SportsCLVWidget() {
  const records = MOCK_CLV_RECORDS;

  const totalBets = records.reduce((s, r) => s + r.totalBets, 0);
  const totalPnl = records.reduce((s, r) => s + r.totalPnl, 0);
  const totalStake = records.reduce((s, r) => s + r.totalStake, 0);
  const avgClv = records.reduce((s, r) => s + r.meanClvPct * r.totalBets, 0) / (totalBets || 1);
  const avgHitRate = records.reduce((s, r) => s + r.clvHitRate * r.totalBets, 0) / (totalBets || 1);

  return (
    <div className="flex flex-col h-full min-h-0 gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">CLV Performance</span>
        <span className="ml-auto text-xs text-zinc-600">{records[0]?.periodStart} — {records[0]?.periodEnd}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <KpiTile
          label="Total Bets"
          value={totalBets}
          valueClassName="text-white"
        />
        <KpiTile
          label="Net P&L"
          value={`£${formatNumber(totalPnl, 0)}`}
          valueClassName={totalPnl >= 0 ? "text-[#4ade80]" : "text-red-400"}
        />
        <KpiTile
          label="Avg CLV"
          value={`+${formatNumber(avgClv, 1)}%`}
          valueClassName="text-[#22d3ee]"
        />
        <KpiTile
          label="CLV Hit Rate"
          value={formatPercent(avgHitRate, 1)}
          valueClassName="text-[#22d3ee]"
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#0a0a0b] z-10">
            <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
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
              <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-2 py-2 text-zinc-200 font-medium">{r.marketType}</td>
                <td className="px-2 py-2 text-zinc-400">
                  {BOOKMAKER_DISPLAY_NAMES[r.bookmakerKey as Bookmaker] ?? r.bookmakerKey}
                </td>
                <td className="text-center px-2 py-2 text-zinc-300 tabular-nums">{r.totalBets}</td>
                <td className="text-center px-2 py-2 tabular-nums">
                  <span className={cn(
                    "font-bold",
                    r.clvHitRate >= 0.6 ? "text-[#4ade80]" : r.clvHitRate >= 0.5 ? "text-amber-400" : "text-red-400",
                  )}>
                    {formatPercent(r.clvHitRate, 1)}
                  </span>
                </td>
                <td className="text-center px-2 py-2 text-[#22d3ee] font-bold tabular-nums">
                  +{formatNumber(r.meanClvPct, 1)}%
                </td>
                <td className={cn(
                  "text-right px-2 py-2 font-bold tabular-nums",
                  r.totalPnl >= 0 ? "text-[#4ade80]" : "text-red-400",
                )}>
                  £{formatNumber(r.totalPnl, 0)}
                </td>
                <td className={cn(
                  "text-right px-2 py-2 font-bold tabular-nums",
                  r.roiPct >= 0 ? "text-[#4ade80]" : "text-red-400",
                )}>
                  {formatNumber(r.roiPct, 1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

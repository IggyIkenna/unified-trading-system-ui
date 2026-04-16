"use client";

import { FormDots, LeagueBadge } from "@/components/trading/sports/shared";
import type { FootballLeague, Standing } from "@/components/trading/sports/types";
import { MOCK_STANDINGS } from "@/lib/mocks/fixtures/sports-data";
import { cn } from "@/lib/utils";
import { useSportsData } from "./sports-data-context";

const LEAGUE_MAP: Record<string, FootballLeague> = {
  EPL: "EPL",
};

export function SportsStandingsWidget() {
  const { filters } = useSportsData();
  const selectedLeague = filters.leagues.length === 1 ? filters.leagues[0] : "EPL";
  const standings: Standing[] = MOCK_STANDINGS[selectedLeague] ?? MOCK_STANDINGS["EPL"] ?? [];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 shrink-0">
        <LeagueBadge league={LEAGUE_MAP[selectedLeague] ?? "EPL"} />
        <span className="text-xs font-black uppercase tracking-widest text-zinc-500">Standings</span>
        <span className="ml-auto text-xs text-zinc-600">2025/26</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#0a0a0b] z-10">
            <tr className="text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
              <th className="text-left px-3 py-2 w-8">#</th>
              <th className="text-left px-2 py-2">Team</th>
              <th className="text-center px-2 py-2 w-8">P</th>
              <th className="text-center px-2 py-2 w-8">W</th>
              <th className="text-center px-2 py-2 w-8">D</th>
              <th className="text-center px-2 py-2 w-8">L</th>
              <th className="text-center px-2 py-2 w-10">GD</th>
              <th className="text-center px-2 py-2 w-10 font-bold">Pts</th>
              <th className="text-center px-2 py-2 w-20">Form</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row) => (
              <tr
                key={row.teamId}
                className={cn(
                  "border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors",
                  row.rank <= 4 && "border-l-2 border-l-[#22d3ee]/60",
                  row.rank >= 18 && "border-l-2 border-l-red-500/60",
                )}
              >
                <td className="px-3 py-2 text-zinc-500 font-mono tabular-nums">{row.rank}</td>
                <td className="px-2 py-2 text-zinc-100 font-bold truncate max-w-[120px]">{row.teamName}</td>
                <td className="text-center px-2 py-2 text-zinc-400 tabular-nums">{row.played}</td>
                <td className="text-center px-2 py-2 text-zinc-400 tabular-nums">{row.wins}</td>
                <td className="text-center px-2 py-2 text-zinc-400 tabular-nums">{row.draws}</td>
                <td className="text-center px-2 py-2 text-zinc-400 tabular-nums">{row.losses}</td>
                <td
                  className={cn(
                    "text-center px-2 py-2 font-bold tabular-nums",
                    row.goalsDiff > 0 ? "text-[#4ade80]" : row.goalsDiff < 0 ? "text-red-400" : "text-zinc-500",
                  )}
                >
                  {row.goalsDiff > 0 ? `+${row.goalsDiff}` : row.goalsDiff}
                </td>
                <td className="text-center px-2 py-2 font-black text-white tabular-nums">{row.points}</td>
                <td className="px-2 py-2">
                  <FormDots form={row.form.split("") as ("W" | "D" | "L")[]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

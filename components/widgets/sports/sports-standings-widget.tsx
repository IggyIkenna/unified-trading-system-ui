"use client";

import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { FormDots, LeagueBadge } from "@/components/trading/sports/shared";
import type { FootballLeague, Standing } from "@/components/trading/sports/types";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useSportsData } from "./sports-data-context";

const LEAGUE_MAP: Record<string, FootballLeague> = {
  EPL: "EPL",
};

const columns: ColumnDef<Standing, unknown>[] = [
  {
    accessorKey: "rank",
    header: "#",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono tabular-nums">{row.getValue<number>("rank")}</span>
    ),
  },
  {
    accessorKey: "teamName",
    header: "Team",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-bold truncate max-w-[120px] block">{row.getValue<string>("teamName")}</span>
    ),
  },
  {
    accessorKey: "played",
    header: () => <span className="flex justify-center">P</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground tabular-nums">{row.getValue<number>("played")}</div>
    ),
  },
  {
    accessorKey: "wins",
    header: () => <span className="flex justify-center">W</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground tabular-nums">{row.getValue<number>("wins")}</div>
    ),
  },
  {
    accessorKey: "draws",
    header: () => <span className="flex justify-center">D</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground tabular-nums">{row.getValue<number>("draws")}</div>
    ),
  },
  {
    accessorKey: "losses",
    header: () => <span className="flex justify-center">L</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground tabular-nums">{row.getValue<number>("losses")}</div>
    ),
  },
  {
    accessorKey: "goalsDiff",
    header: () => <span className="flex justify-center">GD</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const gd = row.getValue<number>("goalsDiff");
      return (
        <div
          className={cn(
            "text-center font-bold tabular-nums",
            gd > 0 ? "text-[var(--pnl-positive)]" : gd < 0 ? "text-[var(--pnl-negative)]" : "text-muted-foreground",
          )}
        >
          {gd > 0 ? `+${gd}` : gd}
        </div>
      );
    },
  },
  {
    accessorKey: "points",
    header: () => <span className="flex justify-center font-bold">Pts</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-center font-black tabular-nums">{row.getValue<number>("points")}</div>,
  },
  {
    accessorKey: "form",
    header: () => <span className="flex justify-center">Form</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <FormDots form={row.getValue<string>("form").split("") as ("W" | "D" | "L")[]} />
      </div>
    ),
  },
];

export function SportsStandingsWidget() {
  const { filters, standings } = useSportsData();
  const selectedLeague = filters.leagues.length === 1 ? filters.leagues[0] : "EPL";

  const actionsConfig: TableActionsConfig = {
    extraActions: (
      <div className="flex items-center gap-2 shrink-0">
        <LeagueBadge league={LEAGUE_MAP[selectedLeague] ?? "EPL"} />
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Standings</span>
        <span className="text-xs text-muted-foreground">2025/26</span>
      </div>
    ),
  };

  return (
    <TableWidget
      columns={columns}
      data={standings}
      actions={actionsConfig}
      enableSorting
      enableColumnVisibility={false}
      emptyMessage="No standings available"
    />
  );
}

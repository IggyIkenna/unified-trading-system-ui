"use client";

import * as React from "react";
import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { formatCurrency } from "@/lib/reference-data";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/formatters";
import type { BalanceRecord } from "@/lib/types/accounts";
import type { ColumnDef } from "@tanstack/react-table";
import { useTierZeroScenario } from "@/lib/cockpit/use-tier-zero-scenario";
import { useAccountsData } from "./accounts-data-context";

interface BalanceRow extends BalanceRecord {
  marginUsed: number;
  marginTotal: number;
  utilization: number;
}

const columns: ColumnDef<BalanceRow, unknown>[] = [
  {
    accessorKey: "venue",
    header: "Venue",
    enableSorting: true,
    cell: ({ row }) => <span>{row.getValue<string>("venue")}</span>,
  },
  {
    accessorKey: "free",
    header: () => <span className="flex justify-end">Free</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">${formatCurrency(row.getValue<number>("free"))}</div>,
  },
  {
    accessorKey: "locked",
    header: () => <span className="flex justify-end">Locked</span>,
    enableSorting: true,
    cell: ({ row }) => <div className="text-right font-mono">${formatCurrency(row.getValue<number>("locked"))}</div>,
  },
  {
    accessorKey: "total",
    header: () => <span className="flex justify-end">Total</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono font-medium">${formatCurrency(row.getValue<number>("total"))}</div>
    ),
  },
  {
    accessorKey: "marginUsed",
    header: () => <span className="flex justify-end">Margin Used</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono">${formatCurrency(row.getValue<number>("marginUsed"))}</div>
    ),
  },
  {
    id: "marginAvail",
    header: () => <span className="flex justify-end">Margin Avail.</span>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right font-mono">${formatCurrency(row.original.margin_available ?? row.original.free)}</div>
    ),
  },
  {
    accessorKey: "utilization",
    header: () => <span className="flex justify-end">Utilization</span>,
    enableSorting: true,
    cell: ({ row }) => {
      const util = row.getValue<number>("utilization");
      return (
        <div className="flex justify-end">
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-micro",
              util >= 90
                ? "border-status-critical text-status-critical"
                : util >= 75
                  ? "border-status-warning text-status-warning"
                  : "border-status-live text-status-live",
            )}
          >
            {formatPercent(util, 0)}
          </Badge>
        </div>
      );
    },
  },
];

export function AccountsBalanceTableWidget(_props: WidgetComponentProps) {
  const { balances, isLoading, error, refetch } = useAccountsData();
  // 2026-05-01 migration: derive a per-venue balance row set from the
  // tier-zero strategies + positions when in cockpit. Each venue's balance
  // synthesises from sum-of-strategies (NAV) and sum-of-positions (locked).
  const tierZero = useTierZeroScenario();
  const useTierZero = tierZero.status === "match" && tierZero.strategies.length > 0;

  const tzRows: BalanceRow[] = React.useMemo(() => {
    if (!useTierZero) return [];
    const byVenue = new Map<string, { total: number; locked: number; assetGroup: string }>();
    for (const s of tierZero.strategies) {
      const cur = byVenue.get(s.venue) ?? { total: 0, locked: 0, assetGroup: s.assetGroup };
      cur.total += s.nav;
      byVenue.set(s.venue, cur);
    }
    for (const p of tierZero.positions) {
      const cur = byVenue.get(p.venue);
      if (cur) cur.locked += p.notional;
    }
    return Array.from(byVenue.entries()).map(([venue, agg]) => {
      const free = Math.max(0, agg.total - agg.locked);
      const marginUsed = agg.locked;
      const marginTotal = agg.total;
      const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
      return {
        venue,
        free,
        locked: agg.locked,
        total: agg.total,
        margin_used: marginUsed,
        margin_total: marginTotal,
        marginUsed,
        marginTotal,
        utilization,
        assetClass: agg.assetGroup,
      } as unknown as BalanceRow;
    });
  }, [useTierZero, tierZero.strategies, tierZero.positions]);

  const legacyRows: BalanceRow[] = React.useMemo(
    () =>
      balances.map((b) => {
        const marginUsed = b.margin_used ?? b.locked;
        const marginTotal = b.margin_total ?? b.total;
        const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
        return { ...b, marginUsed, marginTotal, utilization };
      }),
    [balances],
  );

  const rows = useTierZero ? tzRows : legacyRows;

  const actionsConfig: TableActionsConfig = {
    onRefresh: refetch,
  };

  return (
    <div data-testid="accounts-balance-table-widget" data-source={useTierZero ? "tier-zero" : "legacy"}>
      <TableWidget
        columns={columns}
        data={rows}
        actions={actionsConfig}
        isLoading={isLoading && !useTierZero}
        error={error && !useTierZero ? "Failed to load balances" : null}
        onRetry={refetch}
        emptyMessage="No balance data in scope"
        enableSorting
        enableColumnVisibility={false}
      />
    </div>
  );
}

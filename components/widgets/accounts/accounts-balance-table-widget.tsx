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
              "font-mono text-[10px]",
              util >= 90
                ? "border-[var(--status-error)] text-[var(--status-error)]"
                : util >= 75
                  ? "border-[var(--status-warning)] text-[var(--status-warning)]"
                  : "border-[var(--status-live)] text-[var(--status-live)]",
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

  const rows: BalanceRow[] = React.useMemo(
    () =>
      balances.map((b) => {
        const marginUsed = b.margin_used ?? b.locked;
        const marginTotal = b.margin_total ?? b.total;
        const utilization = marginTotal > 0 ? (marginUsed / marginTotal) * 100 : 0;
        return { ...b, marginUsed, marginTotal, utilization };
      }),
    [balances],
  );

  const actionsConfig: TableActionsConfig = {
    onRefresh: refetch,
  };

  return (
    <TableWidget
      columns={columns}
      data={rows}
      actions={actionsConfig}
      isLoading={isLoading}
      error={error ? "Failed to load balances" : null}
      onRetry={refetch}
      emptyMessage="No balance data available"
      enableSorting
      enableColumnVisibility={false}
    />
  );
}

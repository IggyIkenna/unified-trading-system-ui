"use client";

import * as React from "react";
import { TableWidget } from "@/components/shared/table-widget";
import type { TableActionsConfig, TableFilterConfig } from "@/components/shared/table-widget";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { TransferHistoryEntry } from "@/lib/types/accounts";
import { cn } from "@/lib/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useAccountsData } from "./accounts-data-context";

const columns: ColumnDef<TransferHistoryEntry, unknown>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs">{row.getValue<string>("timestamp")}</span>,
  },
  {
    accessorKey: "type",
    header: "Type",
    enableSorting: true,
    cell: ({ row }) => <span className="text-xs">{row.getValue<string>("type")}</span>,
  },
  {
    accessorKey: "from",
    header: "From",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue<string>("from")}</span>,
  },
  {
    accessorKey: "to",
    header: "To",
    enableSorting: false,
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue<string>("to")}</span>,
  },
  {
    accessorKey: "asset",
    header: "Asset",
    enableSorting: true,
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue<string>("asset")}</span>,
  },
  {
    accessorKey: "amount",
    header: () => <span className="flex justify-end">Amount</span>,
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-right font-mono text-xs">{row.getValue<number>("amount").toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      return (
        <Badge
          variant="outline"
          className={cn(
            "text-micro",
            status === "Completed" && "border-emerald-500/50 text-emerald-400",
            status === "Processing" && "border-amber-500/50 text-amber-400",
            status === "Pending" && "border-blue-500/50 text-blue-400",
          )}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "txHash",
    header: "Tx Hash",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.getValue<string>("txHash")}</span>
    ),
  },
];

export function AccountsTransferHistoryWidget(_props: WidgetComponentProps) {
  const { transferHistory, transferHistoryLoading, transferHistoryError, refetchTransferHistory } = useAccountsData();
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return transferHistory;
    return transferHistory.filter((t) => t.status === statusFilter);
  }, [transferHistory, statusFilter]);

  const filterConfig: TableFilterConfig = {
    selectFilters: [
      {
        value: statusFilter,
        onChange: setStatusFilter,
        placeholder: "Status",
        allLabel: "All Statuses",
        width: "w-32",
        options: [
          { value: "Completed", label: "Completed" },
          { value: "Processing", label: "Processing" },
          { value: "Pending", label: "Pending" },
        ],
      },
    ],
    activeFilterCount: statusFilter !== "all" ? 1 : 0,
    onReset: () => setStatusFilter("all"),
  };

  const actionsConfig: TableActionsConfig = {
    onRefresh: refetchTransferHistory,
  };

  return (
    <TableWidget
      columns={columns}
      data={filtered}
      filterConfig={filterConfig}
      actions={actionsConfig}
      isLoading={transferHistoryLoading}
      error={transferHistoryError ? "Could not load transfer history" : null}
      onRetry={refetchTransferHistory}
      emptyMessage="No transfers yet"
      enableSorting
      enableColumnVisibility={false}
    />
  );
}

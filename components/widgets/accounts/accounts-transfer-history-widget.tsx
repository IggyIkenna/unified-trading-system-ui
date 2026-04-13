"use client";

import { DataTableWidget, type DataTableColumn } from "@/components/shared/data-table-widget";
import { LiveFeedWidget } from "@/components/shared/live-feed-widget";
import { Badge } from "@/components/ui/badge";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import type { TransferHistoryEntry } from "@/lib/types/accounts";
import { cn } from "@/lib/utils";
import * as React from "react";

import { useAccountsData } from "./accounts-data-context";

export function AccountsTransferHistoryWidget(_props: WidgetComponentProps) {
  const { transferHistory, transferHistoryLoading, transferHistoryError, refetchTransferHistory } = useAccountsData();

  const columns: DataTableColumn<TransferHistoryEntry>[] = React.useMemo(
    () => [
      { key: "timestamp", label: "Time", accessor: "timestamp" },
      { key: "type", label: "Type", accessor: "type" },
      { key: "from", label: "From", accessor: (r) => <span className="font-mono">{r.from}</span> },
      { key: "to", label: "To", accessor: (r) => <span className="font-mono">{r.to}</span> },
      { key: "asset", label: "Asset", accessor: (r) => <span className="font-mono">{r.asset}</span> },
      {
        key: "amount",
        label: "Amount",
        accessor: (r) => <span className="font-mono text-right block">{r.amount.toLocaleString()}</span>,
        align: "right",
      },
      {
        key: "status",
        label: "Status",
        accessor: (r) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              r.status === "Completed" && "border-emerald-500/50 text-emerald-400",
              r.status === "Processing" && "border-amber-500/50 text-amber-400",
              r.status === "Pending" && "border-blue-500/50 text-blue-400",
            )}
          >
            {r.status}
          </Badge>
        ),
      },
      {
        key: "txHash",
        label: "Tx Hash",
        accessor: (r) => <span className="font-mono text-muted-foreground">{r.txHash}</span>,
      },
    ],
    [],
  );

  return (
    <LiveFeedWidget
      isLoading={transferHistoryLoading}
      error={transferHistoryError ? "Could not load transfer history" : null}
      onRetry={refetchTransferHistory}
      isEmpty={transferHistory.length === 0}
      emptyMessage="No transfers yet"
    >
      <DataTableWidget<TransferHistoryEntry>
        columns={columns}
        data={transferHistory}
        rowKey={(r, i) => `${r.txHash}-${i}`}
        compact
      />
    </LiveFeedWidget>
  );
}

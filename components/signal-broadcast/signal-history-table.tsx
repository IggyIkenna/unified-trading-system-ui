"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DeliveryStatus, SignalEmission } from "@/lib/signal-broadcast";
import { cn } from "@/lib/utils";

interface SignalHistoryTableProps {
  readonly emissions: readonly SignalEmission[];
  readonly entitledSlots: readonly string[];
  readonly maxRows?: number;
}

const STATUS_STYLE: Readonly<Record<DeliveryStatus, string>> = {
  delivered: "bg-green-500/15 text-green-600 dark:text-green-400",
  retrying: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  failed: "bg-red-500/15 text-red-600 dark:text-red-400",
  pending: "bg-muted text-muted-foreground",
};

const STATUS_LABEL: Readonly<Record<DeliveryStatus, string>> = {
  delivered: "Delivered",
  retrying: "Retrying",
  failed: "Failed",
  pending: "Pending",
};

const ALL_SENTINEL = "__all__";

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 19)}Z`;
}

export function SignalHistoryTable({
  emissions,
  entitledSlots,
  maxRows = 50,
}: SignalHistoryTableProps) {
  const [slotFilter, setSlotFilter] = useState<string>(ALL_SENTINEL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_SENTINEL);

  const scoped = useMemo(
    () => emissions.filter((e) => entitledSlots.includes(e.slot_label)),
    [emissions, entitledSlots],
  );

  const filtered = useMemo(() => {
    let rows = scoped;
    if (slotFilter !== ALL_SENTINEL) {
      rows = rows.filter((e) => e.slot_label === slotFilter);
    }
    if (statusFilter !== ALL_SENTINEL) {
      rows = rows.filter((e) => e.delivery_status === statusFilter);
    }
    return rows.slice(0, maxRows);
  }, [scoped, slotFilter, statusFilter, maxRows]);

  return (
    <Card
      data-testid="signal-broadcast-signal-history-table"
      className="overflow-hidden"
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Signal history</CardTitle>
            <CardDescription>
              Last {scoped.length} emissions scoped to your entitled slots.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <SelectTrigger
                className="w-[260px]"
                data-testid="signal-history-slot-filter"
              >
                <SelectValue placeholder="Filter by slot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>All slots</SelectItem>
                {entitledSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-[160px]"
                data-testid="signal-history-status-filter"
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SENTINEL}>All statuses</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="retrying">Retrying</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Payload summary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="font-mono">Idempotency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground"
                >
                  No emissions match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((emission) => (
                <TableRow
                  key={emission.emission_id}
                  data-testid={`signal-history-row-${emission.emission_id}`}
                >
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatTimestamp(emission.emission_timestamp)}
                  </TableCell>
                  <TableCell className="max-w-[240px] truncate font-mono text-xs">
                    {emission.slot_label}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {emission.signal_payload_summary}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "border-transparent",
                        STATUS_STYLE[emission.delivery_status],
                      )}
                      data-testid={`signal-history-status-${emission.emission_id}`}
                    >
                      {STATUS_LABEL[emission.delivery_status]}
                      {emission.delivery_attempt > 1 && (
                        <span className="ml-1 text-[10px] opacity-70">
                          (attempt {emission.delivery_attempt})
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {emission.idempotency_key}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
